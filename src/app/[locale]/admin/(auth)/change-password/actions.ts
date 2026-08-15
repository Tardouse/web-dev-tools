"use server";

import { redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";
import { createSession } from "@/server/auth/session";
import { getDatabase } from "@/server/db/database";
import { changeOwnPassword } from "@/server/db/user-management";

export interface ChangePasswordState { error?: "policy" | "mismatch" | "unknown" }

export async function changePasswordAction(_state: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const localeValue = String(formData.get("locale") ?? "zh");
  const locale = isLocale(localeValue) ? localeValue : "zh";
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) return { error: "mismatch" };
  try {
    const actor = await requireAdmin();
    await changeOwnPassword(actor, password);
    const row = getDatabase().prepare("SELECT password_version FROM users WHERE id = ?").get(actor.id) as { password_version: number };
    await createSession(actor.id, row.password_version, "admin");
  } catch (error) {
    return { error: error instanceof Error && error.message.includes("policy") ? "policy" : "unknown" };
  }
  redirect(localePath(locale, "/admin"));
}
