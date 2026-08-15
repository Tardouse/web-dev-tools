import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { isLocale, localePath } from "@/i18n";
import { requireAdmin } from "@/server/auth/authorization";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireAdmin(locale);
  if (user.mustChangePassword) {
    redirect(localePath(locale, "/admin/change-password"));
  }
  return (
    <AdminShell locale={locale} user={user}>
      {children}
    </AdminShell>
  );
}
