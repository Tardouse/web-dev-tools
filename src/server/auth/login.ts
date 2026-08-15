import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createSession, getClientIp } from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/password";
import { getDatabase, initializeDatabase } from "@/server/db/database";
import { getSiteSettings } from "@/server/db/settings";
import type { SessionAudience, UserRole, UserStatus } from "@/server/db/types";

const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.3uD/E8ZgS5XrZ1FjQnKk8GvQhWgZt3e";

interface LoginUserRow {
  id: string;
  password_hash: string;
  password_version: number;
  must_change_password: number;
  status: UserStatus;
  role: UserRole;
  email_verified_at: string | null;
}

function attemptKey(audience: SessionAudience, identifier: string, ip: string): string {
  return createHash("sha256").update(`${audience}\0${identifier}\0${ip}`).digest("hex");
}

export type LoginResult =
  | { ok: true; mustChangePassword: boolean }
  | { ok: false; reason: "invalid" | "locked" | "unverified" };
export type AdminLoginResult =
  | { ok: true; mustChangePassword: boolean }
  | { ok: false; reason: "invalid" | "locked" };

async function authenticate(
  audience: SessionAudience,
  identifierValue: string,
  password: string,
): Promise<LoginResult> {
  const settings = await getSiteSettings();
  await initializeDatabase();
  const identifier = identifierValue.trim().toLowerCase();
  const ip = getClientIp(await headers());
  const key = attemptKey(audience, identifier, ip);
  const database = getDatabase();
  const now = new Date();
  const attempt = database
    .prepare("SELECT failures, first_failure_at, locked_until FROM login_attempts WHERE key_hash = ?")
    .get(key) as { failures: number; first_failure_at: string; locked_until: string | null } | undefined;
  if (attempt?.locked_until && Date.parse(attempt.locked_until) > now.getTime()) {
    await verifyPassword(password, DUMMY_HASH);
    return { ok: false, reason: "locked" };
  }

  const column = audience === "admin" ? "username" : "email";
  const user = database
    .prepare(
      `SELECT id, password_hash, password_version, must_change_password, status, role,
        email_verified_at
       FROM users WHERE ${column} = ? COLLATE NOCASE`,
    )
    .get(identifier) as LoginUserRow | undefined;
  const validRole = user && (audience === "admin" ? user.role !== "user" : user.role === "user");
  const validPassword = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !validRole || user.status !== "active" || !validPassword) {
    const withinWindow = attempt && now.getTime() - Date.parse(attempt.first_failure_at) <= FAILURE_WINDOW_MS;
    const failures = withinWindow ? attempt.failures + 1 : 1;
    const firstFailure = withinWindow ? attempt.first_failure_at : now.toISOString();
    const lockedUntil = failures >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS).toISOString() : null;
    database
      .prepare(
        `INSERT INTO login_attempts (key_hash, failures, first_failure_at, locked_until, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(key_hash) DO UPDATE SET failures = excluded.failures,
           first_failure_at = excluded.first_failure_at,
           locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
      )
      .run(key, failures, firstFailure, lockedUntil, now.toISOString());
    return { ok: false, reason: lockedUntil ? "locked" : "invalid" };
  }

  if (
    audience === "user" &&
    settings.emailVerificationEnabled &&
    !user.email_verified_at
  ) {
    database.prepare("DELETE FROM login_attempts WHERE key_hash = ?").run(key);
    return { ok: false, reason: "unverified" };
  }

  database.prepare("DELETE FROM login_attempts WHERE key_hash = ?").run(key);
  database.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?").run(now.toISOString(), now.toISOString(), user.id);
  await createSession(user.id, user.password_version, audience);
  return { ok: true, mustChangePassword: user.must_change_password === 1 };
}

export function authenticateUser(email: string, password: string): Promise<LoginResult> {
  return authenticate("user", email, password);
}

export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<AdminLoginResult> {
  const result = await authenticate("admin", username, password);
  if (!result.ok) {
    return { ok: false, reason: result.reason === "unverified" ? "invalid" : result.reason };
  }
  return result;
}
