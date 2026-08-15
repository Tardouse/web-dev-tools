"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale, localePath } from "@/i18n";
import { consumePasswordReset } from "@/server/auth/account-tokens";
import { passwordSchema } from "@/server/auth/password";

const schema = z.object({
  locale: z.string().refine(isLocale),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  password: passwordSchema,
  confirm: z.string().min(1).max(128),
}).superRefine((value, context) => {
  if (value.password !== value.confirm) {
    context.addIssue({ code: "custom", path: ["confirm"], message: "password_mismatch" });
  }
});

export interface ResetPasswordState {
  error?: "invalid" | "expired" | "used" | "policy" | "mismatch";
}

export async function resetPasswordAction(
  _state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    locale: formData.get("locale"),
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((issue) => issue.message === "password_mismatch");
    return { error: mismatch ? "mismatch" : "policy" };
  }
  const result = await consumePasswordReset(parsed.data.token, parsed.data.password);
  if (result !== "success") {
    return { error: result === "invalid_password" ? "policy" : result };
  }
  redirect(`${localePath(parsed.data.locale, "/login")}?reset=1`);
}
