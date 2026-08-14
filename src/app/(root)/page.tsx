import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  isLocale,
  localeFromAcceptLanguage,
  localePath,
  LOCALE_COOKIE,
} from "@/i18n";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale =
    saved && isLocale(saved)
      ? saved
      : localeFromAcceptLanguage((await headers()).get("accept-language"));
  redirect(localePath(locale));
}
