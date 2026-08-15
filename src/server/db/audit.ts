import "server-only";

import { headers } from "next/headers";
import { getClientIp } from "@/server/auth/session";
import { getDatabase, initializeDatabase } from "@/server/db/database";
import { accountIdentifier, type AdminAuditEntry, type SessionUser } from "@/server/db/types";

function safeDetails(details: Record<string, unknown> | undefined): string | null {
  if (!details) return null;
  return JSON.stringify(details, (key, value) => {
    if (/password|token|secret/i.test(key)) return "[redacted]";
    return typeof value === "string" ? value.slice(0, 500) : value;
  }).slice(0, 2_000);
}

export async function writeAuditLog(input: {
  actor: SessionUser;
  action: string;
  targetUserId?: string;
  result: "success" | "failure";
  details?: Record<string, unknown>;
}): Promise<void> {
  await initializeDatabase();
  let ipAddress = "system";
  try { ipAddress = getClientIp(await headers()); } catch { /* no request scope */ }
  getDatabase()
    .prepare(
      `INSERT INTO admin_audit_logs (
        actor_user_id, actor_name, actor_identifier, action, target_user_id,
        result, ip_address, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.actor.id, input.actor.name, accountIdentifier(input.actor),
      input.action.slice(0, 100), input.targetUserId ?? null,
      input.result, ipAddress, safeDetails(input.details), new Date().toISOString(),
    );
}

export async function getRecentAuditLogs(targetUserId?: string, limit = 20): Promise<AdminAuditEntry[]> {
  await initializeDatabase();
  const database = getDatabase();
  const select = `SELECT id, actor_name AS actorName, actor_identifier AS actorIdentifier,
    action, target_user_id AS targetUserId, result, ip_address AS ipAddress,
    details, created_at AS createdAt FROM admin_audit_logs`;
  const rows = targetUserId
    ? database.prepare(`${select} WHERE target_user_id = ? ORDER BY created_at DESC LIMIT ?`).all(targetUserId, Math.min(limit, 100))
    : database.prepare(`${select} ORDER BY created_at DESC LIMIT ?`).all(Math.min(limit, 100));
  return rows as unknown as AdminAuditEntry[];
}
