import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FavoritesPage } from "@/components/favorites-page";
import { getMessages, isLocale } from "@/i18n";
import { getPublicTools } from "@/server/db/tool-management";

export const metadata: Metadata = { robots: { index: false, follow: true } };
export default async function MyToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const tools = await getPublicTools(locale);
  return (
    <div className="container">
      <Breadcrumbs
        locale={locale}
        homeLabel={messages.nav.home}
        items={[{ label: messages.nav.myTools }]}
      />
      <header className="tools-page-header">
        <span className="eyebrow">{messages.pages.myToolsEyebrow}</span>
        <h1>{messages.pages.myToolsTitle}</h1>
        <p>{messages.pages.myToolsDescription}</p>
      </header>
      <FavoritesPage locale={locale} messages={messages} tools={tools} />
    </div>
  );
}
