"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale, localePath } from "@/i18n";
import { authenticateAdmin } from "@/server/auth/login";
import { usernamePattern } from "@/server/db/database";

export interface AdminLoginState { error?: "invalid" | "locked" | "validation" }
const schema = z.object({
  locale: z.string().refine(isLocale),
  username: z.string().trim().regex(usernamePattern),
  password: z.string().min(1).max(128),
});
export async function adminLoginAction(_state: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = schema.safeParse({ locale: formData.get("locale"), username: formData.get("username"), password: formData.get("password") });
  if (!parsed.success) return { error: "validation" };
  const result = await authenticateAdmin(parsed.data.username, parsed.data.password);
  if (!result.ok) return { error: result.reason };
  redirect(localePath(parsed.data.locale, result.mustChangePassword ? "/admin/change-password" : "/admin"));
}
