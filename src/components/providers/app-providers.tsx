"use client";

import { useEffect } from "react";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    return () => {
      delete document.documentElement.dataset.hydrated;
    };
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AnalyticsTracker />
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
