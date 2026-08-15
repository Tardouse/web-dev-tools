"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { getRecentTools } from "@/lib/browser-storage";
import { ToolCard } from "@/components/tool-card";
import type { Locale, Messages } from "@/i18n";
import type { ToolDefinition } from "@/lib/types";

export function RecentTools({
  locale,
  messages,
  tools,
}: {
  locale: Locale;
  messages: Messages;
  tools: ToolDefinition[];
}) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setSlugs(getRecentTools());
    sync();
    window.addEventListener("devtoolbox:storage", sync);
    return () => window.removeEventListener("devtoolbox:storage", sync);
  }, []);
  const recent = slugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool) => tool !== undefined)
    .slice(0, 4);
  if (!recent.length) return null;
  return (
    <section className="section-sm">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{messages.favorites.workspace}</span>
          <h2>
            <Clock3
              size={20}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            {messages.favorites.recentTitle}
          </h2>
        </div>
      </div>
      <div className="tool-grid">
        {recent.map((tool) => (
          <ToolCard
            tool={tool}
            locale={locale}
            messages={messages}
            key={tool.id}
          />
        ))}
      </div>
    </section>
  );
}
