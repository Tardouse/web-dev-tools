import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/account-email-forms";
import { BrandLogo } from "@/components/brand-logo";
import { isLocale, localePath } from "@/i18n";
import { inspectAccountToken } from "@/server/auth/account-tokens";
import { getSiteSettings } from "@/server/db/settings";

export const metadata: Metadata = { robots: { index: false, follow: false } };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const settings = await getSiteSettings();
  const token = first(query.token);
  const status = token ? await inspectAccountToken(token, "password_reset") : "invalid";
  const zh = locale === "zh";
  const statusText = status === "expired"
    ? zh ? "重置链接已过期，请重新申请。" : "This reset link has expired. Request another one."
    : status === "used"
      ? zh ? "重置链接已经使用，请重新申请。" : "This reset link has already been used. Request another one."
      : zh ? "重置链接无效，请重新申请。" : "This reset link is invalid. Request another one.";
  return (
    <main className="auth-page page-shell"><div className="auth-wrap">
      <Link href={localePath(locale)} className="logo auth-logo"><BrandLogo settings={settings} /></Link>
      <div className="auth-heading"><span className="auth-lock"><KeyRound size={23} /></span><div><span className="eyebrow">{zh ? "账号恢复" : "Account recovery"}</span><h1>{zh ? "设置新密码" : "Set a new password"}</h1><p>{zh ? "重置后，其他设备上的登录状态将全部失效。" : "Resetting your password signs out every existing session."}</p></div></div>
      {status === "valid" && token ? <ResetPasswordForm locale={locale} token={token} /> : <div className="auth-form card auth-message"><p className="form-error" role="alert">{statusText}</p><Link className="button button-primary" href={localePath(locale, "/forgot-password")}>{zh ? "重新申请" : "Request another link"}</Link></div>}
      <Link className="auth-back" href={localePath(locale)}>← {zh ? "返回工具箱" : "Back to toolbox"}</Link>
    </div></main>
  );
}
