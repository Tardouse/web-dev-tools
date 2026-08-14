"use client";

import { ArrowRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolIcon } from "@/components/icon";
import { interpolate, localePath, type Locale, type Messages } from "@/i18n";
import { getCategories, getCategory, searchTools } from "@/lib/tool-registry";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  messages: Messages;
}
export function SearchDialog({
  open,
  onClose,
  locale,
  messages,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const results = useMemo(
    () => searchTools(query, locale).slice(0, 10),
    [query, locale],
  );
  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);
  if (!open) return null;
  const visit = (slug: string) => {
    onClose();
    router.push(localePath(locale, `/tools/${slug}`));
  };
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={messages.search.dialogLabel}
      >
        <div className="search-dialog-input">
          <Search size={21} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder={messages.search.placeholder}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((current) =>
                  Math.min(results.length - 1, current + 1),
                );
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) => Math.max(0, current - 1));
              }
              if (event.key === "Enter" && results[activeIndex])
                visit(results[activeIndex].slug);
            }}
          />
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={messages.common.closeSearch}
          >
            <X size={18} />
          </button>
        </div>
        <div className="search-results">
          {results.length ? (
            results.map((tool, index) => (
              <button
                className="search-result"
                data-active={index === activeIndex}
                key={tool.id}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => visit(tool.slug)}
              >
                <div className="tool-icon">
                  <ToolIcon name={tool.icon} />
                </div>
                <span className="search-result-copy">
                  <strong>{tool.name}</strong>
                  <span>{tool.description}</span>
                </span>
                <span className="search-result-category">
                  {getCategory(tool.category, locale)?.name}
                </span>
                <ArrowRight size={16} />
              </button>
            ))
          ) : (
            <div className="empty-state">
              <Search size={30} />
              <h3>{messages.search.emptyTitle}</h3>
              <p>{messages.search.emptyDescription}</p>
            </div>
          )}
          {!query && (
            <div className="panel-label" style={{ marginTop: 8 }}>
              {interpolate(messages.search.summary, {
                categories: getCategories(locale).length,
                tools: searchTools("", locale).length,
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
