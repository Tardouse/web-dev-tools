import "server-only";

import { getDatabase, initializeDatabase } from "@/server/db/database";
import {
  USER_ROLES,
  type ManagedUser,
  type SessionUser,
  type UserRole,
  type UserStatus,
} from "@/server/db/types";
import { z } from "zod";

const listSchema = z.object({
  query: z.string().trim().max(100).default(""),
  role: z.enum(["all", ...USER_ROLES]).default("all"),
  status: z.enum(["all", "active", "disabled"]).default("all"),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export interface UserListFilters {
  query?: string;
  role?: "all" | UserRole;
  status?: "all" | UserStatus;
  page?: number;
  pageSize?: number;
}

export interface UserListResult {
  users: ManagedUser[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  filters: Required<UserListFilters>;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  must_change_password: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  tool_usage_count: number;
}

function toManagedUser(row: UserRow): ManagedUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    mustChangePassword: row.must_change_password === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    toolUsageCount: row.tool_usage_count,
  };
}

export async function listUsers(
  input: UserListFilters,
): Promise<UserListResult> {
  await initializeDatabase();
  const filters = listSchema.parse(input) as Required<UserListFilters>;
  const clauses: string[] = [];
  const values: Array<string | number> = [];
  if (filters.query) {
    clauses.push("(users.email LIKE ? ESCAPE '\\' OR users.name LIKE ? ESCAPE '\\')");
    const escaped = filters.query.replace(/[\\%_]/g, "\\$&");
    values.push(`%${escaped}%`, `%${escaped}%`);
  }
  if (filters.role !== "all") {
    clauses.push("users.role = ?");
    values.push(filters.role);
  }
  if (filters.status !== "all") {
    clauses.push("users.status = ?");
    values.push(filters.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const database = getDatabase();
  const count = database
    .prepare(`SELECT COUNT(*) AS count FROM users ${where}`)
    .get(...values) as { count: number };
  const pageCount = Math.max(1, Math.ceil(count.count / filters.pageSize));
  const page = Math.min(filters.page, pageCount);
  const rows = database
    .prepare(
      `SELECT users.id, users.email, users.name, users.role, users.status,
        users.must_change_password, users.created_at, users.updated_at,
        users.last_login_at, COUNT(tool_usage_events.id) AS tool_usage_count
       FROM users
       LEFT JOIN tool_usage_events ON tool_usage_events.user_id = users.id
       ${where}
       GROUP BY users.id
       ORDER BY users.created_at DESC, users.id
       LIMIT ? OFFSET ?`,
    )
    .all(...values, filters.pageSize, (page - 1) * filters.pageSize) as unknown as UserRow[];
  return {
    users: rows.map(toManagedUser),
    total: count.count,
    page,
    pageSize: filters.pageSize,
    pageCount,
    filters: { ...filters, page },
  };
}

export async function getManagedUser(
  userId: string,
): Promise<ManagedUser | null> {
  await initializeDatabase();
  const row = getDatabase()
    .prepare(
      `SELECT users.id, users.email, users.name, users.role, users.status,
        users.must_change_password, users.created_at, users.updated_at,
        users.last_login_at, COUNT(tool_usage_events.id) AS tool_usage_count
       FROM users
       LEFT JOIN tool_usage_events ON tool_usage_events.user_id = users.id
       WHERE users.id = ?
       GROUP BY users.id`,
    )
    .get(userId) as UserRow | undefined;
  return row ? toManagedUser(row) : null;
}

export async function getSessionUserById(
  userId: string,
): Promise<SessionUser | null> {
  await initializeDatabase();
  const row = getDatabase()
    .prepare(
      `SELECT id, email, name, role, status, must_change_password
       FROM users WHERE id = ?`,
    )
    .get(userId) as
    | {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        status: UserStatus;
        must_change_password: number;
      }
    | undefined;
  return row
    ? {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        status: row.status,
        mustChangePassword: row.must_change_password === 1,
      }
    : null;
}

export async function getUserToolSummary(userId: string): Promise<
  Array<{ slug: string; count: number; lastUsedAt: string }>
> {
  await initializeDatabase();
  return getDatabase()
    .prepare(
      `SELECT tool_slug AS slug, COUNT(*) AS count, MAX(created_at) AS lastUsedAt
       FROM tool_usage_events WHERE user_id = ?
       GROUP BY tool_slug ORDER BY count DESC, lastUsedAt DESC LIMIT 10`,
    )
    .all(userId) as unknown as Array<{
    slug: string;
    count: number;
    lastUsedAt: string;
  }>;
}

export async function getUserSessions(userId: string): Promise<
  Array<{
    createdAt: string;
    expiresAt: string;
    lastActiveAt: string;
    ipAddress: string;
    userAgent: string;
  }>
> {
  await initializeDatabase();
  return getDatabase()
    .prepare(
      `SELECT created_at AS createdAt, expires_at AS expiresAt,
        last_active_at AS lastActiveAt, ip_address AS ipAddress,
        user_agent AS userAgent
       FROM sessions WHERE user_id = ? ORDER BY last_active_at DESC LIMIT 10`,
    )
    .all(userId) as unknown as Array<{
    createdAt: string;
    expiresAt: string;
    lastActiveAt: string;
    ipAddress: string;
    userAgent: string;
  }>;
}
