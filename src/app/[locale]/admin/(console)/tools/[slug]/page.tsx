import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { ToolDangerActions } from "@/components/admin/tool-danger-actions";
import { ToolForm } from "@/components/admin/tool-form";
import { isLocale, localePath } from "@/i18n";
import { getCategories, getTools } from "@/lib/tool-registry";
import { requireAdmin } from "@/server/auth/authorization";
import { getManagedTool } from "@/server/db/tool-management";

export default async function EditToolPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale);
  const tool = await getManagedTool(slug);
  if (!tool) notFound();
  const zh = locale === "zh";
  return <><Link className="admin-back-link" href={localePath(locale, "/admin/tools")}><ArrowLeft size={16} />{zh ? "返回工具管理" : "Back to tools"}</Link><header className="admin-page-heading"><div><span className="eyebrow">{tool.source === "core" ? (zh ? "核心工具" : "Core tool") : (zh ? "自定义工具" : "Custom tool")}</span><h1>{locale === "zh" ? tool.nameZh : tool.nameEn}</h1><p>/{tool.slug} · {zh ? "实现" : "Engine"}: {tool.implementation}</p></div>{tool.enabled && <Link className="button" href={localePath(locale, `/tools/${tool.slug}`)}><ExternalLink size={16} />{zh ? "查看公开页面" : "View public page"}</Link>}</header><ToolForm locale={locale} tool={tool} implementations={getTools(locale).map((item) => ({ value: item.slug, label: `${item.name} (${item.slug})` }))} categories={getCategories(locale).map((category) => ({ value: category.id, label: category.name }))} defaultLimitMb={tool.maxInputSize / 1024 / 1024} /><section className="settings-section danger-section card"><div className="settings-section-heading"><div><h2>{tool.source === "core" ? (zh ? "恢复默认值" : "Restore defaults") : (zh ? "删除工具" : "Delete tool")}</h2><p>{tool.source === "core" ? (zh ? "移除所有数据库覆盖并恢复源码注册信息。" : "Remove database overrides and restore source metadata.") : (zh ? "永久移除自定义目录项，核心实现不会被删除。" : "Permanently remove this custom catalog entry; the core engine remains.")}</p></div></div><ToolDangerActions locale={locale} slug={tool.slug} source={tool.source} customized={tool.customized} /></section></>;
}
