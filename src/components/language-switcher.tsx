"use client";

import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, switchLocalePath, type Locale } from "@/i18n";

export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale: Locale = locale === "zh" ? "en" : "zh";
  const switchLanguage = () => {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.push(switchLocalePath(pathname, nextLocale));
  };
  return (
    <button
      type="button"
      className="button button-sm language-switcher"
      onClick={switchLanguage}
      aria-label={locale === "zh" ? "Switch to English" : "切换到中文"}
    >
      <Languages size={15} />
      <span>{label}</span>
    </button>
  );
}
