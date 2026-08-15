import type { Locale } from "@/i18n";
import type { UserRole } from "@/server/db/types";

export function roleLabel(role: UserRole, locale: Locale): string {
  const labels = {
    zh: { user: "用户", admin: "管理员", super_admin: "超级管理员" },
    en: { user: "User", admin: "Admin", super_admin: "Super Admin" },
  };
  return labels[locale][role];
}
