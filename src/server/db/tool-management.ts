import "server-only";

import { z } from "zod";
import type { Locale } from "@/i18n";
import { localizeCategory, localizeTool } from "@/i18n/tool-metadata";
import { categories, tools as coreTools } from "@/lib/tool-registry";
import type {
  ManagedToolConfiguration,
  ToolConfigurationInput,
} from "@/lib/tool-admin";
import type { ToolCategory, ToolCategoryId, ToolDefinition } from "@/lib/types";
import { writeAuditLog } from "@/server/db/audit";
import { getDatabase, initializeDatabase } from "@/server/db/database";
import { getSiteSettings } from "@/server/db/settings";
import type { SessionUser } from "@/server/db/types";

const categoryIds = categories.map((category) => category.id) as [
  ToolCategoryId,
  ...ToolCategoryId[],
];
const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const shortText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);
const keywordsSchema = z
  .array(z.string().trim().min(1).max(50))
  .min(1)
  .max(30)
  .transform((values) => [...new Set(values)]);

export const toolConfigurationSchema = z.object({
  slug: slugSchema,
  implementation: slugSchema,
  nameEn: shortText(2, 80),
  nameZh: shortText(1, 80),
  shortNameEn: shortText(1, 40),
  shortNameZh: shortText(1, 40),
  descriptionEn: shortText(10, 500),
  descriptionZh: shortText(5, 500),
  category: z.enum(categoryIds),
  keywordsEn: keywordsSchema,
  keywordsZh: keywordsSchema,
  seoTitleEn: shortText(5, 120),
  seoTitleZh: shortText(3, 120),
  seoDescriptionEn: shortText(10, 300),
  seoDescriptionZh: shortText(5, 300),
  maxInputSize: z
    .number()
    .int()
    .min(1024)
    .max(100 * 1024 * 1024),
  maxOutputSize: z
    .number()
    .int()
    .min(1024)
    .max(100 * 1024 * 1024),
  maxExecutionTime: z.number().int().min(100).max(120_000),
  maxConcurrency: z.number().int().min(1).max(16),
  requiresLogin: z.boolean(),
  freeToUse: z.boolean(),
  enabled: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(100_000),
});

interface ToolRow {
  slug: string;
  implementation_slug: string;
  is_custom: number;
  name_en: string;
  name_zh: string;
  short_name_en: string;
  short_name_zh: string;
  description_en: string;
  description_zh: string;
  category: ToolCategoryId;
  keywords_en: string;
  keywords_zh: string;
  seo_title_en: string;
  seo_title_zh: string;
  seo_description_en: string;
  seo_description_zh: string;
  max_input_size: number;
  max_output_size: number;
  max_execution_time: number;
  max_concurrency: number;
  requires_login: number;
  free_to_use: number;
  enabled: number;
  featured: number;
  sort_order: number;
}

export class ToolManagementError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid"
      | "not_found"
      | "exists"
      | "core_delete"
      | "forbidden" = "invalid",
  ) {
    super(message);
    this.name = "ToolManagementError";
  }
}

function parseKeywords(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function coreConfiguration(tool: ToolDefinition): ManagedToolConfiguration {
  const zh = localizeTool(tool, "zh");
  return {
    slug: tool.slug,
    implementation: tool.slug,
    source: "core",
    nameEn: tool.name,
    nameZh: zh.name,
    shortNameEn: tool.shortName,
    shortNameZh: zh.shortName,
    descriptionEn: tool.description,
    descriptionZh: zh.description,
    category: tool.category,
    keywordsEn: tool.keywords,
    keywordsZh: zh.keywords,
    seoTitleEn: tool.seoTitle,
    seoTitleZh: zh.seoTitle,
    seoDescriptionEn: tool.seoDescription,
    seoDescriptionZh: zh.seoDescription,
    maxInputSize: tool.maxInputSize,
    maxOutputSize: tool.maxOutputSize,
    maxExecutionTime: tool.maxExecutionTime,
    maxConcurrency: tool.maxConcurrency,
    requiresLogin: tool.requiresLogin,
    freeToUse: tool.freeToUse ?? true,
    enabled: tool.enabled,
    featured: tool.featured ?? false,
    sortOrder: tool.sortOrder,
    customized: false,
  };
}

function rowConfiguration(row: ToolRow): ManagedToolConfiguration {
  return {
    slug: row.slug,
    implementation: row.implementation_slug,
    source: row.is_custom === 1 ? "custom" : "core",
    nameEn: row.name_en,
    nameZh: row.name_zh,
    shortNameEn: row.short_name_en,
    shortNameZh: row.short_name_zh,
    descriptionEn: row.description_en,
    descriptionZh: row.description_zh,
    category: row.category,
    keywordsEn: parseKeywords(row.keywords_en),
    keywordsZh: parseKeywords(row.keywords_zh),
    seoTitleEn: row.seo_title_en,
    seoTitleZh: row.seo_title_zh,
    seoDescriptionEn: row.seo_description_en,
    seoDescriptionZh: row.seo_description_zh,
    maxInputSize: row.max_input_size,
    maxOutputSize: row.max_output_size,
    maxExecutionTime: row.max_execution_time,
    maxConcurrency: row.max_concurrency,
    requiresLogin: row.requires_login === 1,
    freeToUse: row.free_to_use === 1,
    enabled: row.enabled === 1,
    featured: row.featured === 1,
    sortOrder: row.sort_order,
    customized: true,
  };
}

async function configurationMap(): Promise<
  Map<string, ManagedToolConfiguration>
> {
  await initializeDatabase();
  const rows = getDatabase()
    .prepare("SELECT * FROM tool_configurations")
    .all() as unknown as ToolRow[];
  return new Map(rows.map((row) => [row.slug, rowConfiguration(row)]));
}

export async function listManagedTools(): Promise<ManagedToolConfiguration[]> {
  const rows = await configurationMap();
  const result = coreTools.map(
    (tool) => rows.get(tool.slug) ?? coreConfiguration(tool),
  );
  for (const row of rows.values()) {
    if (row.source === "custom") result.push(row);
  }
  return result.sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.slug.localeCompare(right.slug),
  );
}

export async function getManagedTool(
  slug: string,
): Promise<ManagedToolConfiguration | null> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return null;
  const tools = await listManagedTools();
  return tools.find((tool) => tool.slug === parsed.data) ?? null;
}

function toDefinition(
  config: ManagedToolConfiguration,
  locale: Locale,
  fileUploadLimit: number,
): ToolDefinition | null {
  const implementation = coreTools.find(
    (tool) => tool.slug === config.implementation,
  );
  if (!implementation) return null;
  const localizedImplementation = localizeTool(implementation, locale);
  const zh = locale === "zh";
  return {
    ...localizedImplementation,
    id: config.slug,
    slug: config.slug,
    implementation: config.implementation,
    name: zh ? config.nameZh : config.nameEn,
    shortName: zh ? config.shortNameZh : config.shortNameEn,
    description: zh ? config.descriptionZh : config.descriptionEn,
    category: config.category,
    keywords: zh ? config.keywordsZh : config.keywordsEn,
    aliases: [
      ...(localizedImplementation.aliases ?? []),
      config.nameEn,
      config.shortNameEn,
      config.nameZh,
      config.shortNameZh,
      ...config.keywordsEn,
      ...config.keywordsZh,
    ],
    requiresLogin: config.requiresLogin,
    freeToUse: config.freeToUse,
    maxInputSize:
      config.category === "files"
        ? Math.min(config.maxInputSize, fileUploadLimit)
        : config.maxInputSize,
    maxOutputSize: config.maxOutputSize,
    maxExecutionTime: config.maxExecutionTime,
    maxConcurrency: config.maxConcurrency,
    enabled: config.enabled,
    featured: config.featured,
    sortOrder: config.sortOrder,
    seoTitle: zh ? config.seoTitleZh : config.seoTitleEn,
    seoDescription: zh ? config.seoDescriptionZh : config.seoDescriptionEn,
    related: localizedImplementation.related.filter(
      (related) => related !== config.slug,
    ),
  };
}

export async function getPublicTools(
  locale: Locale,
): Promise<ToolDefinition[]> {
  const [managed, settings] = await Promise.all([
    listManagedTools(),
    getSiteSettings(),
  ]);
  return managed
    .filter((tool) => tool.enabled)
    .map((tool) => toDefinition(tool, locale, settings.fileUploadLimit))
    .filter((tool): tool is ToolDefinition => tool !== null)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.slug.localeCompare(right.slug),
    );
}

export async function getPublicTool(
  slug: string,
  locale: Locale,
): Promise<ToolDefinition | undefined> {
  return (await getPublicTools(locale)).find((tool) => tool.slug === slug);
}

export async function getPublicCategories(
  locale: Locale,
): Promise<ToolCategory[]> {
  const tools = await getPublicTools(locale);
  const used = new Set(tools.map((tool) => tool.category));
  return categories
    .filter((category) => used.has(category.id))
    .map((category) => localizeCategory(category, locale));
}

function assertActor(actor: SessionUser): void {
  if (actor.role !== "admin" && actor.role !== "super_admin") {
    throw new ToolManagementError(
      "Administrator access required.",
      "forbidden",
    );
  }
}

function validateInput(input: unknown): ToolConfigurationInput {
  const parsed = toolConfigurationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ToolManagementError("Invalid tool configuration.");
  }
  if (!coreTools.some((tool) => tool.slug === parsed.data.implementation)) {
    throw new ToolManagementError("Unknown implementation engine.");
  }
  return parsed.data;
}

async function auditMutation<T>(input: {
  actor: SessionUser;
  action: string;
  slug: string;
  operation: () => Promise<T> | T;
}): Promise<T> {
  try {
    assertActor(input.actor);
    const result = await input.operation();
    await writeAuditLog({
      actor: input.actor,
      action: input.action,
      result: "success",
      details: { toolSlug: input.slug },
    });
    return result;
  } catch (error) {
    await writeAuditLog({
      actor: input.actor,
      action: input.action,
      result: "failure",
      details: {
        toolSlug: input.slug,
        reason: error instanceof Error ? error.message : "Unknown failure",
      },
    });
    throw error;
  }
}

function saveConfiguration(
  value: ToolConfigurationInput,
  isCustom: boolean,
): void {
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO tool_configurations (
        slug, implementation_slug, is_custom, name_en, name_zh,
        short_name_en, short_name_zh, description_en, description_zh,
        category, keywords_en, keywords_zh, seo_title_en, seo_title_zh,
        seo_description_en, seo_description_zh, max_input_size, max_output_size,
        max_execution_time, max_concurrency, requires_login, free_to_use,
        enabled, featured, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        implementation_slug = excluded.implementation_slug,
        name_en = excluded.name_en, name_zh = excluded.name_zh,
        short_name_en = excluded.short_name_en,
        short_name_zh = excluded.short_name_zh,
        description_en = excluded.description_en,
        description_zh = excluded.description_zh,
        category = excluded.category, keywords_en = excluded.keywords_en,
        keywords_zh = excluded.keywords_zh, seo_title_en = excluded.seo_title_en,
        seo_title_zh = excluded.seo_title_zh,
        seo_description_en = excluded.seo_description_en,
        seo_description_zh = excluded.seo_description_zh,
        max_input_size = excluded.max_input_size,
        max_output_size = excluded.max_output_size,
        max_execution_time = excluded.max_execution_time,
        max_concurrency = excluded.max_concurrency,
        requires_login = excluded.requires_login,
        free_to_use = excluded.free_to_use, enabled = excluded.enabled,
        featured = excluded.featured, sort_order = excluded.sort_order,
        updated_at = excluded.updated_at`,
    )
    .run(
      value.slug,
      value.implementation,
      Number(isCustom),
      value.nameEn,
      value.nameZh,
      value.shortNameEn,
      value.shortNameZh,
      value.descriptionEn,
      value.descriptionZh,
      value.category,
      JSON.stringify(value.keywordsEn),
      JSON.stringify(value.keywordsZh),
      value.seoTitleEn,
      value.seoTitleZh,
      value.seoDescriptionEn,
      value.seoDescriptionZh,
      value.maxInputSize,
      value.maxOutputSize,
      value.maxExecutionTime,
      value.maxConcurrency,
      Number(value.requiresLogin),
      Number(value.freeToUse),
      Number(value.enabled),
      Number(value.featured),
      value.sortOrder,
      now,
      now,
    );
}

export async function createManagedTool(
  actor: SessionUser,
  input: unknown,
): Promise<void> {
  await initializeDatabase();
  const slug =
    typeof input === "object" && input && "slug" in input
      ? String(input.slug).slice(0, 64)
      : "invalid";
  await auditMutation({
    actor,
    action: "tool.create",
    slug,
    operation: () => {
      const value = validateInput(input);
      if (
        coreTools.some((tool) => tool.slug === value.slug) ||
        getDatabase()
          .prepare("SELECT 1 FROM tool_configurations WHERE slug = ?")
          .get(value.slug)
      ) {
        throw new ToolManagementError("Tool slug already exists.", "exists");
      }
      saveConfiguration(value, true);
    },
  });
}

export async function updateManagedTool(
  actor: SessionUser,
  slug: string,
  input: unknown,
): Promise<void> {
  await initializeDatabase();
  await auditMutation({
    actor,
    action: "tool.update",
    slug,
    operation: async () => {
      const value = validateInput(input);
      if (value.slug !== slug) {
        throw new ToolManagementError("Tool slug cannot be changed.");
      }
      const existing = await getManagedTool(slug);
      if (!existing) {
        throw new ToolManagementError("Tool not found.", "not_found");
      }
      saveConfiguration(value, existing.source === "custom");
    },
  });
}

export async function deleteManagedTool(
  actor: SessionUser,
  slug: string,
): Promise<void> {
  await initializeDatabase();
  await auditMutation({
    actor,
    action: "tool.delete",
    slug,
    operation: async () => {
      const existing = await getManagedTool(slug);
      if (!existing) {
        throw new ToolManagementError("Tool not found.", "not_found");
      }
      if (existing.source === "core") {
        throw new ToolManagementError(
          "Core tools can be disabled or restored, but not deleted.",
          "core_delete",
        );
      }
      getDatabase()
        .prepare("DELETE FROM tool_configurations WHERE slug = ?")
        .run(slug);
    },
  });
}

export async function resetManagedTool(
  actor: SessionUser,
  slug: string,
): Promise<void> {
  await initializeDatabase();
  await auditMutation({
    actor,
    action: "tool.reset",
    slug,
    operation: () => {
      if (!coreTools.some((tool) => tool.slug === slug)) {
        throw new ToolManagementError(
          "Only core tools can be restored.",
          "invalid",
        );
      }
      getDatabase()
        .prepare("DELETE FROM tool_configurations WHERE slug = ?")
        .run(slug);
    },
  });
}
