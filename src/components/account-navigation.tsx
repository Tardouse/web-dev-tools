"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { localePath, type Locale } from "@/i18n";

export function AccountNavigation({ locale }: { locale: Locale }) {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { admin?: boolean } | null) => setAdmin(data?.admin === true))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (admin) {
    return (
      <Link className="account-link" href={localePath(locale, "/admin")}>
        <LayoutDashboard size={17} />
        <span>{locale === "zh" ? "管理后台" : "Admin"}</span>
      </Link>
    );
  }
  return (
    <Link className="account-link" href={localePath(locale, "/login")}>
      <LogIn size={17} />
      <span>{locale === "zh" ? "登录" : "Sign in"}</span>
    </Link>
  );
}
