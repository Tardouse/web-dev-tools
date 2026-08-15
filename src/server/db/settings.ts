import "server-only";

import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from "@/lib/site-settings";
import type { SessionUser } from "@/server/db/types";
import { writeAuditLog } from "@/server/db/audit";
import { getDatabase, initializeDatabase } from "@/server/db/database";

const text = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

export const siteSettingsSchema = z.object({
  siteName: text(2, 80),
  logoText: text(1, 12),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("/") ||
        (z.url().safeParse(value).success &&
          ["http:", "https:"].includes(new URL(value).protocol)),
      "Logo URL must be empty, site-relative, or an absolute URL.",
    ),
  descriptionEn: text(10, 500),
  descriptionZh: text(5, 500),
  footerEn: text(3, 300),
  footerZh: text(2, 300),
  legalText: z.string().trim().max(500),
  contactEmail: z.union([z.literal(""), z.email().trim().max(254)]),
  registrationEnabled: z.boolean(),
  emailVerificationEnabled: z.boolean(),
  defaultToolLimit: z.number().int().min(1024).max(100 * 1024 * 1024),
  fileUploadLimit: z.number().int().min(1024).max(100 * 1024 * 1024),
  anonymousApiLimit: z.number().int().min(1).max(100_000),
  userApiLimit: z.number().int().min(1).max(100_000),
  adsEnabled: z.boolean(),
  maintenanceMode: z.boolean(),
});

interface SettingsRow {
  site_name: string;
  logo_text: string;
  logo_url: string;
  description_en: string;
  description_zh: string;
  footer_en: string;
  footer_zh: string;
  legal_text: string;
  contact_email: string;
  registration_enabled: number;
  email_verification_enabled: number;
  default_tool_limit: number;
  file_upload_limit: number;
  anonymous_api_limit: number;
  user_api_limit: number;
  ads_enabled: number;
  maintenance_mode: number;
}

export class SettingsError extends Error {
  constructor(
    message: string,
    readonly code: "invalid" | "forbidden" = "invalid",
  ) {
    super(message);
    this.name = "SettingsError";
  }
}

function fromRow(row: SettingsRow): SiteSettings {
  return {
    siteName: row.site_name,
    logoText: row.logo_text,
    logoUrl: row.logo_url,
    descriptionEn: row.description_en,
    descriptionZh: row.description_zh,
    footerEn: row.footer_en,
    footerZh: row.footer_zh,
    legalText: row.legal_text,
    contactEmail: row.contact_email,
    registrationEnabled: row.registration_enabled === 1,
    emailVerificationEnabled: row.email_verification_enabled === 1,
    defaultToolLimit: row.default_tool_limit,
    fileUploadLimit: row.file_upload_limit,
    anonymousApiLimit: row.anonymous_api_limit,
    userApiLimit: row.user_api_limit,
    adsEnabled: row.ads_enabled === 1,
    maintenanceMode: row.maintenance_mode === 1,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  await initializeDatabase();
  const row = getDatabase()
    .prepare("SELECT * FROM system_settings WHERE id = 1")
    .get() as SettingsRow | undefined;
  return row ? fromRow(row) : { ...DEFAULT_SITE_SETTINGS };
}

export async function updateSiteSettings(
  actor: SessionUser,
  input: unknown,
): Promise<SiteSettings> {
  if (actor.role !== "super_admin") {
    await writeAuditLog({
      actor,
      action: "settings.update",
      result: "failure",
      details: { reason: "Super Admin access required." },
    });
    throw new SettingsError("Super Admin access required.", "forbidden");
  }
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    await writeAuditLog({
      actor,
      action: "settings.update",
      result: "failure",
      details: { reason: "Invalid settings payload." },
    });
    throw new SettingsError("Invalid settings payload.");
  }
  await initializeDatabase();
  const value = parsed.data;
  getDatabase()
    .prepare(
      `INSERT INTO system_settings (
        id, site_name, logo_text, logo_url, description_en, description_zh,
        footer_en, footer_zh, legal_text, contact_email,
        registration_enabled, email_verification_enabled, default_tool_limit,
        file_upload_limit, anonymous_api_limit, user_api_limit, ads_enabled,
        maintenance_mode, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        site_name = excluded.site_name, logo_text = excluded.logo_text,
        logo_url = excluded.logo_url, description_en = excluded.description_en,
        description_zh = excluded.description_zh, footer_en = excluded.footer_en,
        footer_zh = excluded.footer_zh, legal_text = excluded.legal_text,
        contact_email = excluded.contact_email,
        registration_enabled = excluded.registration_enabled,
        email_verification_enabled = excluded.email_verification_enabled,
        default_tool_limit = excluded.default_tool_limit,
        file_upload_limit = excluded.file_upload_limit,
        anonymous_api_limit = excluded.anonymous_api_limit,
        user_api_limit = excluded.user_api_limit,
        ads_enabled = excluded.ads_enabled,
        maintenance_mode = excluded.maintenance_mode,
        updated_at = excluded.updated_at`,
    )
    .run(
      value.siteName,
      value.logoText,
      value.logoUrl,
      value.descriptionEn,
      value.descriptionZh,
      value.footerEn,
      value.footerZh,
      value.legalText,
      value.contactEmail,
      Number(value.registrationEnabled),
      Number(value.emailVerificationEnabled),
      value.defaultToolLimit,
      value.fileUploadLimit,
      value.anonymousApiLimit,
      value.userApiLimit,
      Number(value.adsEnabled),
      Number(value.maintenanceMode),
      new Date().toISOString(),
    );
  await writeAuditLog({
    actor,
    action: "settings.update",
    result: "success",
    details: {
      registrationEnabled: value.registrationEnabled,
      emailVerificationEnabled: value.emailVerificationEnabled,
      adsEnabled: value.adsEnabled,
      maintenanceMode: value.maintenanceMode,
    },
  });
  return value;
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

export interface ApiRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
}

export async function consumeApiRateLimit(input: {
  identifier: string;
  authenticated: boolean;
  now?: Date;
}): Promise<ApiRateLimitResult> {
  const settings = await getSiteSettings();
  const limit = input.authenticated
    ? settings.userApiLimit
    : settings.anonymousApiLimit;
  const now = input.now ?? new Date();
  const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  const resetAt = new Date(windowStart.getTime() + 60_000);
  const keyHash = createHash("sha256")
    .update(`api\0${input.authenticated ? "user" : "anonymous"}\0${input.identifier}`)
    .digest("hex");
  const database = getDatabase();
  const count = transaction(database, () => {
    const row = database
      .prepare(
        "SELECT request_count, window_started_at FROM api_rate_limits WHERE key_hash = ?",
      )
      .get(keyHash) as
      | { request_count: number; window_started_at: string }
      | undefined;
    const inWindow = row?.window_started_at === windowStart.toISOString();
    const requestCount = inWindow ? row.request_count + 1 : 1;
    database
      .prepare(
        `INSERT INTO api_rate_limits (
          key_hash, request_count, window_started_at, updated_at
        ) VALUES (?, ?, ?, ?)
        ON CONFLICT(key_hash) DO UPDATE SET
          request_count = excluded.request_count,
          window_started_at = excluded.window_started_at,
          updated_at = excluded.updated_at`,
      )
      .run(
        keyHash,
        requestCount,
        windowStart.toISOString(),
        now.toISOString(),
      );
    return requestCount;
  });
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt: resetAt.toISOString(),
  };
}
