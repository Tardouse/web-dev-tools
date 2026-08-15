import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { hashPassword, passwordSchema } from "@/server/auth/password";
import { getDatabase, initializeDatabase } from "@/server/db/database";

export const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().max(254).transform((value) => value.toLowerCase()),
  password: passwordSchema,
});

export type RegistrationResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: "exists" | "limited" | "invalid" };

export async function registerUser(input: unknown, ip: string): Promise<RegistrationResult> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  await initializeDatabase();
  const database = getDatabase();
  const key = createHash("sha256").update(`register\0${ip}`).digest("hex");
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const attempts = database
    .prepare("SELECT failures, updated_at FROM login_attempts WHERE key_hash = ?")
    .get(key) as { failures: number; updated_at: string } | undefined;
  if (attempts && attempts.failures >= 10 && attempts.updated_at >= since) {
    return { ok: false, reason: "limited" };
  }
  if (database.prepare("SELECT 1 FROM users WHERE email = ? COLLATE NOCASE").get(parsed.data.email)) {
    return { ok: false, reason: "exists" };
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO users (
        id, email, username, name, password_hash, role, status,
        must_change_password, password_version, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, 'user', 'active', 0, 1, ?, ?)`,
    )
    .run(id, parsed.data.email, parsed.data.name, await hashPassword(parsed.data.password), now, now);
  database
    .prepare(
      `INSERT INTO login_attempts (key_hash, failures, first_failure_at, locked_until, updated_at)
       VALUES (?, 1, ?, NULL, ?)
       ON CONFLICT(key_hash) DO UPDATE SET failures = failures + 1, updated_at = excluded.updated_at`,
    )
    .run(key, now, now);
  return { ok: true, userId: id, email: parsed.data.email };
}
