import type { SiteSettings } from "@/lib/site-settings";

export function BrandLogo({ settings }: { settings: SiteSettings }) {
  return (
    <>
      <span className="logo-mark" aria-hidden="true">
        {settings.logoUrl ? (
          // Dynamic administrator-provided URLs cannot use a fixed remote image allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt="" />
        ) : (
          settings.logoText
        )}
      </span>
      <span>{settings.siteName}</span>
    </>
  );
}
