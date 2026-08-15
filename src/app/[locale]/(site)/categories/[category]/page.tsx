import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ToolCard } from "@/components/tool-card";
import {
  getMessages,
  interpolate,
  isLocale,
  localePath,
  locales,
} from "@/i18n";
import { categories } from "@/lib/tool-registry";
import {
  getPublicCategories,
  getPublicTools,
} from "@/server/db/tool-management";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    categories.map((category) => ({ locale, category: category.id })),
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category: id } = await params;
  if (!isLocale(locale)) return {};
  const category = (await getPublicCategories(locale)).find(
    (item) => item.id === id,
  );
  if (!category) return {};
  const path = `/categories/${category.id}`;
  return {
    title: `${category.name}${locale === "zh" ? "工具" : " Tools"}`,
    description: category.description,
    alternates: {
      canonical: localePath(locale, path),
      languages: {
        "zh-CN": localePath("zh", path),
        en: localePath("en", path),
      },
    },
  };
}
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: id } = await params;
  if (!isLocale(locale)) notFound();
  const [publicCategories, tools] = await Promise.all([
    getPublicCategories(locale),
    getPublicTools(locale),
  ]);
  const category = publicCategories.find((item) => item.id === id);
  if (!category) notFound();
  const messages = getMessages(locale);
  const categoryTools = tools.filter((tool) => tool.category === category.id);
  return (
    <div className="container">
      <Breadcrumbs
        locale={locale}
        homeLabel={messages.nav.home}
        items={[
          { label: messages.nav.categories, href: "/categories" },
          { label: category.name },
        ]}
      />
      <header className="tools-page-header">
        <span className="eyebrow">
          {interpolate(messages.pages.categoryCount, {
            count: categoryTools.length,
            unit:
              locale === "zh"
                ? "个工具"
                : categoryTools.length === 1
                  ? "tool"
                  : "tools",
          })}
        </span>
        <h1>{category.name}</h1>
        <p>
          {interpolate(messages.pages.categoryDescription, {
            description: category.description,
          })}
        </p>
      </header>
      <section className="section-sm">
        <div className="tool-grid">
          {categoryTools.map((tool) => (
            <ToolCard
              tool={tool}
              locale={locale}
              messages={messages}
              key={tool.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
