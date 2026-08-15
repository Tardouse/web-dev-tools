"use server";

import { redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n";
import { deleteCurrentSession } from "@/server/auth/session";

export async function userLogoutAction(formData: FormData): Promise<void> {
  const value = String(formData.get("locale") ?? "zh");
  const locale = isLocale(value) ? value : "zh";
  await deleteCurrentSession("user");
  redirect(localePath(locale));
}
