import { notFound } from "next/navigation";
import { SystemSettingsForm } from "@/components/admin/system-settings-form";
import { isLocale } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";
import { getSiteSettings } from "@/server/db/settings";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  if (actor.role !== "super_admin") notFound();
  const settings = await getSiteSettings();
  const zh = locale === "zh";
  return <><header className="admin-page-heading"><div><span className="eyebrow">{zh ? "全局行为" : "Global behavior"}</span><h1>{zh ? "系统设置" : "System settings"}</h1><p>{zh ? "管理公开站点身份、账号策略、限制和维护状态。" : "Manage public identity, account policy, limits, and maintenance state."}</p></div></header><SystemSettingsForm locale={locale} settings={settings} /></>;
}
