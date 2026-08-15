import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/account-email-forms";
import { isLocale, localePath } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getCurrentUser()) redirect(localePath(locale, "/account"));
  const zh = locale === "zh";
  return (
    <main className="auth-page page-shell"><div className="auth-wrap">
      <Link href={localePath(locale)} className="logo auth-logo"><span className="logo-mark">&lt;/&gt;</span><span>DevToolbox</span></Link>
      <div className="auth-heading"><span className="auth-lock"><KeyRound size={23} /></span><div><span className="eyebrow">{zh ? "账号恢复" : "Account recovery"}</span><h1>{zh ? "找回密码" : "Reset your password"}</h1><p>{zh ? "输入注册邮箱以接收一次性重置链接。" : "Enter your account email to receive a single-use reset link."}</p></div></div>
      <ForgotPasswordForm locale={locale} />
      <Link className="auth-back" href={localePath(locale)}>← {zh ? "返回工具箱" : "Back to toolbox"}</Link>
    </div></main>
  );
}
