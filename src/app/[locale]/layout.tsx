import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { AppProviders } from "@/components/providers/app-providers";
import {
  htmlLocale,
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/i18n";
import { SITE_CONFIG } from "@/lib/config";
import { getSiteSettings } from "@/server/db/settings";
import "../globals.css";
import "../admin-styles.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const themeScript = `(function(){try{var t=localStorage.getItem('devtoolbox:theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#101827" },
  ],
};
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: value } = await params;
  if (!isLocale(value)) return {};
  const settings = await getSiteSettings();
  const title =
    value === "zh"
      ? `${settings.siteName} — 快速、隐私优先的开发者工具箱`
      : `${settings.siteName} — Fast, Private Developer Utilities`;
  const description =
    value === "zh"
      ? settings.descriptionZh
      : settings.descriptionEn;
  return {
    metadataBase: new URL(SITE_CONFIG.url),
    applicationName: settings.siteName,
    icons: { icon: settings.logoUrl || "/icon.svg" },
    title: { default: title, template: `%s | ${settings.siteName}` },
    description,
    keywords:
      value === "zh"
        ? ["开发者工具", "JSON 格式化", "Base64", "正则测试", "在线工具"]
        : [
            "developer tools",
            "JSON formatter",
            "Base64",
            "regex tester",
            "online tools",
          ],
    alternates: {
      canonical: localePath(value),
      languages: {
        "zh-CN": localePath("zh"),
        en: localePath("en"),
        "x-default": localePath("zh"),
      },
    },
    openGraph: {
      type: "website",
      locale: value === "zh" ? "zh_CN" : "en_US",
      alternateLocale: [value === "zh" ? "en_US" : "zh_CN"],
      url: localePath(value),
      siteName: settings.siteName,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: value } = await params;
  if (!isLocale(value)) notFound();
  const locale: Locale = value;
  return (
    <html lang={htmlLocale(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
