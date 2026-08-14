"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import {
  loginAction,
  type LoginState,
} from "@/app/[locale]/login/actions";
import type { Locale } from "@/i18n";

const initialState: LoginState = {};

const errorMessages = {
  zh: {
    invalid: "邮箱或密码不正确。",
    locked: "失败次数过多，请 15 分钟后再试。",
    disabled: "邮箱或密码不正确。",
    forbidden: "邮箱或密码不正确。",
    validation: "请输入有效的邮箱和密码。",
  },
  en: {
    invalid: "The email or password is incorrect.",
    locked: "Too many failed attempts. Try again in 15 minutes.",
    disabled: "The email or password is incorrect.",
    forbidden: "The email or password is incorrect.",
    validation: "Enter a valid email and password.",
  },
} as const;

export function LoginForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const zh = locale === "zh";
  return (
    <form action={formAction} className="auth-form card">
      <input type="hidden" name="locale" value={locale} />
      <label className="field-label" htmlFor="email">
        {zh ? "邮箱" : "Email"}
      </label>
      <input
        className="field-input"
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        maxLength={254}
      />
      <label className="field-label" htmlFor="password">
        {zh ? "密码" : "Password"}
      </label>
      <input
        className="field-input"
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={128}
      />
      {state.error && (
        <p className="form-error" role="alert">
          {errorMessages[locale][state.error]}
        </p>
      )}
      <button className="button button-primary auth-submit" disabled={pending}>
        <LogIn size={17} />
        {pending
          ? zh
            ? "正在登录…"
            : "Signing in…"
          : zh
            ? "登录管理后台"
            : "Sign in to admin"}
      </button>
    </form>
  );
}
