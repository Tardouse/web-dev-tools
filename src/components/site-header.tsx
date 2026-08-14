"use client";

import Link from "next/link";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SearchDialog } from "@/components/search-dialog";
import { useTheme } from "@/components/providers/theme-provider";
import { localePath, type Locale, type Messages } from "@/i18n";

export function SiteHeader({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const links = (
    <>
      <Link
        className="nav-link"
        href={localePath(locale, "/tools")}
        onClick={() => setMenuOpen(false)}
      >
        {messages.nav.allTools}
      </Link>
      <Link
        className="nav-link"
        href={localePath(locale, "/categories")}
        onClick={() => setMenuOpen(false)}
      >
        {messages.nav.categories}
      </Link>
      <Link
        className="nav-link"
        href={localePath(locale, "/favorites")}
        onClick={() => setMenuOpen(false)}
      >
        {messages.nav.myTools}
      </Link>
    </>
  );
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link
            href={localePath(locale)}
            className="logo"
            aria-label={messages.nav.home}
          >
            <span className="logo-mark">&lt;/&gt;</span>
            <span>DevToolbox</span>
          </Link>
          <nav
            className="header-nav"
            aria-label={locale === "zh" ? "主导航" : "Primary navigation"}
          >
            {links}
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="header-search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} />
              <span>{messages.nav.search}</span>
              <kbd>⌘ K</kbd>
            </button>
            <LanguageSwitcher locale={locale} label={messages.languageShort} />
            <button
              type="button"
              className="icon-button"
              onClick={toggleTheme}
              aria-label={
                resolvedTheme === "dark"
                  ? messages.theme.toLight
                  : messages.theme.toDark
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}
            </button>
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={messages.nav.toggle}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && <nav className="container mobile-nav">{links}</nav>}
      </header>
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        locale={locale}
        messages={messages}
      />
    </>
  );
}
