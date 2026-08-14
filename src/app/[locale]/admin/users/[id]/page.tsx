import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, KeyRound, Mail, Shield, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { UserActions } from "@/components/admin/user-actions";
import { roleLabel } from "@/lib/admin-ui";
import { getTool } from "@/lib/tool-registry";
import { isLocale, localePath } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";
import { getRecentAuditLogs } from "@/server/db/audit";
import { getManagedUser, getUserSessions, getUserToolSummary } from "@/server/db/users";

export default async function UserDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  const [user, tools, sessions, audit] = await Promise.all([getManagedUser(id), getUserToolSummary(id), getUserSessions(id), getRecentAuditLogs(id, 15)]);
  if (!user) notFound();
  const zh = locale === "zh";
  const date = new Intl.DateTimeFormat(zh ? "zh-CN" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  return (
    <>
      <Link className="admin-back-link" href={localePath(locale, "/admin/users")}><ArrowLeft size={16} />{zh ? "返回用户列表" : "Back to users"}</Link>
      <header className="user-detail-heading"><div className="user-detail-avatar">{Array.from(user.name).slice(0, 2).join("").toUpperCase()}</div><div><div className="user-detail-name"><h1>{user.name}</h1><span className={`badge ${user.status === "active" ? "badge-success" : "badge-danger"}`}>{user.status === "active" ? (zh ? "正常" : "Active") : zh ? "已禁用" : "Disabled"}</span></div><p>{user.email}</p><div className="user-detail-badges"><span className="badge"><Shield size={13} />{roleLabel(user.role, locale)}</span>{user.mustChangePassword && <span className="badge badge-warning"><KeyRound size={13} />{zh ? "需修改密码" : "Password change required"}</span>}</div></div><div className="user-detail-actions"><UserActions locale={locale} actor={actor} user={user} /></div></header>
      <section className="user-info-grid">
        <Info icon={Mail} label={zh ? "邮箱" : "Email"} value={user.email} />
        <Info icon={CalendarDays} label={zh ? "注册时间" : "Registered"} value={date.format(new Date(user.createdAt))} />
        <Info icon={Clock3} label={zh ? "最后登录" : "Last sign-in"} value={user.lastLoginAt ? date.format(new Date(user.lastLoginAt)) : (zh ? "从未登录" : "Never")} />
        <Info icon={Wrench} label={zh ? "工具使用次数" : "Tool uses"} value={String(user.toolUsageCount)} />
      </section>
      <div className="user-detail-grid">
        <section className="card detail-card"><h2>{zh ? "工具使用统计" : "Tool usage"}</h2>{tools.length ? <div className="detail-list">{tools.map((tool) => <div key={tool.slug}><span><strong>{getTool(tool.slug, locale)?.name ?? tool.slug}</strong><small>{date.format(new Date(tool.lastUsedAt))}</small></span><b>{tool.count}</b></div>)}</div> : <div className="admin-empty compact">{zh ? "暂无使用记录" : "No usage recorded"}</div>}</section>
        <section className="card detail-card"><h2>{zh ? "登录记录" : "Sign-in sessions"}</h2>{sessions.length ? <div className="detail-list">{sessions.map((session, index) => <div key={`${session.createdAt}-${index}`}><span><strong>{session.ipAddress}</strong><small title={session.userAgent}>{date.format(new Date(session.lastActiveAt))} · {session.userAgent}</small></span><span className="badge">{new Date(session.expiresAt) > new Date() ? (zh ? "有效" : "Active") : zh ? "已过期" : "Expired"}</span></div>)}</div> : <div className="admin-empty compact">{zh ? "暂无有效会话" : "No sessions"}</div>}</section>
      </div>
      <section className="card detail-card audit-card"><h2>{zh ? "管理员操作记录" : "Admin activity"}</h2>{audit.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>{zh ? "时间" : "Time"}</th><th>{zh ? "操作者" : "Actor"}</th><th>{zh ? "操作" : "Action"}</th><th>{zh ? "结果" : "Result"}</th><th>IP</th></tr></thead><tbody>{audit.map((entry) => <tr key={entry.id}><td>{date.format(new Date(entry.createdAt))}</td><td>{entry.actorName}<small className="table-subtext">{entry.actorEmail}</small></td><td><code>{entry.action}</code></td><td><span className={`badge ${entry.result === "success" ? "badge-success" : "badge-danger"}`}>{entry.result}</span></td><td>{entry.ipAddress}</td></tr>)}</tbody></table></div> : <div className="admin-empty compact">{zh ? "暂无操作记录" : "No admin activity"}</div>}</section>
    </>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) { return <article className="card user-info-card"><Icon size={18} /><span>{label}</span><strong>{value}</strong></article>; }
