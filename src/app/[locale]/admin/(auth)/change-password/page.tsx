import { notFound, redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { isLocale, localePath } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";

export default async function ChangePasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireAdmin(locale);
  if (!user.mustChangePassword) redirect(localePath(locale, "/admin"));
  const zh = locale === "zh";
  return <main className="forced-password-page page-shell"><div><span className="eyebrow">{zh ? "账号安全" : "Account security"}</span><h1>{zh ? "设置新密码" : "Set a new password"}</h1><p>{zh ? "管理员已重置您的密码。继续使用后台前，请设置仅您知道的新密码。" : "An administrator reset your password. Set a private password before continuing."}</p><ChangePasswordForm locale={locale} /></div></main>;
}
