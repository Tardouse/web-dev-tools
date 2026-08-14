"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { SearchDialog } from "@/components/search-dialog";
import type { Locale, Messages } from "@/i18n";

export function HeroSearch({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="hero-search"
        onClick={() => setOpen(true)}
      >
        <Search size={21} />
        <span>{messages.home.searchPrompt}</span>
        <kbd>⌘ K</kbd>
      </button>
      <SearchDialog
        open={open}
        onClose={() => setOpen(false)}
        locale={locale}
        messages={messages}
      />
    </>
  );
}
