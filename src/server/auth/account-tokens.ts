import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import type { Locale } from "@/i18n";
import { hashPassword, passwordSchema } from "@/server/auth/password";
import { getDatabase, initializeDatabase } from "@/server/db/database";
import { getSiteSettings } from "@/server/db/settings";
import {
  sendAccountEmail,
  type AccountEmailPurpose,
} from "@/server/email/account-email";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const VERIFY_TOKEN_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_MS = 60 * 60 * 1000;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_REQUEST_LIMIT = 3;
const IP_REQUEST_LIMIT = 10;
const emailSchema = z.email().trim().max(254).transform((value) => value.toLowerCase());

export type AccountTokenStatus = "valid" | "invalid" | "expired" | "used";
export type AccountEmailDelivery = "sent" | "limited" | "failed";

interface TokenRow {
  token_hash: string;
  user_id: string;
  purpose: AccountEmailPurpose;
  expires_at: string;
  consumed_at: string | null;
  role: "user" | "admin" | "super_admin";
  status: "active" | "disabled";
  email_verified_at: string | null;
}

interface UserEmailRow {
  id: string;
  email: string;
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function transaction<T>(database: DatabaseSync, operation: () => T): T {
  database.exec("BEGIN IMMEDIATE;");
  try {
    const result = operation();
    database.exec("COMMIT;");
    return result;
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  }
}

function limitKey(action: AccountEmailPurpose, scope: "email" | "ip", value: string): string {
  return hashValue(`${action}\0${scope}\0${value}`);
}

function consumeRequestLimit(
  action: AccountEmailPurpose,
  email: string,
  ip: string,
  now: Date,
): boolean {
  const database = getDatabase();
  const rules = [
    { key: limitKey(action, "email", email), maximum: EMAIL_REQUEST_LIMIT },
    { key: limitKey(action, "ip", ip), maximum: IP_REQUEST_LIMIT },
  ];
  return transaction(database, () => {
    let allowed = true;
    for (const rule of rules) {
      const row = database
        .prepare("SELECT attempts, window_started_at FROM account_request_limits WHERE key_hash = ?")
        .get(rule.key) as { attempts: number; window_started_at: string } | undefined;
      const inWindow = row
        && now.getTime() - Date.parse(row.window_started_at) < REQUEST_WINDOW_MS;
      const attempts = inWindow ? row.attempts + 1 : 1;
      if (attempts > rule.maximum) allowed = false;
      database
        .prepare(
          `INSERT INTO account_request_limits (
            key_hash, action, attempts, window_started_at, updated_at
          ) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(key_hash) DO UPDATE SET action = excluded.action,
            attempts = excluded.attempts,
            window_started_at = excluded.window_started_at,
            updated_at = excluded.updated_at`,
        )
        .run(
          rule.key,
          action,
          attempts,
          inWindow ? row.window_started_at : now.toISOString(),
          now.toISOString(),
        );
    }
    return allowed;
  });
}

function tokenRow(token: string, purpose: AccountEmailPurpose): TokenRow | undefined {
  if (!TOKEN_PATTERN.test(token)) return undefined;
  return getDatabase()
    .prepare(
      `SELECT account_tokens.token_hash, account_tokens.user_id,
        account_tokens.purpose, account_tokens.expires_at,
        account_tokens.consumed_at, users.role, users.status,
        users.email_verified_at
       FROM account_tokens
       JOIN users ON users.id = account_tokens.user_id
       WHERE account_tokens.token_hash = ? AND account_tokens.purpose = ?`,
    )
    .get(hashValue(token), purpose) as TokenRow | undefined;
}

function rowStatus(row: TokenRow | undefined, purpose: AccountEmailPurpose): AccountTokenStatus {
  if (!row || row.role !== "user" || row.status !== "active") return "invalid";
  if (row.consumed_at) return "used";
  if (Date.parse(row.expires_at) <= Date.now()) return "expired";
  if (purpose === "email_verification" && row.email_verified_at) return "used";
  return "valid";
}

async function issueAndSend(
  user: UserEmailRow,
  purpose: AccountEmailPurpose,
  locale: Locale,
  now = new Date(),
): Promise<Exclude<AccountEmailDelivery, "limited">> {
  const database = getDatabase();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    now.getTime() + (purpose === "email_verification" ? VERIFY_TOKEN_MS : RESET_TOKEN_MS),
  );
  transaction(database, () => {
    database
      .prepare(
        `UPDATE account_tokens SET consumed_at = ?
         WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL`,
      )
      .run(now.toISOString(), user.id, purpose);
    database
      .prepare(
        `INSERT INTO account_tokens (
          token_hash, user_id, purpose, created_at, expires_at, consumed_at
        ) VALUES (?, ?, ?, ?, ?, NULL)`,
      )
      .run(hashValue(token), user.id, purpose, now.toISOString(), expiresAt.toISOString());
  });
  try {
    await sendAccountEmail({
      to: user.email,
      purpose,
      locale,
      token,
      expiresAt: expiresAt.toISOString(),
    });
    return "sent";
  } catch {
    return "failed";
  }
}

async function prepareRequest(
  purpose: AccountEmailPurpose,
  emailValue: string,
  ip: string,
): Promise<{ email: string; allowed: boolean }> {
  await initializeDatabase();
  const parsed = emailSchema.safeParse(emailValue);
  if (!parsed.success) return { email: "invalid", allowed: false };
  const now = new Date();
  const old = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  getDatabase().prepare("DELETE FROM account_request_limits WHERE updated_at < ?").run(old);
  getDatabase().prepare("DELETE FROM account_tokens WHERE expires_at < ?").run(old);
  return {
    email: parsed.data,
    allowed: consumeRequestLimit(purpose, parsed.data, ip, now),
  };
}

export async function sendRegistrationVerification(
  userId: string,
  emailValue: string,
  locale: Locale,
  ip: string,
): Promise<AccountEmailDelivery> {
  if (!(await getSiteSettings()).emailVerificationEnabled) return "failed";
  const request = await prepareRequest("email_verification", emailValue, ip);
  if (!request.allowed) return "limited";
  const user = getDatabase()
    .prepare(
      `SELECT id, email FROM users
       WHERE id = ? AND email = ? COLLATE NOCASE AND role = 'user'
         AND status = 'active' AND email_verified_at IS NULL`,
    )
    .get(userId, request.email) as UserEmailRow | undefined;
  return user ? issueAndSend(user, "email_verification", locale) : "failed";
}

export async function requestEmailVerification(
  emailValue: string,
  locale: Locale,
  ip: string,
): Promise<void> {
  if (!(await getSiteSettings()).emailVerificationEnabled) return;
  const request = await prepareRequest("email_verification", emailValue, ip);
  if (!request.allowed) return;
  const user = getDatabase()
    .prepare(
      `SELECT id, email FROM users
       WHERE email = ? COLLATE NOCASE AND role = 'user'
         AND status = 'active' AND email_verified_at IS NULL`,
    )
    .get(request.email) as UserEmailRow | undefined;
  if (user) await issueAndSend(user, "email_verification", locale);
}

export async function requestPasswordReset(
  emailValue: string,
  locale: Locale,
  ip: string,
): Promise<void> {
  const request = await prepareRequest("password_reset", emailValue, ip);
  if (!request.allowed) return;
  const verificationEnabled = (await getSiteSettings()).emailVerificationEnabled;
  const user = getDatabase()
    .prepare(
      `SELECT id, email FROM users
       WHERE email = ? COLLATE NOCASE AND role = 'user'
         AND status = 'active'
         AND (? = 0 OR email_verified_at IS NOT NULL)`,
    )
    .get(request.email, Number(verificationEnabled)) as UserEmailRow | undefined;
  if (user) await issueAndSend(user, "password_reset", locale);
}

export async function inspectAccountToken(
  token: string,
  purpose: AccountEmailPurpose,
): Promise<AccountTokenStatus> {
  await initializeDatabase();
  return rowStatus(tokenRow(token, purpose), purpose);
}

export async function consumeEmailVerification(
  token: string,
): Promise<Exclude<AccountTokenStatus, "valid"> | "success"> {
  await initializeDatabase();
  const database = getDatabase();
  return transaction(database, () => {
    const row = tokenRow(token, "email_verification");
    const status = rowStatus(row, "email_verification");
    if (status !== "valid") return status;
    if (!row) return "invalid";
    const now = new Date().toISOString();
    database
      .prepare("UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?")
      .run(now, now, row.user_id);
    database
      .prepare("UPDATE account_tokens SET consumed_at = ? WHERE token_hash = ?")
      .run(now, row.token_hash);
    return "success";
  });
}

export async function consumePasswordReset(
  token: string,
  passwordValue: string,
): Promise<Exclude<AccountTokenStatus, "valid"> | "invalid_password" | "success"> {
  const password = passwordSchema.safeParse(passwordValue);
  if (!password.success) return "invalid_password";
  await initializeDatabase();
  const initial = tokenRow(token, "password_reset");
  const initialStatus = rowStatus(initial, "password_reset");
  if (initialStatus !== "valid") return initialStatus;
  const passwordHash = await hashPassword(password.data);
  const database = getDatabase();
  return transaction(database, () => {
    const row = tokenRow(token, "password_reset");
    const status = rowStatus(row, "password_reset");
    if (status !== "valid") return status;
    if (!row) return "invalid";
    const now = new Date().toISOString();
    database
      .prepare(
        `UPDATE users SET password_hash = ?, password_version = password_version + 1,
          must_change_password = 0, updated_at = ? WHERE id = ?`,
      )
      .run(passwordHash, now, row.user_id);
    database
      .prepare(
        `UPDATE account_tokens SET consumed_at = ?
         WHERE user_id = ? AND purpose = 'password_reset' AND consumed_at IS NULL`,
      )
      .run(now, row.user_id);
    database.prepare("DELETE FROM sessions WHERE user_id = ?").run(row.user_id);
    return "success";
  });
}
