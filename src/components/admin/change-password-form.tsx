"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changePasswordAction, type ChangePasswordState } from "@/app/[locale]/admin/(auth)/change-password/actions";
import type { Locale } from "@/i18n";

const initial: ChangePasswordState = {};
export function ChangePasswordForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  const zh = locale === "zh";
  const error = state.error === "mismatch" ? (zh ? "两次输入的密码不一致。" : "The passwords do not match.") : state.error === "policy" ? (zh ? "密码至少 12 位，且需包含大小写字母、数字和符号。" : "Use 12+ characters with uppercase, lowercase, a number, and a symbol.") : state.error ? (zh ? "无法修改密码，请重试。" : "The password could not be changed.") : null;
  return <form action={action} className="auth-form card change-password-form"><input type="hidden" name="locale" value={locale} /><label className="field-label" htmlFor="new-password">{zh ? "新密码" : "New password"}</label><input className="field-input" id="new-password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /><small>{zh ? "至少 12 位，并包含大小写字母、数字和符号。" : "At least 12 characters with upper/lowercase, number, and symbol."}</small><label className="field-label" htmlFor="confirm-password">{zh ? "确认新密码" : "Confirm new password"}</label><input className="field-input" id="confirm-password" name="confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary auth-submit" disabled={pending}><KeyRound size={16} />{pending ? (zh ? "正在保存…" : "Saving…") : zh ? "保存并继续" : "Save and continue"}</button></form>;
}
