import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { notFound } from "next/navigation";
import {
  VerificationRequestForm,
  VerifyEmailForm,
} from "@/components/account-email-forms";
import { isLocale, localePath } from "@/i18n";
import { inspectAccountToken, type AccountTokenStatus } from "@/server/auth/account-tokens";

export const metadata: Metadata = { robots: { index: false, follow: false } };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const token = first(query.token);
  const status: AccountTokenStatus | undefined = token
    ? await inspectAccountToken(token, "email_verification")
    : undefined;
  const zh = locale === "zh";
  const statusText = status === "expired"
    ? zh ? "验证链接已过期，请申请新链接。" : "This verification link has expired. Request a new one."
    : status === "used"
      ? zh ? "验证链接已使用，您可以直接尝试登录。" : "This link has already been used. Try signing in."
      : status === "invalid"
        ? zh ? "验证链接无效，请申请新链接。" : "This verification link is invalid. Request a new one."
        : null;
  return (
    <main className="auth-page page-shell"><div className="auth-wrap">
      <Link href={localePath(locale)} className="logo auth-logo"><span className="logo-mark">&lt;/&gt;</span><span>DevToolbox</span></Link>
      <div className="auth-heading"><span className="auth-lock"><MailCheck size={23} /></span><div><span className="eyebrow">{zh ? "账号安全" : "Account security"}</span><h1>{zh ? "验证邮箱" : "Verify email"}</h1><p>{zh ? "完成邮箱验证后即可登录账号。" : "Verify your email address before signing in."}</p></div></div>
      {query.sent === "1" && <p className="form-success auth-page-notice" role="status">{zh ? "账号已创建，验证邮件已发送。" : "Your account was created and a verification email was sent."}</p>}
      {query.sent === "0" && <p className="form-error auth-page-notice" role="alert">{zh ? "账号已创建，但邮件暂时无法送达，请稍后重试。" : "Your account was created, but email delivery is temporarily unavailable. Try again later."}</p>}
      {status === "valid" && token ? <VerifyEmailForm locale={locale} token={token} /> : <>
        {statusText && <p className="form-error auth-page-notice" role="alert">{statusText}</p>}
        <VerificationRequestForm locale={locale} />
      </>}
      <Link className="auth-back" href={localePath(locale)}>← {zh ? "返回工具箱" : "Back to toolbox"}</Link>
    </div></main>
  );
}
