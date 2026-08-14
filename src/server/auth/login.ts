import "server-only";

import { createHash } from "node:crypto";
import { getDatabase, initializeDatabase } from "@/server/db/database";
import { createSession, getClientIp } from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/password";
import { headers } from "next/headers";

const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const DUMMY_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEe.3uD/E8ZgS5XrZ1FjQnKk8GvQhWgZt3e";

interface LoginUserRow {
  id: string;
  password_hash: string;
  password_version: number;
  status: "active" | "disabled";
  role: "user" | "admin" | "super_admin";
}

function attemptKey(email: string, ip: string): string {
  return createHash("sha256")
    .update(`${email}\0${ip}`)
    .digest("hex");
}

export type LoginResult =
  | { ok: true; mustChangePassword: boolean }
  | { ok: false; reason: "invalid" | "locked" | "disabled" | "forbidden" };

export async function authenticateAdmin(
  emailValue: string,
  password: string,
): Promise<LoginResult> {
  await initializeDatabase();
  const email = emailValue.trim().toLowerCase();
  const headerList = await headers();
  const ip = getClientIp(headerList);
  const key = attemptKey(email, ip);
  const database = getDatabase();
  const now = new Date();
  const attempt = database
    .prepare(
      "SELECT failures, first_failure_at, locked_until FROM login_attempts WHERE key_hash = ?",
    )
    .get(key) as
    | { failures: number; first_failure_at: string; locked_until: string | null }
    | undefined;
  if (attempt?.locked_until && Date.parse(attempt.locked_until) > now.getTime()) {
    await verifyPassword(password, DUMMY_HASH);
    return { ok: false, reason: "locked" };
  }

  const user = database
    .prepare(
      `SELECT id, password_hash, password_version, status, role
       FROM users WHERE email = ?`,
    )
    .get(email) as LoginUserRow | undefined;
  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) {
    const withinWindow =
      attempt &&
      now.getTime() - Date.parse(attempt.first_failure_at) <= FAILURE_WINDOW_MS;
    const failures = withinWindow ? attempt.failures + 1 : 1;
    const firstFailure = withinWindow
      ? attempt.first_failure_at
      : now.toISOString();
    const lockedUntil =
      failures >= MAX_FAILURES
        ? new Date(now.getTime() + LOCK_MS).toISOString()
        : null;
    database
      .prepare(
        `INSERT INTO login_attempts (
          key_hash, failures, first_failure_at, locked_until, updated_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key_hash) DO UPDATE SET failures = excluded.failures,
          first_failure_at = excluded.first_failure_at,
          locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
      )
      .run(key, failures, firstFailure, lockedUntil, now.toISOString());
    return { ok: false, reason: lockedUntil ? "locked" : "invalid" };
  }
  if (user.status !== "active") return { ok: false, reason: "disabled" };
  if (user.role === "user") return { ok: false, reason: "forbidden" };

  database.prepare("DELETE FROM login_attempts WHERE key_hash = ?").run(key);
  database
    .prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?")
    .run(now.toISOString(), now.toISOString(), user.id);
  await createSession(user.id, user.password_version);
  const mustChange = database
    .prepare("SELECT must_change_password FROM users WHERE id = ?")
    .get(user.id) as { must_change_password: number };
  return { ok: true, mustChangePassword: mustChange.must_change_password === 1 };
}
