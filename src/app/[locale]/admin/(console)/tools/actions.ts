"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isLocale, localePath, locales } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";
import {
  createManagedTool,
  deleteManagedTool,
  getManagedTool,
  resetManagedTool,
  ToolManagementError,
  updateManagedTool,
} from "@/server/db/tool-management";

export interface ToolActionState {
  ok?: boolean;
  error?: string;
}

function localeValue(formData: FormData) {
  const value = String(formData.get("locale") ?? "zh");
  return isLocale(value) ? value : "zh";
}

function bool(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

function keywords(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function input(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    implementation: String(formData.get("implementation") ?? ""),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameZh: String(formData.get("nameZh") ?? ""),
    shortNameEn: String(formData.get("shortNameEn") ?? ""),
    shortNameZh: String(formData.get("shortNameZh") ?? ""),
    descriptionEn: String(formData.get("descriptionEn") ?? ""),
    descriptionZh: String(formData.get("descriptionZh") ?? ""),
    category: String(formData.get("category") ?? ""),
    keywordsEn: keywords(formData.get("keywordsEn")),
    keywordsZh: keywords(formData.get("keywordsZh")),
    seoTitleEn: String(formData.get("seoTitleEn") ?? ""),
    seoTitleZh: String(formData.get("seoTitleZh") ?? ""),
    seoDescriptionEn: String(formData.get("seoDescriptionEn") ?? ""),
    seoDescriptionZh: String(formData.get("seoDescriptionZh") ?? ""),
    maxInputSize: Math.round(Number(formData.get("maxInputMb")) * 1024 * 1024),
    requiresLogin: bool(formData, "requiresLogin"),
    freeToUse: bool(formData, "freeToUse"),
    enabled: bool(formData, "enabled"),
    featured: bool(formData, "featured"),
    sortOrder: Number(formData.get("sortOrder")),
  };
}

function errorCode(error: unknown): string {
  return error instanceof ToolManagementError ? error.code : "unknown";
}

function refresh(locale: "zh" | "en", slug?: string): void {
  for (const publicLocale of locales) {
    revalidatePath(localePath(publicLocale), "layout");
  }
  revalidatePath(localePath(locale, "/admin/tools"));
  if (slug) {
    revalidatePath(localePath(locale, `/tools/${slug}`));
    revalidatePath(localePath(locale, `/admin/tools/${slug}`));
  }
  revalidatePath("/sitemap.xml");
}

export async function createToolAction(
  _state: ToolActionState,
  formData: FormData,
): Promise<ToolActionState> {
  const locale = localeValue(formData);
  const value = input(formData);
  try {
    const actor = await requireAdmin();
    await createManagedTool(actor, value);
    refresh(locale, value.slug);
  } catch (error) {
    return { error: errorCode(error) };
  }
  redirect(localePath(locale, `/admin/tools/${value.slug}`));
}

export async function updateToolAction(
  _state: ToolActionState,
  formData: FormData,
): Promise<ToolActionState> {
  const locale = localeValue(formData);
  const slug = String(formData.get("slug") ?? "");
  try {
    const actor = await requireAdmin();
    await updateManagedTool(actor, slug, input(formData));
    refresh(locale, slug);
    return { ok: true };
  } catch (error) {
    return { error: errorCode(error) };
  }
}

export async function setToolEnabledAction(formData: FormData): Promise<void> {
  const locale = localeValue(formData);
  const slug = String(formData.get("slug") ?? "");
  const actor = await requireAdmin();
  const tool = await getManagedTool(slug);
  if (!tool) throw new ToolManagementError("Tool not found.", "not_found");
  await updateManagedTool(actor, slug, {
    ...tool,
    enabled: formData.get("enabled") === "true",
  });
  refresh(locale, slug);
}

export async function deleteToolAction(
  _state: ToolActionState,
  formData: FormData,
): Promise<ToolActionState> {
  const locale = localeValue(formData);
  const slug = String(formData.get("slug") ?? "");
  try {
    const actor = await requireAdmin();
    await deleteManagedTool(actor, slug);
    refresh(locale, slug);
  } catch (error) {
    return { error: errorCode(error) };
  }
  redirect(localePath(locale, "/admin/tools"));
}

export async function resetToolAction(
  _state: ToolActionState,
  formData: FormData,
): Promise<ToolActionState> {
  const locale = localeValue(formData);
  const slug = String(formData.get("slug") ?? "");
  try {
    const actor = await requireAdmin();
    await resetManagedTool(actor, slug);
    refresh(locale, slug);
    return { ok: true };
  } catch (error) {
    return { error: errorCode(error) };
  }
}
