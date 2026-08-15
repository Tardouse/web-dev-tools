import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryCard } from "@/components/category-card";
import { getMessages, interpolate, isLocale, localePath } from "@/i18n";
import {
  getPublicCategories,
  getPublicTools,
} from "@/server/db/tool-management";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "zh" ? "工具分类" : "Tool Categories",
    description:
      locale === "zh"
        ? "按数据、编码、文本、正则、时间、安全和 Web 开发场景浏览工具。"
        : "Browse developer utilities by data, encoding, text, regex, time, security, and web-development workflow.",
    alternates: {
      canonical: localePath(locale, "/categories"),
      languages: {
        "zh-CN": localePath("zh", "/categories"),
        en: localePath("en", "/categories"),
      },
    },
  };
}
export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const [categories, tools] = await Promise.all([
    getPublicCategories(locale),
    getPublicTools(locale),
  ]);
  return (
    <div className="container">
      <Breadcrumbs
        locale={locale}
        homeLabel={messages.nav.home}
        items={[{ label: messages.nav.categories }]}
      />
      <header className="tools-page-header">
        <span className="eyebrow">
          {interpolate(messages.pages.categoriesEyebrow, {
            count: categories.length,
          })}
        </span>
        <h1>{messages.pages.categoriesTitle}</h1>
        <p>
          {interpolate(messages.pages.categoriesDescription, {
            count: tools.length,
          })}
        </p>
      </header>
      <section className="section-sm">
        <div className="category-grid">
          {categories.map((category) => (
            <CategoryCard
              category={category}
              locale={locale}
              messages={messages}
              count={tools.filter((tool) => tool.category === category.id).length}
              key={category.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
