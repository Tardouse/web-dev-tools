import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ToolIcon } from "@/components/icon";
import { ToolPageClient } from "@/components/tool-page-client";
import { RegisteredTool } from "@/components/tools/registered-tool";
import { FavoriteToolButton } from "@/components/favorite-tool-button";
import { formatBytes, SITE_CONFIG } from "@/lib/config";
import { getCategory, getTool, tools } from "@/lib/tool-registry";
import {
  getMessages,
  interpolate,
  isLocale,
  localePath,
  locales,
} from "@/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    tools
      .filter((tool) => tool.enabled)
      .map((tool) => ({ locale, slug: tool.slug })),
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const tool = getTool(slug, locale);
  if (!tool) return {};
  const path = `/tools/${tool.slug}`;
  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    keywords: tool.keywords,
    alternates: {
      canonical: localePath(locale, path),
      languages: {
        "zh-CN": localePath("zh", path),
        en: localePath("en", path),
        "x-default": localePath("zh", path),
      },
    },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: localePath(locale, path),
      type: "website",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      alternateLocale: [locale === "zh" ? "en_US" : "zh_CN"],
    },
    twitter: {
      card: "summary",
      title: tool.seoTitle,
      description: tool.seoDescription,
    },
  };
}
export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const tool = getTool(slug, locale);
  if (!tool) notFound();
  const messages = getMessages(locale);
  const category = getCategory(tool.category, locale);
  const related = tool.related
    .map((relatedSlug) => getTool(relatedSlug, locale))
    .filter((item) => item !== undefined);
  const url = `${SITE_CONFIG.url}${localePath(locale, `/tools/${tool.slug}`)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    mainEntity: tool.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return (
    <div className="container tool-page">
      <ToolPageClient slug={tool.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqData).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs
        locale={locale}
        homeLabel={messages.nav.home}
        items={[
          { label: messages.common.tools, href: "/tools" },
          ...(category
            ? [{ label: category.name, href: `/categories/${category.id}` }]
            : []),
          { label: tool.name },
        ]}
      />
      <header className="tool-page-header">
        <div>
          <div className="tool-title-row">
            <span className="tool-title-icon">
              <ToolIcon name={tool.icon} size={27} />
            </span>
            <div>
              <h1>{tool.name}</h1>
              <p>{tool.description}</p>
            </div>
          </div>
          <div className="tool-meta">
            <span className="badge badge-success">
              <LockKeyhole size={13} />
              {messages.common.processedLocally}
            </span>
            <span className="badge">
              {messages.common.upTo} {formatBytes(tool.maxInputSize)}
            </span>
            <span className="badge">{messages.common.noAccount}</span>
          </div>
        </div>
        <FavoriteToolButton
          slug={tool.slug}
          name={tool.name}
          messages={messages}
        />
      </header>
      <div className="tool-layout">
        <div className="tool-main">
          <RegisteredTool
            definition={tool}
            locale={locale}
            messages={messages}
          />
          <div className="tool-content card content-card">
            <h2>{interpolate(messages.toolPage.howTo, { name: tool.name })}</h2>
            <ol>
              <li>{messages.toolPage.step1}</li>
              <li>{messages.toolPage.step2}</li>
              <li>{messages.toolPage.step3}</li>
            </ol>
            <h3>{messages.toolPage.privacyTitle}</h3>
            <p>
              {interpolate(messages.toolPage.privacyText, {
                limit: formatBytes(tool.maxInputSize),
              })}
            </p>
            <h3>{messages.toolPage.faq}</h3>
            <div className="faq-list">
              {tool.faq.map((item) => (
                <details className="faq-item" key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
        <aside className="tool-sidebar">
          <div className="sidebar-card card">
            <h3>{messages.toolPage.related}</h3>
            <div className="related-list">
              {related.map((item) => (
                <Link
                  className="related-link"
                  href={localePath(locale, `/tools/${item.slug}`)}
                  key={item.id}
                >
                  <ToolIcon name={item.icon} size={16} />
                  {item.name}
                  <ArrowRight size={14} style={{ marginLeft: "auto" }} />
                </Link>
              ))}
            </div>
          </div>
          <div className="sidebar-card card">
            <h3>{messages.toolPage.privateTitle}</h3>
            <p>{messages.toolPage.privateText}</p>
          </div>
          <div className="ad-slot">{messages.toolPage.reserved}</div>
        </aside>
      </div>
    </div>
  );
}
