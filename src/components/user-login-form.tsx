"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/[locale]/login/actions";
import { localePath, type Locale } from "@/i18n";

const initialState: LoginState = {};
export function UserLoginForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const zh = locale === "zh";
  const error = state.error === "locked"
    ? zh ? "失败次数过多，请 15 分钟后再试。" : "Too many failed attempts. Try again in 15 minutes."
    : state.error ? zh ? "邮箱或密码不正确。" : "The email or password is incorrect." : null;
  return (
    <form action={action} className="auth-form card">
      <input type="hidden" name="locale" value={locale} />
      <label className="field-label" htmlFor="email">{zh ? "邮箱" : "Email"}</label>
      <input className="field-input" id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
      <label className="field-label" htmlFor="password">{zh ? "密码" : "Password"}</label>
      <input className="field-input" id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" disabled={pending}><LogIn size={17} />{pending ? (zh ? "正在登录…" : "Signing in…") : zh ? "登录" : "Sign in"}</button>
      <p className="auth-form-link">{zh ? "还没有账号？" : "New to DevToolbox?"} <Link href={localePath(locale, "/register")}>{zh ? "创建账号" : "Create an account"}</Link></p>
    </form>
  );
}
