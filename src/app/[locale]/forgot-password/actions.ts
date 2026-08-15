"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { isLocale } from "@/i18n";
import { requestPasswordReset } from "@/server/auth/account-tokens";
import { getClientIp } from "@/server/auth/session";

const schema = z.object({
  locale: z.string().refine(isLocale),
  email: z.email().trim().max(254),
});

export interface ForgotPasswordState {
  error?: "validation";
  submitted?: boolean;
}

export async function forgotPasswordAction(
  _state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({
    locale: formData.get("locale"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: "validation" };
  await requestPasswordReset(
    parsed.data.email,
    parsed.data.locale,
    getClientIp(await headers()),
  );
  return { submitted: true };
}
