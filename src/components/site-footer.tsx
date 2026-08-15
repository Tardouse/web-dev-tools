import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { localePath, type Locale, type Messages } from "@/i18n";
import type { SiteSettings } from "@/lib/site-settings";
import type { ToolDefinition } from "@/lib/types";

export function SiteFooter({
  locale,
  messages,
  settings,
  tools,
}: {
  locale: Locale;
  messages: Messages;
  settings: SiteSettings;
  tools: ToolDefinition[];
}) {
  const popular = [...tools]
    .sort((left, right) => Number(Boolean(right.featured)) - Number(Boolean(left.featured)))
    .slice(0, 4);
  const footer = locale === "zh" ? settings.footerZh : settings.footerEn;
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link href={localePath(locale)} className="logo">
            <BrandLogo settings={settings} />
          </Link>
          <p className="footer-copy">
            {locale === "zh" ? settings.descriptionZh : settings.descriptionEn}
          </p>
          <span className="badge badge-success">
            <LockKeyhole size={13} />
            {messages.footer.privacy}
          </span>
        </div>
        <div>
          <h2 className="footer-title">{messages.footer.explore}</h2>
          <div className="footer-links">
            <Link href={localePath(locale, "/tools")}>
              {messages.nav.allTools}
            </Link>
            <Link href={localePath(locale, "/categories")}>
              {messages.nav.categories}
            </Link>
            <Link href={localePath(locale, "/favorites")}>
              {messages.footer.favorites}
            </Link>
          </div>
        </div>
        <div>
          <h2 className="footer-title">{messages.footer.popular}</h2>
          <div className="footer-links">
            {popular.map((tool) => (
              <Link
                href={localePath(locale, `/tools/${tool.slug}`)}
                key={tool.slug}
              >
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} {settings.siteName} · {footer}</span>
          {settings.legalText && <span>{settings.legalText}</span>}
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
          )}
        </div>
      </div>
    </footer>
  );
}
