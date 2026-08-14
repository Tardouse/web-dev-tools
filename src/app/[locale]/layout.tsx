import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getMessages,
  htmlLocale,
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/i18n";
import { SITE_CONFIG } from "@/lib/config";
import "../globals.css";

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
  const title =
    value === "zh"
      ? `${SITE_CONFIG.name} — 快速、隐私优先的开发者工具箱`
      : `${SITE_CONFIG.name} — Fast, Private Developer Utilities`;
  const description =
    value === "zh"
      ? "打开即用的在线开发工具箱，大部分工具在浏览器本地运行，快速、简洁并保护隐私。"
      : SITE_CONFIG.description;
  return {
    metadataBase: new URL(SITE_CONFIG.url),
    applicationName: SITE_CONFIG.name,
    icons: { icon: "/icon.svg" },
    title: { default: title, template: `%s | ${SITE_CONFIG.name}` },
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
      siteName: SITE_CONFIG.name,
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
  const messages = getMessages(locale);
  return (
    <html lang={htmlLocale(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProviders>
          <SiteHeader locale={locale} messages={messages} />
          <main className="page-shell">{children}</main>
          <SiteFooter locale={locale} messages={messages} />
        </AppProviders>
      </body>
    </html>
  );
}
