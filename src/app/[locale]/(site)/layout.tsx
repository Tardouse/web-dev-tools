import { AccountNavigation } from "@/components/account-navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale } from "@/i18n";
import { notFound } from "next/navigation";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);

  return (
    <>
      <SiteHeader
        locale={locale}
        messages={messages}
        accountNavigation={<AccountNavigation locale={locale} />}
      />
      <main className="page-shell">{children}</main>
      <SiteFooter locale={locale} messages={messages} />
    </>
  );
}
