"use client";

import { KeyRound } from "lucide-react";
import { useActionState } from "react";
import { userPasswordAction, type UserPasswordState } from "@/app/[locale]/account/change-password/actions";
import type { Locale } from "@/i18n";

const initial: UserPasswordState = {};
export function UserPasswordForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(userPasswordAction, initial);
  const zh = locale === "zh";
  const error = state.error === "mismatch" ? (zh ? "两次输入的密码不一致。" : "The passwords do not match.") : state.error === "policy" ? (zh ? "密码至少 12 位，且需包含大小写字母、数字和符号。" : "Use 12+ characters with uppercase, lowercase, number, and symbol.") : state.error ? (zh ? "无法修改密码，请重试。" : "The password could not be changed.") : null;
  return <form action={action} className="auth-form card"><input type="hidden" name="locale" value={locale} /><label className="field-label" htmlFor="user-new-password">{zh ? "新密码" : "New password"}</label><input className="field-input" id="user-new-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /><label className="field-label" htmlFor="user-confirm-password">{zh ? "确认新密码" : "Confirm new password"}</label><input className="field-input" id="user-confirm-password" name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary auth-submit" disabled={pending}><KeyRound size={16} />{pending ? (zh ? "正在保存…" : "Saving…") : zh ? "保存并继续" : "Save and continue"}</button></form>;
}
