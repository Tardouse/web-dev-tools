"use server";

import { revalidatePath } from "next/cache";
import { localePath, locales } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";
import {
  SettingsError,
  updateSiteSettings,
} from "@/server/db/settings";

export interface SettingsActionState {
  ok?: boolean;
  error?: string;
}

function bool(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export async function updateSettingsAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const actor = await requireAdmin();
    await updateSiteSettings(actor, {
      siteName: String(formData.get("siteName") ?? ""),
      logoText: String(formData.get("logoText") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? ""),
      descriptionEn: String(formData.get("descriptionEn") ?? ""),
      descriptionZh: String(formData.get("descriptionZh") ?? ""),
      footerEn: String(formData.get("footerEn") ?? ""),
      footerZh: String(formData.get("footerZh") ?? ""),
      legalText: String(formData.get("legalText") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      registrationEnabled: bool(formData, "registrationEnabled"),
      emailVerificationEnabled: bool(formData, "emailVerificationEnabled"),
      defaultToolLimit: Math.round(
        Number(formData.get("defaultToolLimitMb")) * 1024 * 1024,
      ),
      fileUploadLimit: Math.round(
        Number(formData.get("fileUploadLimitMb")) * 1024 * 1024,
      ),
      anonymousApiLimit: Number(formData.get("anonymousApiLimit")),
      userApiLimit: Number(formData.get("userApiLimit")),
      adsEnabled: bool(formData, "adsEnabled"),
      maintenanceMode: bool(formData, "maintenanceMode"),
    });
    for (const publicLocale of locales) {
      revalidatePath(localePath(publicLocale), "layout");
    }
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof SettingsError ? error.code : "unknown",
    };
  }
}
