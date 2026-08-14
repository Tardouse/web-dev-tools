export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";
export const LOCALE_COOKIE = "devtoolbox-locale";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function assertLocale(value: string): Locale {
  if (!isLocale(value)) throw new Error(`Unsupported locale: ${value}`);
  return value;
}

export function localePath(locale: Locale, pathname = "/"): string {
  const normalized =
    pathname === "/"
      ? ""
      : pathname.startsWith("/")
        ? pathname
        : `/${pathname}`;
  return `/${locale}${normalized}`;
}

export function switchLocalePath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length && isLocale(segments[0])) segments[0] = locale;
  else segments.unshift(locale);
  return `/${segments.join("/")}`;
}

export function localeFromAcceptLanguage(value: string | null): Locale {
  if (!value) return defaultLocale;
  const languages = value
    .split(",")
    .map((part) => part.trim().split(";")[0].toLowerCase());
  return languages.some(
    (language) => language === "zh" || language.startsWith("zh-"),
  )
    ? "zh"
    : "en";
}

export function htmlLocale(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en";
}

export function intlLocale(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en-US";
}
