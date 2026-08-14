"use server";

import { revalidatePath } from "next/cache";
import { isLocale, localePath } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";
import {
  changeUserRole,
  deleteUser,
  resetUserPassword,
  setUserStatus,
  UserManagementError,
} from "@/server/db/user-management";

export interface UserActionState {
  ok?: boolean;
  error?: string;
  temporaryPassword?: string;
}

function fields(formData: FormData) {
  const localeValue = String(formData.get("locale") ?? "zh");
  return {
    locale: isLocale(localeValue) ? localeValue : "zh",
    userId: String(formData.get("userId") ?? ""),
  };
}

function message(error: unknown): string {
  if (error instanceof UserManagementError) return error.code;
  return "unknown";
}

function revalidate(locale: "zh" | "en", userId: string): void {
  revalidatePath(localePath(locale, "/admin/users"));
  revalidatePath(localePath(locale, `/admin/users/${userId}`));
}

export async function statusAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const { locale, userId } = fields(formData);
  try {
    const actor = await requireAdmin();
    await setUserStatus(actor, userId, formData.get("status") === "disabled" ? "disabled" : "active");
    revalidate(locale, userId);
    return { ok: true };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function roleAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const { locale, userId } = fields(formData);
  try {
    const actor = await requireAdmin();
    await changeUserRole(actor, userId, String(formData.get("role") ?? ""));
    revalidate(locale, userId);
    return { ok: true };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function resetPasswordAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const { locale, userId } = fields(formData);
  try {
    const actor = await requireAdmin();
    const temporaryPassword = await resetUserPassword(actor, userId);
    revalidate(locale, userId);
    return { ok: true, temporaryPassword };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function deleteUserAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const { locale, userId } = fields(formData);
  try {
    const actor = await requireAdmin();
    await deleteUser(actor, userId);
    revalidate(locale, userId);
    return { ok: true };
  } catch (error) {
    return { error: message(error) };
  }
}
