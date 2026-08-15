import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { isLocale, localePath } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getCurrentUser()) redirect(localePath(locale, "/account"));
  const zh = locale === "zh";
  return <main className="auth-page page-shell"><div className="auth-wrap"><Link href={localePath(locale)} className="logo auth-logo"><span className="logo-mark">&lt;/&gt;</span><span>DevToolbox</span></Link><div className="auth-heading"><span className="auth-lock"><UserPlus size={23} /></span><div><span className="eyebrow">{zh ? "免费账号" : "Free account"}</span><h1>{zh ? "创建账号" : "Create an account"}</h1><p>{zh ? "保存常用工具和个人设置，不会保存您的工具输入。" : "Save favorite tools and preferences without storing tool inputs."}</p></div></div><RegisterForm locale={locale} /><Link className="auth-back" href={localePath(locale)}>← {zh ? "返回工具箱" : "Back to toolbox"}</Link></div></main>;
}
