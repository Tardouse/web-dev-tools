"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ExternalLink, LogOut, Menu, Users, X } from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/app/[locale]/admin/(console)/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { localePath, type Locale } from "@/i18n";
import type { SessionUser } from "@/server/db/types";
import { roleLabel } from "@/lib/admin-ui";

export function AdminShell({
  children,
  locale,
  user,
}: {
  children: React.ReactNode;
  locale: Locale;
  user: SessionUser;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const zh = locale === "zh";
  const links = [
    {
      href: localePath(locale, "/admin"),
      label: zh ? "数据概览" : "Dashboard",
      icon: BarChart3,
      exact: true,
    },
    {
      href: localePath(locale, "/admin/users"),
      label: zh ? "用户管理" : "User management",
      icon: Users,
      exact: false,
    },
  ];
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-brand-row">
          <Link href={localePath(locale, "/admin")} className="logo">
            <span className="logo-mark">&lt;/&gt;</span>
            <span>DevToolbox</span>
          </Link>
          <button
            className="icon-button admin-close"
            onClick={() => setOpen(false)}
            aria-label={zh ? "关闭导航" : "Close navigation"}
          >
            <X size={20} />
          </button>
        </div>
        <div className="admin-product-label">{zh ? "管理后台" : "Admin console"}</div>
        <nav className="admin-nav" aria-label={zh ? "后台导航" : "Admin navigation"}>
          {links.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                className={`admin-nav-link ${active ? "is-active" : ""}`}
                href={item.href}
                onClick={() => setOpen(false)}
                key={item.href}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link className="admin-nav-link" href={localePath(locale)}>
            <ExternalLink size={18} />
            {zh ? "返回网站" : "View site"}
          </Link>
          <div className="admin-identity">
            <div>
              <strong>{user.name}</strong>
              <span>{user.username}</span>
            </div>
            <span className="badge">{roleLabel(user.role, locale)}</span>
          </div>
          <form action={logoutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button className="button admin-logout">
              <LogOut size={16} /> {zh ? "退出登录" : "Sign out"}
            </button>
          </form>
        </div>
      </aside>
      {open && (
        <button
          className="admin-overlay"
          onClick={() => setOpen(false)}
          aria-label={zh ? "关闭导航" : "Close navigation"}
        />
      )}
      <div className="admin-main">
        <header className="admin-mobile-header">
          <button
            className="icon-button"
            onClick={() => setOpen(true)}
            aria-label={zh ? "打开导航" : "Open navigation"}
          >
            <Menu size={21} />
          </button>
          <strong>{zh ? "管理后台" : "Admin console"}</strong>
          <LanguageSwitcher locale={locale} label={zh ? "EN" : "中文"} />
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

