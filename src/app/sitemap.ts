import type { MetadataRoute } from "next";
import { localePath, locales } from "@/i18n";
import { SITE_CONFIG } from "@/lib/config";
import {
  getPublicCategories,
  getPublicTools,
} from "@/server/db/tool-management";

export const dynamic = "force-dynamic";

function entry(
  path: string,
  priority: number,
  changeFrequency: "weekly" | "monthly" = "monthly",
): MetadataRoute.Sitemap[number] {
  const languages = {
    zh: `${SITE_CONFIG.url}${localePath("zh", path)}`,
    en: `${SITE_CONFIG.url}${localePath("en", path)}`,
  };
  return {
    url: languages.zh,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, tools] = await Promise.all([
    getPublicCategories("en"),
    getPublicTools("en"),
  ]);
  const paths = [
    { path: "/", priority: 1, frequency: "weekly" as const },
    { path: "/tools", priority: 0.9, frequency: "weekly" as const },
    { path: "/categories", priority: 0.7, frequency: "monthly" as const },
    ...categories.map((category) => ({
      path: `/categories/${category.id}`,
      priority: 0.7,
      frequency: "monthly" as const,
    })),
    ...tools.map((tool) => ({
        path: `/tools/${tool.slug}`,
        priority: tool.featured ? 0.9 : 0.8,
        frequency: "monthly" as const,
      })),
  ];
  return paths.flatMap(({ path, priority, frequency }) =>
    locales.map((locale) => ({
      ...entry(path, priority, frequency),
      url: `${SITE_CONFIG.url}${localePath(locale, path)}`,
    })),
  );
}
