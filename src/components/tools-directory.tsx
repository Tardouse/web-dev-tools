"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolCard } from "@/components/tool-card";
import { getCategories, searchTools } from "@/lib/tool-registry";
import type { Locale, Messages } from "@/i18n";

export function ToolsDirectory({
  initialCategory = "all",
  locale,
  messages,
}: {
  initialCategory?: string;
  locale: Locale;
  messages: Messages;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const categories = getCategories(locale);
  const results = useMemo(
    () =>
      searchTools(query, locale).filter(
        (tool) => category === "all" || tool.category === category,
      ),
    [query, category, locale],
  );
  return (
    <>
      <div className="filter-bar">
        <label className="filter-input">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={messages.search.filterPlaceholder}
          />
          <span className="sr-only">{messages.search.filterPlaceholder}</span>
        </label>
        <select
          className="select"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label={messages.search.categoryFilter}
        >
          <option value="all">{messages.home.allCategories}</option>
          {categories.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      {results.length ? (
        <div className="tool-grid">
          {results.map((tool) => (
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
          <Search size={30} />
          <h3>{messages.search.noToolsTitle}</h3>
          <p>{messages.search.noToolsDescription}</p>
          <button
            className="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            {messages.search.clearFilters}
          </button>
        </div>
      )}
    </>
  );
}
