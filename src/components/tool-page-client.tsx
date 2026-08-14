"use client";

import { useEffect } from "react";
import { recordRecentTool } from "@/lib/browser-storage";

export function ToolPageClient({ slug }: { slug: string }) {
  useEffect(() => recordRecentTool(slug), [slug]);
  return null;
}
