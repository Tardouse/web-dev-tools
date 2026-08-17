import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ToolIcon } from "@/components/icon";
import { ToolPageClient } from "@/components/tool-page-client";
import { RegisteredTool } from "@/components/tools/registered-tool";
import { FavoriteToolButton } from "@/components/favorite-tool-button";
import { ShareToolButton } from "@/components/share-tool-button";
import { formatBytes, SITE_CONFIG } from "@/lib/config";
import { tools } from "@/lib/tool-registry";
import { getCurrentUser } from "@/server/auth/session";
import { getSiteSettings } from "@/server/db/settings";
import {
  getPublicCategories,
  getPublicTool,
  getPublicTools,
} from "@/server/db/tool-management";
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
  const tool = await getPublicTool(slug, locale);
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
  const [tool, publicTools, publicCategories, settings] = await Promise.all([
    getPublicTool(slug, locale),
    getPublicTools(locale),
    getPublicCategories(locale),
    getSiteSettings(),
  ]);
  if (!tool) notFound();
  if (tool.requiresLogin && !(await getCurrentUser())) {
    redirect(localePath(locale, "/login"));
  }
  const messages = getMessages(locale);
  const category = publicCategories.find((item) => item.id === tool.category);
  const related = tool.related
    .map((relatedSlug) => publicTools.find((item) => item.slug === relatedSlug))
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
    ...(tool.freeToUse === false
      ? {}
      : { offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }),
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
            <span className="badge">
              {tool.requiresLogin
                ? locale === "zh"
                  ? "需要登录"
                  : "Sign-in required"
                : messages.common.noAccount}
            </span>
          </div>
        </div>
        <div className="tool-page-actions">
          <ShareToolButton name={tool.name} messages={messages} />
          <FavoriteToolButton
            slug={tool.slug}
            name={tool.name}
            messages={messages}
          />
        </div>
      </header>
      <div className="tool-layout">
        <div className="tool-main">
          {tool.freeToUse === false ? (
            <div className="empty-state card paid-tool-state">
              <LockKeyhole size={30} />
              <h3>
                {locale === "zh"
                  ? "此工具需要付费权限"
                  : "Paid access required"}
              </h3>
              <p>
                {locale === "zh"
                  ? "当前版本尚未开放订阅购买，请联系网站管理员获取访问方式。"
                  : "Subscriptions are not available in this release. Contact the site administrator for access."}
              </p>
              {settings.contactEmail && (
                <a className="button" href={`mailto:${settings.contactEmail}`}>
                  {settings.contactEmail}
                </a>
              )}
            </div>
          ) : (
            <RegisteredTool
              definition={tool}
              locale={locale}
              messages={messages}
            />
          )}
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
          {settings.adsEnabled && (
            <div className="ad-slot">{messages.toolPage.reserved}</div>
          )}
        </aside>
      </div>
    </div>
  );
}
