import type { Locale } from "@/i18n/config";
import type { ToolCategory, ToolDefinition } from "@/lib/types";
import { zhCategories, zhTools } from "./zh";

export function localizeTool(
  tool: ToolDefinition,
  locale: Locale,
): ToolDefinition {
  if (locale === "en") return tool;
  const translation = zhTools[tool.id];
  if (!translation) return tool;
  return {
    ...tool,
    ...translation,
    keywords: [...translation.keywords, ...tool.keywords],
  };
}

export function localizeCategory(
  category: ToolCategory,
  locale: Locale,
): ToolCategory {
  if (locale === "en") return category;
  const translation = zhCategories[category.id];
  return translation ? { ...category, ...translation } : category;
}

export function hasChineseToolTranslation(id: string): boolean {
  return Boolean(zhTools[id]);
}
