"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { adminLoginAction, type AdminLoginState } from "@/app/[locale]/admin/(auth)/login/actions";
import type { Locale } from "@/i18n";

const initial: AdminLoginState = {};
export function AdminLoginForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(adminLoginAction, initial);
  const zh = locale === "zh";
  const error = state.error === "locked" ? (zh ? "失败次数过多，请 15 分钟后再试。" : "Too many failed attempts. Try again in 15 minutes.") : state.error ? (zh ? "用户名或密码不正确。" : "The username or password is incorrect.") : null;
  return <form action={action} className="auth-form card"><input type="hidden" name="locale" value={locale} /><label className="field-label" htmlFor="admin-username">{zh ? "用户名" : "Username"}</label><input className="field-input" id="admin-username" name="username" autoComplete="username" required minLength={3} maxLength={32} /><label className="field-label" htmlFor="admin-password">{zh ? "密码" : "Password"}</label><input className="field-input" id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={128} />{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary auth-submit" disabled={pending}><LogIn size={17} />{pending ? (zh ? "正在登录…" : "Signing in…") : zh ? "登录" : "Sign in"}</button></form>;
}
