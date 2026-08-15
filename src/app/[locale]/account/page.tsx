import Link from "next/link";
import { Heart, History, LogOut, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { userLogoutAction } from "@/app/[locale]/account/actions";
import { isLocale, localePath } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(localePath(locale, "/login"));
  if (user.mustChangePassword) redirect(localePath(locale, "/account/change-password"));
  const zh = locale === "zh";
  return <main className="account-page page-shell"><div className="container account-wrap"><header className="account-heading"><span className="account-avatar"><UserRound size={26} /></span><div><span className="eyebrow">{zh ? "用户中心" : "Account"}</span><h1>{user.name}</h1><p>{user.email}</p></div></header><section className="account-grid"><Link className="card account-card" href={localePath(locale, "/favorites")}><Heart size={22} /><div><h2>{zh ? "收藏工具" : "Favorite tools"}</h2><p>{zh ? "查看当前浏览器保存的常用工具。" : "View tools saved in this browser."}</p></div></Link><Link className="card account-card" href={localePath(locale, "/favorites")}><History size={22} /><div><h2>{zh ? "最近使用" : "Recent tools"}</h2><p>{zh ? "快速返回最近打开的工具。" : "Return to recently opened tools."}</p></div></Link></section><form action={userLogoutAction}><input type="hidden" name="locale" value={locale} /><button className="button"><LogOut size={16} />{zh ? "退出登录" : "Sign out"}</button></form></div></main>;
}
