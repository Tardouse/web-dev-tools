"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/app/[locale]/register/actions";
import { localePath, type Locale } from "@/i18n";

const initial: RegisterState = {};
export function RegisterForm({
  locale,
  enabled = true,
}: {
  locale: Locale;
  enabled?: boolean;
}) {
  const [state, action, pending] = useActionState(registerAction, initial);
  const zh = locale === "zh";
  const errors = {
    invalid: zh ? "请检查姓名、邮箱和密码。密码至少 12 位并包含大小写字母、数字和符号。" : "Check your name, email, and password. Use 12+ characters with upper/lowercase, number, and symbol.",
    mismatch: zh ? "两次输入的密码不一致。" : "The passwords do not match.",
    exists: zh ? "该邮箱已被使用。" : "That email is already in use.",
    limited: zh ? "注册请求过于频繁，请稍后再试。" : "Too many registrations. Try again later.",
    disabled: zh ? "当前已暂停新用户注册。" : "New account registration is currently closed.",
  };
  if (!enabled) {
    return (
      <div className="auth-form card auth-message">
        <p className="form-error" role="status">{errors.disabled}</p>
        <p className="auth-form-link">
          <Link href={localePath(locale, "/login")}>
            {zh ? "返回登录" : "Back to sign in"}
          </Link>
        </p>
      </div>
    );
  }
  return <form action={action} className="auth-form card"><input type="hidden" name="locale" value={locale} />
    <label className="field-label" htmlFor="register-name">{zh ? "姓名" : "Name"}</label><input className="field-input" id="register-name" name="name" autoComplete="name" required minLength={2} maxLength={80} />
    <label className="field-label" htmlFor="register-email">{zh ? "邮箱" : "Email"}</label><input className="field-input" id="register-email" name="email" type="email" autoComplete="username" required maxLength={254} />
    <label className="field-label" htmlFor="register-password">{zh ? "密码" : "Password"}</label><input className="field-input" id="register-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
    <label className="field-label" htmlFor="register-confirm">{zh ? "确认密码" : "Confirm password"}</label><input className="field-input" id="register-confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
    {state.error && <p className="form-error" role="alert">{errors[state.error]}</p>}
    <button className="button button-primary auth-submit" disabled={pending}><UserPlus size={17} />{pending ? (zh ? "正在创建…" : "Creating…") : zh ? "创建账号" : "Create account"}</button>
    <p className="auth-form-link">{zh ? "已有账号？" : "Already have an account?"} <Link href={localePath(locale, "/login")}>{zh ? "登录" : "Sign in"}</Link></p>
  </form>;
}
