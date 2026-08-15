import Link from "next/link";
import { Search, UserRoundSearch } from "lucide-react";
import { notFound } from "next/navigation";
import { CreateUserButton } from "@/components/admin/create-user-button";
import { UserActions } from "@/components/admin/user-actions";
import { roleLabel } from "@/lib/admin-ui";
import { isLocale, localePath } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";
import { listUsers } from "@/server/db/users";

interface SearchValues { q?: string; role?: string; status?: string; page?: string }

export default async function UsersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SearchValues> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  const values = await searchParams;
  const result = await listUsers({
    query: values.q,
    role: values.role === "user" || values.role === "admin" || values.role === "super_admin" ? values.role : "all",
    status: values.status === "active" || values.status === "disabled" ? values.status : "all",
    page: Number(values.page) || 1,
  });
  const zh = locale === "zh";
  const date = new Intl.DateTimeFormat(zh ? "zh-CN" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  const pageUrl = (page: number) => { const query = new URLSearchParams(); if (result.filters.query) query.set("q", result.filters.query); if (result.filters.role !== "all") query.set("role", result.filters.role); if (result.filters.status !== "all") query.set("status", result.filters.status); query.set("page", String(page)); return `${localePath(locale, "/admin/users")}?${query}`; };
  return (
    <>
      <header className="admin-page-heading"><div><span className="eyebrow">{zh ? "账号与权限" : "Accounts & access"}</span><h1>{zh ? "用户管理" : "User management"}</h1><p>{zh ? `共 ${result.total} 名用户，可搜索、查看并安全管理其状态与角色。` : `${result.total} users. Search, inspect, and safely manage status and roles.`}</p></div><CreateUserButton locale={locale} /></header>
      <form className="user-filters card" method="get">
        <label className="user-search"><Search size={17} /><span className="sr-only">{zh ? "搜索用户" : "Search users"}</span><input name="q" defaultValue={result.filters.query} placeholder={zh ? "按姓名、邮箱或用户名搜索…" : "Search by name, email, or username…"} maxLength={100} /></label>
        <select className="field-select" name="role" defaultValue={result.filters.role} aria-label={zh ? "角色筛选" : "Role filter"}><option value="all">{zh ? "全部角色" : "All roles"}</option><option value="user">{roleLabel("user", locale)}</option><option value="admin">{roleLabel("admin", locale)}</option><option value="super_admin">{roleLabel("super_admin", locale)}</option></select>
        <select className="field-select" name="status" defaultValue={result.filters.status} aria-label={zh ? "状态筛选" : "Status filter"}><option value="all">{zh ? "全部状态" : "All statuses"}</option><option value="active">{zh ? "正常" : "Active"}</option><option value="disabled">{zh ? "已禁用" : "Disabled"}</option></select>
        <button className="button button-primary"><Search size={16} />{zh ? "筛选" : "Filter"}</button>
        <Link className="button" href={localePath(locale, "/admin/users")}>{zh ? "重置" : "Reset"}</Link>
      </form>
      <div className="card user-table-card">
        {result.users.length === 0 ? <div className="admin-empty"><div><UserRoundSearch size={35} /><h2>{zh ? "未找到用户" : "No users found"}</h2><p>{zh ? "请尝试其他关键词或重置筛选。" : "Try another search or reset the filters."}</p></div></div> : <div className="table-scroll"><table className="admin-table user-table"><thead><tr><th>{zh ? "用户" : "User"}</th><th>{zh ? "角色" : "Role"}</th><th>{zh ? "状态" : "Status"}</th><th>{zh ? "注册时间" : "Registered"}</th><th>{zh ? "最后登录" : "Last sign-in"}</th><th>{zh ? "工具使用" : "Tool uses"}</th><th><span className="sr-only">{zh ? "操作" : "Actions"}</span></th></tr></thead><tbody>{result.users.map((user) => <tr key={user.id}><td><Link className="user-cell" href={localePath(locale, `/admin/users/${user.id}`)}><span>{initials(user.name)}</span><div><strong>{user.name}</strong><small>{user.username ?? user.email}</small></div></Link></td><td><span className="badge">{roleLabel(user.role, locale)}</span></td><td><span className={`badge ${user.status === "active" ? "badge-success" : "badge-danger"}`}>{user.status === "active" ? (zh ? "正常" : "Active") : zh ? "已禁用" : "Disabled"}</span></td><td>{date.format(new Date(user.createdAt))}</td><td>{user.lastLoginAt ? date.format(new Date(user.lastLoginAt)) : "—"}</td><td>{user.toolUsageCount}</td><td><UserActions locale={locale} actor={actor} user={user} compact /></td></tr>)}</tbody></table></div>}
      </div>
      {result.pageCount > 1 && <nav className="pagination" aria-label={zh ? "分页" : "Pagination"}><Link className={`button button-sm ${result.page <= 1 ? "is-disabled" : ""}`} href={result.page > 1 ? pageUrl(result.page - 1) : pageUrl(1)} aria-disabled={result.page <= 1}>{zh ? "上一页" : "Previous"}</Link><span>{zh ? `第 ${result.page} / ${result.pageCount} 页` : `Page ${result.page} of ${result.pageCount}`}</span><Link className={`button button-sm ${result.page >= result.pageCount ? "is-disabled" : ""}`} href={result.page < result.pageCount ? pageUrl(result.page + 1) : pageUrl(result.pageCount)} aria-disabled={result.page >= result.pageCount}>{zh ? "下一页" : "Next"}</Link></nav>}
    </>
  );
}

function initials(name: string): string { return Array.from(name.trim()).slice(0, 2).join("").toUpperCase() || "?"; }
