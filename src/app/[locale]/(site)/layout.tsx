import { AccountNavigation } from "@/components/account-navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale } from "@/i18n";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/server/db/settings";
import {
  getPublicCategories,
  getPublicTools,
} from "@/server/db/tool-management";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const [settings, tools, categories] = await Promise.all([
    getSiteSettings(),
    getPublicTools(locale),
    getPublicCategories(locale),
  ]);

  if (settings.maintenanceMode) {
    return (
      <main className="maintenance-page page-shell">
        <div className="maintenance-panel card">
          <span className="logo">
            <span className="logo-mark">{settings.logoText}</span>
            <span>{settings.siteName}</span>
          </span>
          <h1>{locale === "zh" ? "网站维护中" : "Scheduled maintenance"}</h1>
          <p>
            {locale === "zh"
              ? "我们正在进行系统维护，请稍后再访问。"
              : "The service is undergoing maintenance. Please check back shortly."}
          </p>
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
          )}
        </div>
      </main>
    );
  }

  return (
    <>
      <SiteHeader
        locale={locale}
        messages={messages}
        settings={settings}
        tools={tools}
        categories={categories}
        accountNavigation={
          <AccountNavigation key="account-navigation" locale={locale} />
        }
      />
      <main className="page-shell">{children}</main>
      <SiteFooter
        locale={locale}
        messages={messages}
        settings={settings}
        tools={tools}
      />
    </>
  );
}
