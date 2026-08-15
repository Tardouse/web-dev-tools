// @vitest-environment node

import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";
import { tools as coreTools } from "@/lib/tool-registry";
import { searchToolDefinitions } from "@/lib/tool-search";
import { registerUser } from "@/server/auth/user-accounts";
import {
  closeDatabaseForTests,
  getDatabase,
  initializeDatabase,
} from "@/server/db/database";
import {
  consumeApiRateLimit,
  getSiteSettings,
  updateSiteSettings,
} from "@/server/db/settings";
import {
  createManagedTool,
  deleteManagedTool,
  getManagedTool,
  getPublicTool,
  getPublicCategories,
  getPublicTools,
  resetManagedTool,
  updateManagedTool,
} from "@/server/db/tool-management";
import type { SessionUser } from "@/server/db/types";

const superAdmin: SessionUser = {
  id: randomUUID(),
  email: null,
  username: "root",
  name: "Root",
  role: "super_admin",
  status: "active",
  mustChangePassword: false,
};
const admin: SessionUser = {
  ...superAdmin,
  id: randomUUID(),
  username: "operator",
  name: "Operator",
  role: "admin",
};

function addActor(actor: SessionUser): void {
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO users (
        id, email, username, name, password_hash, role, status, created_at, updated_at
      ) VALUES (?, NULL, ?, ?, 'hash', ?, 'active', ?, ?)`,
    )
    .run(actor.id, actor.username, actor.name, actor.role, now, now);
}

beforeEach(async () => {
  closeDatabaseForTests();
  process.env.DATABASE_PATH = ":memory:";
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD;
  await initializeDatabase();
  addActor(superAdmin);
  addActor(admin);
});

afterEach(() => {
  closeDatabaseForTests();
  vi.restoreAllMocks();
});

describe("system settings", () => {
  it("uses safe defaults and only lets a Super Admin update them", async () => {
    await expect(getSiteSettings()).resolves.toEqual(DEFAULT_SITE_SETTINGS);
    await expect(
      updateSiteSettings(admin, {
        ...DEFAULT_SITE_SETTINGS,
        siteName: "Forbidden",
      }),
    ).rejects.toMatchObject({ code: "forbidden" });

    const updated = await updateSiteSettings(superAdmin, {
      ...DEFAULT_SITE_SETTINGS,
      siteName: "Engineering Tools",
      registrationEnabled: false,
      fileUploadLimit: 2 * 1024 * 1024,
      anonymousApiLimit: 2,
    });
    expect(updated).toMatchObject({
      siteName: "Engineering Tools",
      registrationEnabled: false,
      fileUploadLimit: 2 * 1024 * 1024,
      anonymousApiLimit: 2,
    });
    expect(await getSiteSettings()).toEqual(updated);
  });

  it("rejects unsafe logo protocols and keeps verification state reversible", async () => {
    await expect(
      updateSiteSettings(superAdmin, {
        ...DEFAULT_SITE_SETTINGS,
        logoUrl: "javascript:alert(1)",
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    const now = new Date().toISOString();
    const legacyId = randomUUID();
    getDatabase()
      .prepare(
        `INSERT INTO users (
          id, email, username, name, password_hash, role, status,
          email_verified_at, created_at, updated_at
        ) VALUES (?, 'legacy@example.com', NULL, 'Legacy', 'hash', 'user',
          'active', NULL, ?, ?)`,
      )
      .run(legacyId, now, now);
    await updateSiteSettings(superAdmin, {
      ...DEFAULT_SITE_SETTINGS,
      emailVerificationEnabled: false,
    });
    expect(
      getDatabase()
        .prepare("SELECT email_verified_at FROM users WHERE id = ?")
        .get(legacyId),
    ).toEqual({ email_verified_at: null });
    const registration = await registerUser(
      {
        name: "New Member",
        email: "new-member@example.com",
        password: "Strong-Member-Password-2026!",
      },
      "192.0.2.20",
    );
    expect(registration).toMatchObject({
      ok: true,
      verificationRequired: false,
    });
  });

  it("blocks registration in the DAL when the public switch is off", async () => {
    await updateSiteSettings(superAdmin, {
      ...DEFAULT_SITE_SETTINGS,
      registrationEnabled: false,
    });
    await expect(
      registerUser(
        {
          name: "Blocked Member",
          email: "blocked@example.com",
          password: "Strong-Member-Password-2026!",
        },
        "192.0.2.21",
      ),
    ).resolves.toEqual({ ok: false, reason: "disabled" });
  });

  it("enforces configurable minute windows without storing identifiers", async () => {
    await updateSiteSettings(superAdmin, {
      ...DEFAULT_SITE_SETTINGS,
      anonymousApiLimit: 2,
      userApiLimit: 3,
    });
    const now = new Date("2026-08-15T12:00:15.000Z");
    expect(
      await consumeApiRateLimit({
        identifier: "192.0.2.10",
        authenticated: false,
        now,
      }),
    ).toMatchObject({ allowed: true, limit: 2, remaining: 1 });
    await consumeApiRateLimit({
      identifier: "192.0.2.10",
      authenticated: false,
      now,
    });
    expect(
      await consumeApiRateLimit({
        identifier: "192.0.2.10",
        authenticated: false,
        now,
      }),
    ).toMatchObject({ allowed: false, limit: 2, remaining: 0 });
    const row = getDatabase()
      .prepare("SELECT key_hash FROM api_rate_limits")
      .get() as { key_hash: string };
    expect(row.key_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(row.key_hash).not.toContain("192.0.2.10");
    expect(
      await consumeApiRateLimit({
        identifier: "192.0.2.10",
        authenticated: false,
        now: new Date("2026-08-15T12:01:00.000Z"),
      }),
    ).toMatchObject({ allowed: true, remaining: 1 });
  });
});

describe("tool management", () => {
  it("overrides, disables, and restores a core tool", async () => {
    const original = await getManagedTool("json-formatter");
    expect(original).toMatchObject({ source: "core", customized: false });
    await updateManagedTool(superAdmin, "json-formatter", {
      ...original,
      nameEn: "JSON Studio",
      nameZh: "JSON 工作台",
      enabled: false,
      featured: false,
    });
    expect(await getManagedTool("json-formatter")).toMatchObject({
      nameEn: "JSON Studio",
      enabled: false,
      customized: true,
    });
    expect(await getPublicTool("json-formatter", "en")).toBeUndefined();

    await resetManagedTool(superAdmin, "json-formatter");
    expect(await getManagedTool("json-formatter")).toMatchObject({
      nameEn: "JSON Formatter",
      enabled: true,
      customized: false,
    });
  });

  it("creates a bilingual custom tool backed by a working core engine", async () => {
    await createManagedTool(admin, {
      slug: "team-json",
      implementation: "json-formatter",
      nameEn: "Team JSON Formatter",
      nameZh: "团队 JSON 格式化",
      shortNameEn: "Team JSON",
      shortNameZh: "团队 JSON",
      descriptionEn: "Format shared JSON fixtures with the standard formatter engine.",
      descriptionZh: "使用标准格式化引擎处理团队共享的 JSON 数据。",
      category: "json-data",
      keywordsEn: ["json", "team"],
      keywordsZh: ["json", "团队"],
      seoTitleEn: "Team JSON Formatter Online",
      seoTitleZh: "团队 JSON 在线格式化",
      seoDescriptionEn: "Format team JSON fixtures locally in your browser.",
      seoDescriptionZh: "在浏览器本地格式化团队 JSON 数据。",
      maxInputSize: 2 * 1024 * 1024,
      requiresLogin: true,
      freeToUse: true,
      enabled: true,
      featured: true,
      sortOrder: 15,
    });
    expect(await getPublicTool("team-json", "zh")).toMatchObject({
      slug: "team-json",
      implementation: "json-formatter",
      name: "团队 JSON 格式化",
      requiresLogin: true,
    });
    expect((await getPublicTools("en")).length).toBe(coreTools.length + 1);
    expect(
      searchToolDefinitions(
        await getPublicTools("en"),
        await getPublicCategories("en"),
        "团队",
      ).map((tool) => tool.slug),
    ).toContain("team-json");

    await deleteManagedTool(admin, "team-json");
    expect(await getManagedTool("team-json")).toBeNull();
  });

  it("caps file tools with the global upload limit", async () => {
    await updateSiteSettings(superAdmin, {
      ...DEFAULT_SITE_SETTINGS,
      fileUploadLimit: 1024 * 1024,
    });
    expect(await getPublicTool("archive-workbench", "en")).toMatchObject({
      maxInputSize: 1024 * 1024,
    });
  });

  it("audits rejected tool mutations", async () => {
    await expect(
      createManagedTool(admin, {
        slug: "broken tool",
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    expect(
      getDatabase()
        .prepare(
          `SELECT action, result FROM admin_audit_logs
           WHERE action = 'tool.create' ORDER BY id DESC LIMIT 1`,
        )
        .get(),
    ).toEqual({ action: "tool.create", result: "failure" });
  });
});
