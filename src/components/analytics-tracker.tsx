"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "devtoolbox:visitor-id";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.includes("/admin") || pathname.includes("/login")) {
      return;
    }
    let visitorId = sessionStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      sessionStorage.setItem(VISITOR_KEY, visitorId);
    }
    void fetch("/api/metrics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, visitorId }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
