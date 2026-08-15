import { notFound, redirect } from "next/navigation";
import { UserPasswordForm } from "@/components/user-password-form";
import { isLocale, localePath } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";

export default async function UserChangePasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(localePath(locale, "/login"));
  if (!user.mustChangePassword) redirect(localePath(locale, "/account"));
  const zh = locale === "zh";
  return <main className="forced-password-page page-shell"><div><span className="eyebrow">{zh ? "账号安全" : "Account security"}</span><h1>{zh ? "设置新密码" : "Set a new password"}</h1><p>{zh ? "请先设置仅您知道的新密码，再继续使用账号。" : "Set a private password before continuing."}</p><UserPasswordForm locale={locale} /></div></main>;
}
