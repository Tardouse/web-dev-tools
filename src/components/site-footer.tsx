import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { interpolate, localePath, type Locale, type Messages } from "@/i18n";

export function SiteFooter({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link href={localePath(locale)} className="logo">
            <span className="logo-mark">&lt;/&gt;</span>
            <span>DevToolbox</span>
          </Link>
          <p className="footer-copy">{messages.footer.description}</p>
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
            <Link href={localePath(locale, "/tools/json-formatter")}>
              {locale === "zh" ? "JSON 格式化" : "JSON Formatter"}
            </Link>
            <Link href={localePath(locale, "/tools/base64")}>Base64</Link>
            <Link href={localePath(locale, "/tools/regex-tester")}>
              {locale === "zh" ? "正则测试" : "Regex Tester"}
            </Link>
            <Link href={localePath(locale, "/tools/curl-parser")}>
              {locale === "zh" ? "cURL 解析器" : "cURL Parser"}
            </Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          {interpolate(messages.footer.copyright, {
            year: new Date().getFullYear(),
          })}
        </div>
      </div>
    </footer>
  );
}
