"use client";

import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { localePath, type Locale } from "@/i18n";

export function AccountNavigation({ locale }: { locale: Locale }) {
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { authenticated?: boolean } | null) => setAuthenticated(data?.authenticated === true))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return authenticated ? (
    <Link className="account-link" href={localePath(locale, "/account")}><UserRound size={17} /><span>{locale === "zh" ? "我的账号" : "Account"}</span></Link>
  ) : (
    <Link className="account-link" href={localePath(locale, "/login")}><LogIn size={17} /><span>{locale === "zh" ? "登录" : "Sign in"}</span></Link>
  );
}
