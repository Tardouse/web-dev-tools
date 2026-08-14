// @vitest-environment node

import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canManageUser } from "@/lib/admin-permissions";
import { isStrongPassword, generateTemporaryPassword, hashPassword } from "@/server/auth/password";
import { closeDatabaseForTests, getDatabase, initializeDatabase, normalizeDatabasePath } from "@/server/db/database";
import { getDashboardData, recordPageView } from "@/server/db/metrics";
import { changeUserRole, deleteUser, resetUserPassword, setUserStatus } from "@/server/db/user-management";
import { getManagedUser, listUsers } from "@/server/db/users";
import type { SessionUser } from "@/server/db/types";

const actor: SessionUser = { id: randomUUID(), email: "root@example.com", name: "Root", role: "super_admin", status: "active", mustChangePassword: false };

beforeEach(async () => {
  closeDatabaseForTests();
  process.env.DATABASE_PATH = ":memory:";
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  await initializeDatabase();
});

afterEach(() => { closeDatabaseForTests(); vi.restoreAllMocks(); });

function addUser(input: { email: string; name: string; role?: "user" | "admin" | "super_admin"; status?: "active" | "disabled" }) {
  const now = new Date().toISOString();
  const id = randomUUID();
  getDatabase().prepare(`INSERT INTO users (id, email, name, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, 'hash', ?, ?, ?, ?)`).run(id, input.email, input.name, input.role ?? "user", input.status ?? "active", now, now);
  return id;
}

describe("admin password and permission rules", () => {
  it("preserves SQLite's in-memory sentinel path", () => {
    expect(normalizeDatabasePath(":memory:")).toBe(":memory:");
  });

  it("enforces the password policy and creates compliant temporary passwords", async () => {
    expect(isStrongPassword("short")).toBe(false);
    const password = generateTemporaryPassword();
    expect(isStrongPassword(password)).toBe(true);
    expect(await hashPassword(password)).not.toContain(password);
  });

  it("prevents self, equal, and higher-role management", () => {
    expect(canManageUser(actor, { id: actor.id, role: "super_admin" })).toBe(false);
    expect(canManageUser(actor, { id: randomUUID(), role: "admin" })).toBe(true);
    const admin = { ...actor, id: randomUUID(), role: "admin" as const };
    expect(canManageUser(admin, { id: randomUUID(), role: "user" })).toBe(true);
    expect(canManageUser(admin, { id: randomUUID(), role: "admin" })).toBe(false);
    expect(canManageUser(admin, { id: randomUUID(), role: "super_admin" })).toBe(false);
  });
});

describe("user queries", () => {
  it("searches, filters, paginates, and returns usage totals", async () => {
    const alex = addUser({ email: "alex@example.com", name: "Alex Chen" });
    addUser({ email: "disabled@example.com", name: "Disabled", status: "disabled" });
    getDatabase().prepare(`INSERT INTO tool_usage_events (tool_slug, user_id, visitor_id_hash, created_at) VALUES ('json-formatter', ?, 'visitor', ?)`).run(alex, new Date().toISOString());
    const result = await listUsers({ query: "alex", role: "user", status: "active", page: 1, pageSize: 1 });
    expect(result.total).toBe(1);
    expect(result.users[0]).toMatchObject({ email: "alex@example.com", toolUsageCount: 1 });
    const escaped = await listUsers({ query: "%", page: 1 });
    expect(escaped.total).toBe(0);
  });
});

describe("user mutations", () => {
  beforeEach(() => {
    const now = new Date().toISOString();
    getDatabase().prepare(`INSERT INTO users (id, email, name, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, 'hash', 'super_admin', 'active', ?, ?)`).run(actor.id, actor.email, actor.name, now, now);
  });

  it("disables users, changes roles, resets passwords, and revokes sessions", async () => {
    const id = addUser({ email: "member@example.com", name: "Member" });
    const now = new Date();
    getDatabase().prepare(`INSERT INTO sessions (token_hash, user_id, password_version, created_at, expires_at, last_active_at, ip_address, user_agent) VALUES ('token', ?, 1, ?, ?, ?, '127.0.0.1', 'test')`).run(id, now.toISOString(), new Date(now.getTime() + 60_000).toISOString(), now.toISOString());

    await setUserStatus(actor, id, "disabled");
    expect((await getManagedUser(id))?.status).toBe("disabled");
    expect((getDatabase().prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?").get(id) as { count: number }).count).toBe(0);

    await setUserStatus(actor, id, "active");
    await changeUserRole(actor, id, "admin");
    expect((await getManagedUser(id))?.role).toBe("admin");
    const temporaryPassword = await resetUserPassword(actor, id);
    expect(isStrongPassword(temporaryPassword)).toBe(true);
    expect((await getManagedUser(id))?.mustChangePassword).toBe(true);
    expect((getDatabase().prepare("SELECT COUNT(*) AS count FROM admin_audit_logs WHERE target_user_id = ? AND result = 'success'").get(id) as { count: number }).count).toBe(4);
  });

  it("deletes a manageable user while retaining an audit trail", async () => {
    const id = addUser({ email: "delete@example.com", name: "Delete Me" });
    await deleteUser(actor, id);
    expect(await getManagedUser(id)).toBeNull();
    const log = getDatabase().prepare("SELECT action, actor_email FROM admin_audit_logs WHERE target_user_id = ?").get(id) as { action: string; actor_email: string };
    expect(log).toEqual({ action: "user.delete", actor_email: actor.email });
  });

  it("rejects self-management and records the failed attempt", async () => {
    await expect(setUserStatus(actor, actor.id, "disabled")).rejects.toThrow(/cannot manage/i);
    const log = getDatabase().prepare("SELECT result FROM admin_audit_logs WHERE target_user_id = ?").get(actor.id) as { result: string };
    expect(log.result).toBe("failure");
  });
});

describe("dashboard metrics", () => {
  it("aggregates real traffic and tool events without sample values", async () => {
    await recordPageView({ path: "/zh/tools/json-formatter", visitorId: randomUUID(), toolSlug: "json-formatter" });
    await recordPageView({ path: "/zh", visitorId: randomUUID() });
    const dashboard = await getDashboardData(1);
    expect(dashboard).toMatchObject({ pageViews: 2, uniqueVisitors: 2, todayVisits: 2, toolUsageCount: 1 });
    expect(dashboard.popularTools[0]).toEqual({ slug: "json-formatter", count: 1 });
    expect(dashboard.filesProcessed).toBe(0);
  });
});
