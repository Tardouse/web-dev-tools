"use server";

import { redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n";
import { createSession } from "@/server/auth/session";
import { registerUser } from "@/server/auth/user-accounts";

export interface RegisterState { error?: "invalid" | "mismatch" | "exists" | "limited" }
export async function registerAction(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const localeValue = String(formData.get("locale") ?? "zh");
  const locale = isLocale(localeValue) ? localeValue : "zh";
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirm") ?? "")) return { error: "mismatch" };
  const result = await registerUser({ name: formData.get("name"), email: formData.get("email"), password });
  if (!result.ok) return { error: result.reason };
  await createSession(result.userId, result.passwordVersion, "user");
  redirect(localePath(locale, "/account"));
}
