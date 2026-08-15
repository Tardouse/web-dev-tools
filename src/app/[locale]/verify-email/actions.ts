"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale, localePath } from "@/i18n";
import {
  consumeEmailVerification,
  requestEmailVerification,
} from "@/server/auth/account-tokens";
import { getClientIp } from "@/server/auth/session";

const tokenSchema = z.object({
  locale: z.string().refine(isLocale),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});
const requestSchema = z.object({
  locale: z.string().refine(isLocale),
  email: z.email().trim().max(254),
});

export interface VerifyEmailState {
  error?: "invalid" | "expired" | "used";
}

export interface VerificationRequestState {
  error?: "validation";
  submitted?: boolean;
}

export async function verifyEmailAction(
  _state: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  const parsed = tokenSchema.safeParse({
    locale: formData.get("locale"),
    token: formData.get("token"),
  });
  if (!parsed.success) return { error: "invalid" };
  const result = await consumeEmailVerification(parsed.data.token);
  if (result !== "success") return { error: result };
  redirect(`${localePath(parsed.data.locale, "/login")}?verified=1`);
}

export async function resendVerificationAction(
  _state: VerificationRequestState,
  formData: FormData,
): Promise<VerificationRequestState> {
  const parsed = requestSchema.safeParse({
    locale: formData.get("locale"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: "validation" };
  await requestEmailVerification(
    parsed.data.email,
    parsed.data.locale,
    getClientIp(await headers()),
  );
  return { submitted: true };
}
