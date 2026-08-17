"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolIcon } from "@/components/icon";
import { interpolate, localePath, type Locale, type Messages } from "@/i18n";
import type { ToolDefinition } from "@/lib/types";
import { getFavorites, toggleFavorite } from "@/lib/browser-storage";

export function ToolCard({
  tool,
  locale,
  messages,
}: {
  tool: ToolDefinition;
  locale: Locale;
  messages: Messages;
}) {
  const [favorite, setFavorite] = useState(false);
  useEffect(() => {
    const sync = () => setFavorite(getFavorites().includes(tool.slug));
    sync();
    window.addEventListener("devtoolbox:storage", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("devtoolbox:storage", sync);
      window.removeEventListener("storage", sync);
    };
  }, [tool.slug]);
  return (
    <article className="tool-card card">
      <div className="tool-card-top">
        <div className="tool-icon">
          <ToolIcon name={tool.icon} size={21} />
        </div>
        <button
          type="button"
          className={`icon-button favorite-button${favorite ? " is-favorite" : ""}`}
          onClick={() =>
            setFavorite(toggleFavorite(tool.slug).includes(tool.slug))
          }
          aria-label={interpolate(
            favorite ? messages.favorites.remove : messages.favorites.add,
            { name: tool.name },
          )}
        >
          <Star size={17} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      <Link
        href={localePath(locale, `/tools/${tool.slug}`)}
        className="card-link-overlay"
      >
        <span className="sr-only">
          {locale === "zh" ? `打开${tool.name}` : `Open ${tool.name}`}
        </span>
      </Link>
    </article>
  );
}
