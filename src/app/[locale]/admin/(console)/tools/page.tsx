import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { notFound } from "next/navigation";
import { setToolEnabledAction } from "@/app/[locale]/admin/(console)/tools/actions";
import { ToolIcon } from "@/components/icon";
import { getCategories } from "@/lib/tool-registry";
import { isLocale, localePath } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";
import { listManagedTools } from "@/server/db/tool-management";

interface SearchValues {
  q?: string;
  category?: string;
  source?: string;
  status?: string;
}

export default async function AdminToolsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchValues>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale);
  const zh = locale === "zh";
  const categories = getCategories(locale);
  const categoryIds = new Set(categories.map((category) => category.id));
  const normalized = (query.q ?? "").trim().toLowerCase().slice(0, 100);
  const category = categoryIds.has(query.category as never) ? query.category : "all";
  const source = query.source === "core" || query.source === "custom" ? query.source : "all";
  const status = query.status === "enabled" || query.status === "disabled" ? query.status : "all";
  const allTools = await listManagedTools();
  const tools = allTools.filter((tool) =>
    (!normalized || `${tool.slug} ${tool.nameEn} ${tool.nameZh} ${tool.keywordsEn.join(" ")} ${tool.keywordsZh.join(" ")}`.toLowerCase().includes(normalized)) &&
    (category === "all" || tool.category === category) &&
    (source === "all" || tool.source === source) &&
    (status === "all" || tool.enabled === (status === "enabled")),
  );
  const categoryNames = new Map(categories.map((item) => [item.id, item.name]));
  return (
    <>
      <header className="admin-page-heading">
        <div><span className="eyebrow">{zh ? "目录与访问" : "Catalog & access"}</span><h1>{zh ? "工具管理" : "Tool management"}</h1><p>{zh ? `共 ${allTools.length} 个工具，当前显示 ${tools.length} 个。` : `${allTools.length} tools, ${tools.length} shown.`}</p></div>
        <Link className="button button-primary" href={localePath(locale, "/admin/tools/new")}><Plus size={16} />{zh ? "新增工具" : "Add tool"}</Link>
      </header>
      <form className="tool-filters card" method="get">
        <label className="user-search"><Search size={17} /><span className="sr-only">{zh ? "搜索工具" : "Search tools"}</span><input name="q" defaultValue={query.q} placeholder={zh ? "按名称、Slug 或关键词搜索…" : "Search name, slug, or keyword…"} maxLength={100} /></label>
        <select className="field-select" name="category" defaultValue={category} aria-label={zh ? "分类筛选" : "Category filter"}><option value="all">{zh ? "全部分类" : "All categories"}</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
        <select className="field-select" name="source" defaultValue={source} aria-label={zh ? "来源筛选" : "Source filter"}><option value="all">{zh ? "全部来源" : "All sources"}</option><option value="core">{zh ? "核心工具" : "Core"}</option><option value="custom">{zh ? "自定义工具" : "Custom"}</option></select>
        <select className="field-select" name="status" defaultValue={status} aria-label={zh ? "状态筛选" : "Status filter"}><option value="all">{zh ? "全部状态" : "All statuses"}</option><option value="enabled">{zh ? "已启用" : "Enabled"}</option><option value="disabled">{zh ? "已禁用" : "Disabled"}</option></select>
        <button className="button button-primary"><SlidersHorizontal size={16} />{zh ? "筛选" : "Filter"}</button>
        <Link className="button" href={localePath(locale, "/admin/tools")}>{zh ? "重置" : "Reset"}</Link>
      </form>
      <div className="card user-table-card">
        {tools.length ? <div className="table-scroll"><table className="admin-table tool-admin-table"><thead><tr><th>{zh ? "工具" : "Tool"}</th><th>{zh ? "来源" : "Source"}</th><th>{zh ? "分类" : "Category"}</th><th>{zh ? "访问" : "Access"}</th><th>{zh ? "排序" : "Order"}</th><th>{zh ? "状态" : "Status"}</th><th><span className="sr-only">{zh ? "操作" : "Actions"}</span></th></tr></thead><tbody>{tools.map((tool) => <tr key={tool.slug}><td><Link className="tool-admin-cell" href={localePath(locale, `/admin/tools/${tool.slug}`)}><span className="tool-icon"><ToolIcon name="Wrench" size={18} /></span><span><strong>{locale === "zh" ? tool.nameZh : tool.nameEn}</strong><small>/{tool.slug}{tool.customized ? ` · ${zh ? "已自定义" : "Customized"}` : ""}</small></span></Link></td><td><span className="badge">{tool.source === "core" ? (zh ? "核心" : "Core") : (zh ? "自定义" : "Custom")}</span></td><td>{categoryNames.get(tool.category)}</td><td><div className="table-badges"><span className="badge">{tool.requiresLogin ? (zh ? "登录" : "Sign-in") : (zh ? "公开" : "Public")}</span>{!tool.freeToUse && <span className="badge badge-warning">{zh ? "付费" : "Paid"}</span>}{tool.featured && <span className="badge badge-success">{zh ? "推荐" : "Featured"}</span>}</div></td><td>{tool.sortOrder}</td><td><span className={`badge ${tool.enabled ? "badge-success" : "badge-danger"}`}>{tool.enabled ? (zh ? "已启用" : "Enabled") : (zh ? "已禁用" : "Disabled")}</span></td><td><form action={setToolEnabledAction}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="slug" value={tool.slug} /><input type="hidden" name="enabled" value={String(!tool.enabled)} /><button className="button button-sm">{tool.enabled ? (zh ? "禁用" : "Disable") : (zh ? "启用" : "Enable")}</button></form></td></tr>)}</tbody></table></div> : <div className="admin-empty"><div><Search size={34} /><h2>{zh ? "未找到工具" : "No tools found"}</h2><p>{zh ? "请尝试其他筛选条件。" : "Try another filter."}</p></div></div>}
      </div>
    </>
  );
}
