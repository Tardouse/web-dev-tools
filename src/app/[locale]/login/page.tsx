import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { isLocale, localePath } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { isAdminRole } from "@/server/auth/authorization";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (user && isAdminRole(user.role)) redirect(localePath(locale, "/admin"));
  const zh = locale === "zh";
  return (
    <main className="auth-page page-shell">
      <div className="auth-wrap">
        <Link href={localePath(locale)} className="logo auth-logo">
          <span className="logo-mark">&lt;/&gt;</span>
          <span>DevToolbox</span>
        </Link>
        <div className="auth-heading">
          <span className="auth-lock">
            <LockKeyhole size={23} />
          </span>
          <div>
            <span className="eyebrow">{zh ? "安全访问" : "Secure access"}</span>
            <h1>{zh ? "管理后台登录" : "Admin sign in"}</h1>
            <p>
              {zh
                ? "仅限获得授权的管理员。登录失败将受到速率限制。"
                : "Authorized administrators only. Failed sign-ins are rate limited."}
            </p>
          </div>
        </div>
        <LoginForm locale={locale} />
        <Link className="auth-back" href={localePath(locale)}>
          ← {zh ? "返回工具箱" : "Back to toolbox"}
        </Link>
      </div>
    </main>
  );
}
