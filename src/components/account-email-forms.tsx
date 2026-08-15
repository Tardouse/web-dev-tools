"use client";

import Link from "next/link";
import { KeyRound, MailCheck, Send } from "lucide-react";
import { useActionState } from "react";
import {
  resendVerificationAction,
  verifyEmailAction,
  type VerificationRequestState,
  type VerifyEmailState,
} from "@/app/[locale]/verify-email/actions";
import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "@/app/[locale]/forgot-password/actions";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/app/[locale]/reset-password/actions";
import { localePath, type Locale } from "@/i18n";

export function VerifyEmailForm({ locale, token }: { locale: Locale; token: string }) {
  const [state, action, pending] = useActionState<VerifyEmailState, FormData>(verifyEmailAction, {});
  const zh = locale === "zh";
  const error = state.error === "expired"
    ? zh ? "验证链接已过期，请重新发送。" : "This verification link has expired. Request another one."
    : state.error === "used"
      ? zh ? "该验证链接已经使用。" : "This verification link has already been used."
      : state.error
        ? zh ? "验证链接无效。" : "This verification link is invalid."
        : null;
  return (
    <form action={action} className="auth-form card">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <p className="auth-form-copy">{zh ? "点击按钮确认此邮箱属于您。" : "Confirm that this email address belongs to you."}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" disabled={pending}>
        <MailCheck size={17} />
        {pending ? (zh ? "正在验证…" : "Verifying…") : (zh ? "验证邮箱" : "Verify email")}
      </button>
    </form>
  );
}

export function VerificationRequestForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState<VerificationRequestState, FormData>(resendVerificationAction, {});
  const zh = locale === "zh";
  return (
    <form action={action} className="auth-form card">
      <input type="hidden" name="locale" value={locale} />
      <label className="field-label" htmlFor="verification-email">{zh ? "邮箱" : "Email"}</label>
      <input className="field-input" id="verification-email" name="email" type="email" autoComplete="email" required maxLength={254} />
      {state.error && <p className="form-error" role="alert">{zh ? "请输入有效的邮箱地址。" : "Enter a valid email address."}</p>}
      {state.submitted && <p className="form-success" role="status">{zh ? "如果该邮箱需要验证，我们已发送新的验证邮件。" : "If that email needs verification, a new message has been sent."}</p>}
      <button className="button button-primary auth-submit" disabled={pending}>
        <Send size={17} />
        {pending ? (zh ? "正在发送…" : "Sending…") : (zh ? "发送验证邮件" : "Send verification email")}
      </button>
      <p className="auth-form-link"><Link href={localePath(locale, "/login")}>{zh ? "返回登录" : "Back to sign in"}</Link></p>
    </form>
  );
}

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(forgotPasswordAction, {});
  const zh = locale === "zh";
  return (
    <form action={action} className="auth-form card">
      <input type="hidden" name="locale" value={locale} />
      <label className="field-label" htmlFor="recovery-email">{zh ? "邮箱" : "Email"}</label>
      <input className="field-input" id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} />
      {state.error && <p className="form-error" role="alert">{zh ? "请输入有效的邮箱地址。" : "Enter a valid email address."}</p>}
      {state.submitted && <p className="form-success" role="status">{zh ? "如果该邮箱对应可用账号，我们已发送密码重置邮件。" : "If an eligible account exists, a password reset message has been sent."}</p>}
      <button className="button button-primary auth-submit" disabled={pending}>
        <Send size={17} />
        {pending ? (zh ? "正在发送…" : "Sending…") : (zh ? "发送重置邮件" : "Send reset email")}
      </button>
      <p className="auth-form-link"><Link href={localePath(locale, "/login")}>{zh ? "返回登录" : "Back to sign in"}</Link></p>
    </form>
  );
}

export function ResetPasswordForm({ locale, token }: { locale: Locale; token: string }) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(resetPasswordAction, {});
  const zh = locale === "zh";
  const error = state.error === "mismatch"
    ? zh ? "两次输入的密码不一致。" : "The passwords do not match."
    : state.error === "policy"
      ? zh ? "密码至少 12 位，且需包含大小写字母、数字和符号。" : "Use 12+ characters with uppercase, lowercase, number, and symbol."
      : state.error === "expired"
        ? zh ? "重置链接已过期，请重新申请。" : "This reset link has expired. Request another one."
        : state.error === "used"
          ? zh ? "该重置链接已经使用。" : "This reset link has already been used."
          : state.error
            ? zh ? "重置链接无效。" : "This reset link is invalid."
            : null;
  return (
    <form action={action} className="auth-form card">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <label className="field-label" htmlFor="reset-password">{zh ? "新密码" : "New password"}</label>
      <input className="field-input" id="reset-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
      <label className="field-label" htmlFor="reset-confirm">{zh ? "确认新密码" : "Confirm new password"}</label>
      <input className="field-input" id="reset-confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
      <small>{zh ? "至少 12 位，并包含大小写字母、数字和符号。" : "At least 12 characters with upper/lowercase, number, and symbol."}</small>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" disabled={pending}>
        <KeyRound size={17} />
        {pending ? (zh ? "正在保存…" : "Saving…") : (zh ? "设置新密码" : "Set new password")}
      </button>
    </form>
  );
}
