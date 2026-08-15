import type { Metadata } from "next";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { UserLoginForm } from "@/components/user-login-form";
import { isLocale, localePath } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getCurrentUser()) redirect(localePath(locale, "/account"));
  const zh = locale === "zh";
  return (
    <main className="auth-page page-shell"><div className="auth-wrap">
      <Link href={localePath(locale)} className="logo auth-logo"><span className="logo-mark">&lt;/&gt;</span><span>DevToolbox</span></Link>
      <div className="auth-heading"><span className="auth-lock"><UserRound size={23} /></span><div><span className="eyebrow">{zh ? "欢迎回来" : "Welcome back"}</span><h1>{zh ? "登录账号" : "Sign in"}</h1><p>{zh ? "登录后可同步收藏、历史和个人设置。" : "Sign in to access favorites, history, and account settings."}</p></div></div>
      <UserLoginForm locale={locale} />
      <Link className="auth-back" href={localePath(locale)}>← {zh ? "返回工具箱" : "Back to toolbox"}</Link>
    </div></main>
  );
}
