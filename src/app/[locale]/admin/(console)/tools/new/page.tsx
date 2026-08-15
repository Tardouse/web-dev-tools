import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ToolForm } from "@/components/admin/tool-form";
import { isLocale, localePath } from "@/i18n";
import { getCategories, getTools } from "@/lib/tool-registry";
import { requireAdmin } from "@/server/auth/authorization";
import { getSiteSettings } from "@/server/db/settings";

export default async function NewToolPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale);
  const zh = locale === "zh";
  const settings = await getSiteSettings();
  return <><Link className="admin-back-link" href={localePath(locale, "/admin/tools")}><ArrowLeft size={16} />{zh ? "返回工具管理" : "Back to tools"}</Link><header className="admin-page-heading"><div><span className="eyebrow">{zh ? "新增目录项" : "New catalog entry"}</span><h1>{zh ? "新增工具" : "Add tool"}</h1><p>{zh ? "选择一个核心实现引擎，并配置独立的 URL 与双语元数据。" : "Choose a core engine and configure a distinct URL with bilingual metadata."}</p></div></header><ToolForm locale={locale} implementations={getTools(locale).map((tool) => ({ value: tool.slug, label: `${tool.name} (${tool.slug})` }))} categories={getCategories(locale).map((category) => ({ value: category.id, label: category.name }))} defaultLimitMb={settings.defaultToolLimit / 1024 / 1024} /></>;
}
