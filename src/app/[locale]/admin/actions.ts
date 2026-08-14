"use server";

import { redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n";
import { deleteCurrentSession } from "@/server/auth/session";

export async function logoutAction(formData: FormData): Promise<void> {
  const localeValue = String(formData.get("locale") ?? "zh");
  const locale = isLocale(localeValue) ? localeValue : "zh";
  await deleteCurrentSession();
  redirect(localePath(locale, "/login"));
}
