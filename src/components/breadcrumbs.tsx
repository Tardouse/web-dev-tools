import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { localePath, type Locale } from "@/i18n";

export function Breadcrumbs({
  items,
  locale,
  homeLabel,
}: {
  items: Array<{ label: string; href?: string }>;
  locale: Locale;
  homeLabel: string;
}) {
  return (
    <nav
      className="breadcrumb"
      aria-label={locale === "zh" ? "面包屑导航" : "Breadcrumb"}
    >
      <Link href={localePath(locale)} aria-label={homeLabel}>
        <Home size={14} />
      </Link>
      {items.map((item) => (
        <span key={item.label} style={{ display: "contents" }}>
          <ChevronRight size={13} aria-hidden="true" />
          {item.href ? (
            <Link href={localePath(locale, item.href)}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
