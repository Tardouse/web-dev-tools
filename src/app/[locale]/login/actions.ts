"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authenticateAdmin } from "@/server/auth/login";
import { isLocale, localePath } from "@/i18n";

export interface LoginState {
  error?: "invalid" | "locked" | "disabled" | "forbidden" | "validation";
}

const schema = z.object({
  locale: z.string().refine(isLocale),
  email: z.email().trim().max(254),
  password: z.string().min(1).max(128),
});

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    locale: formData.get("locale"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "validation" };
  const result = await authenticateAdmin(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.reason };
  redirect(localePath(parsed.data.locale, "/admin"));
}
