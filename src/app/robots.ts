import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/favorites",
        "/zh/account",
        "/en/account",
        "/zh/admin",
        "/en/admin",
        "/zh/login",
        "/en/login",
        "/zh/register",
        "/en/register",
      ],
    },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  };
}
