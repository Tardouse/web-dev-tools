// @vitest-environment node

import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canManageUser } from "@/lib/admin-permissions";
import { generateTemporaryPassword, hashPassword, isStrongPassword } from "@/server/auth/password";
import { closeDatabaseForTests, getDatabase, initializeDatabase, normalizeDatabasePath, usernamePattern } from "@/server/db/database";
import { getDashboardData, recordPageView } from "@/server/db/metrics";
import { changeUserRole, createManagedUser, deleteUser, resetUserPassword, setUserStatus } from "@/server/db/user-management";
import { getManagedUser, listUsers } from "@/server/db/users";
import type { SessionUser } from "@/server/db/types";

const actor: SessionUser = { id: randomUUID(), email: null, username: "root", name: "Root", role: "super_admin", status: "active", mustChangePassword: false };
beforeEach(async () => {
  closeDatabaseForTests(); process.env.DATABASE_PATH = ":memory:";
  delete process.env.ADMIN_USERNAME; delete process.env.ADMIN_PASSWORD;
  await initializeDatabase();
});
afterEach(() => { closeDatabaseForTests(); vi.restoreAllMocks(); });
function addUser(input: { email: string; name: string; status?: "active" | "disabled" }) {
  const now = new Date().toISOString(); const id = randomUUID();
  getDatabase().prepare(`INSERT INTO users (id, email, username, name, password_hash, role, status, created_at, updated_at) VALUES (?, ?, NULL, ?, 'hash', 'user', ?, ?, ?)`).run(id, input.email, input.name, input.status ?? "active", now, now);
  return id;
}
function addActor() {
  const now = new Date().toISOString();
  getDatabase().prepare(`INSERT INTO users (id, email, username, name, password_hash, role, status, created_at, updated_at) VALUES (?, NULL, ?, ?, 'hash', 'super_admin', 'active', ?, ?)`).run(actor.id, actor.username, actor.name, now, now);
}

describe("account model", () => {
  it("preserves memory paths and validates admin usernames", () => {
    expect(normalizeDatabasePath(":memory:")).toBe(":memory:");
    expect(usernamePattern.test("admin.root-1")).toBe(true);
    expect(usernamePattern.test("admin@example.com")).toBe(false);
  });
  it("enforces strong temporary passwords", async () => {
    expect(isStrongPassword("short")).toBe(false);
    const password = generateTemporaryPassword();
    expect(isStrongPassword(password)).toBe(true);
    expect(await hashPassword(password)).not.toContain(password);
  });
  it("keeps permission hierarchy", () => {
    expect(canManageUser(actor, { id: actor.id, role: "super_admin" })).toBe(false);
    expect(canManageUser(actor, { id: randomUUID(), role: "admin" })).toBe(true);
    const admin = { ...actor, id: randomUUID(), role: "admin" as const };
    expect(canManageUser(admin, { id: randomUUID(), role: "user" })).toBe(true);
    expect(canManageUser(admin, { id: randomUUID(), role: "admin" })).toBe(false);
  });
});

describe("user queries and mutations", () => {
  beforeEach(addActor);
  it("searches normal users and returns usage totals", async () => {
    const alex = addUser({ email: "alex@example.com", name: "Alex Chen" });
    getDatabase().prepare(`INSERT INTO tool_usage_events (tool_slug, user_id, visitor_id_hash, created_at) VALUES ('json-formatter', ?, 'visitor', ?)`).run(alex, new Date().toISOString());
    const result = await listUsers({ query: "alex", role: "user", status: "active", pageSize: 1 });
    expect(result.users[0]).toMatchObject({ email: "alex@example.com", username: null, toolUsageCount: 1 });
  });
  it("creates a normal user with a temporary password and audit identifier", async () => {
    const result = await createManagedUser(actor, { name: "New User", email: "new@example.com" });
    expect(isStrongPassword(result.temporaryPassword)).toBe(true);
    expect(await getManagedUser(result.userId)).toMatchObject({ role: "user", email: "new@example.com", mustChangePassword: true });
    const log = getDatabase().prepare("SELECT actor_identifier FROM admin_audit_logs WHERE target_user_id = ?").get(result.userId) as { actor_identifier: string };
    expect(log.actor_identifier).toBe("root");
  });
  it("disables, promotes, resets, and revokes sessions", async () => {
    const id = addUser({ email: "member@example.com", name: "Member" }); const now = new Date();
    getDatabase().prepare(`INSERT INTO sessions (token_hash, user_id, audience, password_version, created_at, expires_at, last_active_at, ip_address, user_agent) VALUES ('token', ?, 'user', 1, ?, ?, ?, '127.0.0.1', 'test')`).run(id, now.toISOString(), new Date(now.getTime() + 60_000).toISOString(), now.toISOString());
    await setUserStatus(actor, id, "disabled");
    expect((await getManagedUser(id))?.status).toBe("disabled");
    expect((getDatabase().prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?").get(id) as { count: number }).count).toBe(0);
    await setUserStatus(actor, id, "active"); await changeUserRole(actor, id, "admin");
    expect((await getManagedUser(id))?.role).toBe("admin");
    expect(isStrongPassword(await resetUserPassword(actor, id))).toBe(true);
  });
  it("deletes users while retaining username-based audit", async () => {
    const id = addUser({ email: "delete@example.com", name: "Delete Me" });
    await deleteUser(actor, id); expect(await getManagedUser(id)).toBeNull();
    const log = getDatabase().prepare("SELECT action, actor_identifier FROM admin_audit_logs WHERE target_user_id = ?").get(id) as { action: string; actor_identifier: string };
    expect(log).toEqual({ action: "user.delete", actor_identifier: "root" });
  });
  it("rejects self-management", async () => {
    await expect(setUserStatus(actor, actor.id, "disabled")).rejects.toThrow(/cannot manage/i);
  });
});

describe("dashboard metrics", () => {
  it("aggregates real traffic without samples", async () => {
    await recordPageView({ path: "/zh/tools/json-formatter", visitorId: randomUUID(), toolSlug: "json-formatter" });
    await recordPageView({ path: "/zh", visitorId: randomUUID() });
    const dashboard = await getDashboardData(1);
    expect(dashboard).toMatchObject({ pageViews: 2, uniqueVisitors: 2, todayVisits: 2, toolUsageCount: 1, filesProcessed: 0 });
  });
});
