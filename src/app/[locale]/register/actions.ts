"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { isLocale, localePath } from "@/i18n";
import { sendRegistrationVerification } from "@/server/auth/account-tokens";
import { getClientIp } from "@/server/auth/session";
import { passwordSchema } from "@/server/auth/password";
import { registerUser, registrationSchema } from "@/server/auth/user-accounts";

export interface RegisterState { error?: "invalid" | "mismatch" | "exists" | "limited" | "disabled" }
const schema = registrationSchema.extend({
  locale: z.string().refine(isLocale),
  confirm: passwordSchema,
}).superRefine((value, context) => {
  if (value.password !== value.confirm) {
    context.addIssue({ code: "custom", path: ["confirm"], message: "password_mismatch" });
  }
});

export async function registerAction(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = schema.safeParse({
    locale: formData.get("locale"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((issue) => issue.message === "password_mismatch");
    return { error: mismatch ? "mismatch" : "invalid" };
  }
  const ip = getClientIp(await headers());
  const result = await registerUser(parsed.data, ip);
  if (!result.ok) return { error: result.reason };
  if (!result.verificationRequired) {
    redirect(`${localePath(parsed.data.locale, "/login")}?registered=1`);
  }
  const delivery = await sendRegistrationVerification(
    result.userId,
    result.email,
    parsed.data.locale,
    ip,
  );
  redirect(`${localePath(parsed.data.locale, "/verify-email")}?sent=${delivery === "sent" ? "1" : "0"}`);
}
