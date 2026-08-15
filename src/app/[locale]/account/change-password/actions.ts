"use server";

import { redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n";
import { createSession, getCurrentUser } from "@/server/auth/session";
import { getDatabase } from "@/server/db/database";
import { changeOwnPassword } from "@/server/db/user-management";

export interface UserPasswordState { error?: "policy" | "mismatch" | "unknown" }
export async function userPasswordAction(_state: UserPasswordState, formData: FormData): Promise<UserPasswordState> {
  const value = String(formData.get("locale") ?? "zh");
  const locale = isLocale(value) ? value : "zh";
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirm") ?? "")) return { error: "mismatch" };
  const user = await getCurrentUser();
  if (!user) redirect(localePath(locale, "/login"));
  try {
    await changeOwnPassword(user, password);
    const row = getDatabase().prepare("SELECT password_version FROM users WHERE id = ?").get(user.id) as { password_version: number };
    await createSession(user.id, row.password_version, "user");
  } catch (error) {
    return { error: error instanceof Error && error.message.includes("policy") ? "policy" : "unknown" };
  }
  redirect(localePath(locale, "/account"));
}
