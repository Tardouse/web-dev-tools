"use client";

import { Clock3, Search, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFavorites, getRecentTools } from "@/lib/browser-storage";
import { ToolCard } from "@/components/tool-card";
import { localePath, type Locale, type Messages } from "@/i18n";
import type { ToolDefinition } from "@/lib/types";

export function FavoritesPage({
  locale,
  messages,
  tools,
}: {
  locale: Locale;
  messages: Messages;
  tools: ToolDefinition[];
}) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => {
      setFavorites(getFavorites());
      setRecent(getRecentTools());
    };
    sync();
    window.addEventListener("devtoolbox:storage", sync);
    return () => window.removeEventListener("devtoolbox:storage", sync);
  }, []);
  const resolve = (slugs: string[]) =>
    slugs
      .map((slug) => tools.find((tool) => tool.slug === slug))
      .filter((tool) => tool !== undefined);
  const favoriteTools = resolve(favorites);
  const recentTools = resolve(recent);
  return (
    <>
      <section className="section-sm">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{messages.favorites.saved}</span>
            <h2>
              <Star
                size={21}
                style={{ verticalAlign: "-3px", marginRight: 8 }}
              />
              {messages.favorites.title}
            </h2>
            <p>{messages.favorites.description}</p>
          </div>
        </div>
        {favoriteTools.length ? (
          <div className="tool-grid">
            {favoriteTools.map((tool) => (
              <ToolCard
                tool={tool}
                locale={locale}
                messages={messages}
                key={tool.id}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <Star size={30} />
            <h3>{messages.favorites.emptyTitle}</h3>
            <p>{messages.favorites.emptyDescription}</p>
            <Link
              className="button button-primary"
              href={localePath(locale, "/tools")}
            >
              <Search size={16} />
              {messages.favorites.browse}
            </Link>
          </div>
        )}
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <h2>
              <Clock3
                size={21}
                style={{ verticalAlign: "-3px", marginRight: 8 }}
              />
              {messages.favorites.recentTitle}
            </h2>
            <p>{messages.favorites.recentDescription}</p>
          </div>
        </div>
        {recentTools.length ? (
          <div className="tool-grid">
            {recentTools.map((tool) => (
              <ToolCard
                tool={tool}
                locale={locale}
                messages={messages}
                key={tool.id}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <Clock3 size={30} />
            <h3>{messages.favorites.noRecentTitle}</h3>
            <p>{messages.favorites.noRecentDescription}</p>
          </div>
        )}
      </section>
    </>
  );
}
