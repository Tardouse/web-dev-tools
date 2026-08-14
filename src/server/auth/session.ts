import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getDatabase, initializeDatabase } from "@/server/db/database";
import type { SessionUser, UserRole, UserStatus } from "@/server/db/types";

export const SESSION_COOKIE = "devtoolbox-session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

export function hashOpaqueValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getClientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip")?.trim() || "unknown";
}

export async function createSession(
  userId: string,
  passwordVersion: number,
): Promise<void> {
  await initializeDatabase();
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_SECONDS * 1000);
  const headerList = await headers();
  getDatabase()
    .prepare(
      `INSERT INTO sessions (
        token_hash, user_id, password_version, created_at, expires_at,
        last_active_at, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      hashOpaqueValue(token),
      userId,
      passwordVersion,
      now.toISOString(),
      expiresAt.toISOString(),
      now.toISOString(),
      getClientIp(headerList),
      headerList.get("user-agent")?.slice(0, 300) || "unknown",
    );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
    priority: "high",
  });
}

export async function deleteCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await initializeDatabase();
    getDatabase()
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .run(hashOpaqueValue(token));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await initializeDatabase();
  getDatabase().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

interface SessionRow {
  token_hash: string;
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  must_change_password: number;
  session_password_version: number;
  user_password_version: number;
  expires_at: string;
  last_active_at: string;
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await initializeDatabase();
  const database = getDatabase();
  const row = database
    .prepare(
      `SELECT sessions.token_hash, sessions.password_version AS session_password_version,
        sessions.expires_at, sessions.last_active_at,
        users.id, users.email, users.name, users.role, users.status,
        users.must_change_password, users.password_version AS user_password_version
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`,
    )
    .get(hashOpaqueValue(token)) as SessionRow | undefined;
  if (
    !row ||
    row.status !== "active" ||
    row.session_password_version !== row.user_password_version ||
    Date.parse(row.expires_at) <= Date.now()
  ) {
    if (row) {
      database
        .prepare("DELETE FROM sessions WHERE token_hash = ?")
        .run(row.token_hash);
    }
    return null;
  }
  if (Date.now() - Date.parse(row.last_active_at) > 5 * 60 * 1000) {
    database
      .prepare("UPDATE sessions SET last_active_at = ? WHERE token_hash = ?")
      .run(new Date().toISOString(), row.token_hash);
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    mustChangePassword: row.must_change_password === 1,
  };
});
