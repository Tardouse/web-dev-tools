import type { Metadata } from "next";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { UserLoginForm } from "@/components/user-login-form";
import { BrandLogo } from "@/components/brand-logo";
import { isLocale, localePath } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getSiteSettings } from "@/server/db/settings";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ verified?: string; reset?: string; registered?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  if (await getCurrentUser()) redirect(localePath(locale, "/account"));
  const settings = await getSiteSettings();
  const zh = locale === "zh";
  return (
    <main className="auth-page page-shell"><div className="auth-wrap">
      <Link href={localePath(locale)} className="logo auth-logo"><BrandLogo settings={settings} /></Link>
      <div className="auth-heading"><span className="auth-lock"><UserRound size={23} /></span><div><span className="eyebrow">{zh ? "欢迎回来" : "Welcome back"}</span><h1>{zh ? "登录账号" : "Sign in"}</h1><p>{zh ? "登录后可同步收藏、历史和个人设置。" : "Sign in to access favorites, history, and account settings."}</p></div></div>
      <UserLoginForm locale={locale} registrationEnabled={settings.registrationEnabled} notice={query.verified === "1" ? "verified" : query.reset === "1" ? "reset" : query.registered === "1" ? "registered" : undefined} />
      <Link className="auth-back" href={localePath(locale)}>← {zh ? "返回工具箱" : "Back to toolbox"}</Link>
    </div></main>
  );
}
