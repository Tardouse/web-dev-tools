import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ToolsDirectory } from "@/components/tools-directory";
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
  const count = (await getPublicTools(locale)).length;
  const title = locale === "zh" ? "全部开发者工具" : "All Developer Tools";
  const description =
    locale === "zh"
      ? `浏览 ${count} 个快速、隐私优先的 JSON、编码、文本、正则和 HTTP 等开发工具。`
      : `Browse ${count} fast, privacy-first utilities for JSON, encoding, text, regex, HTTP, and more.`;
  return {
    title,
    description,
    alternates: {
      canonical: localePath(locale, "/tools"),
      languages: {
        "zh-CN": localePath("zh", "/tools"),
        en: localePath("en", "/tools"),
      },
    },
  };
}
export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const [tools, categories] = await Promise.all([
    getPublicTools(locale),
    getPublicCategories(locale),
  ]);
  return (
    <div className="container">
      <Breadcrumbs
        locale={locale}
        homeLabel={messages.nav.home}
        items={[{ label: messages.nav.allTools }]}
      />
      <header className="tools-page-header">
        <span className="eyebrow">
          {interpolate(messages.pages.toolsEyebrow, { count: tools.length })}
        </span>
        <h1>{messages.pages.toolsTitle}</h1>
        <p>{messages.pages.toolsDescription}</p>
      </header>
      <section className="section-sm">
        <ToolsDirectory
          locale={locale}
          messages={messages}
          tools={tools}
          categories={categories}
        />
      </section>
    </div>
  );
}
