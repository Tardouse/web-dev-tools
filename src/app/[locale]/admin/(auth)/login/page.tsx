import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { isLocale, localePath } from "@/i18n";
import { getCurrentAdmin } from "@/server/auth/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getCurrentAdmin()) redirect(localePath(locale, "/admin"));
  const zh = locale === "zh";
  return <main className="auth-page page-shell"><div className="auth-wrap"><div className="auth-heading"><span className="auth-lock"><LockKeyhole size={23} /></span><div><span className="eyebrow">{zh ? "受限区域" : "Restricted area"}</span><h1>{zh ? "管理认证" : "Administration authentication"}</h1><p>{zh ? "仅限获得授权的管理人员。" : "Authorized administrative personnel only."}</p></div></div><AdminLoginForm locale={locale} /></div></main>;
}
