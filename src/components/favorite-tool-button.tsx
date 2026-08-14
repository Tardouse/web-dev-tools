"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { interpolate, type Messages } from "@/i18n";
import { getFavorites, toggleFavorite } from "@/lib/browser-storage";

export function FavoriteToolButton({
  slug,
  name,
  messages,
}: {
  slug: string;
  name: string;
  messages: Messages;
}) {
  const [favorite, setFavorite] = useState(false);
  useEffect(() => {
    const sync = () => setFavorite(getFavorites().includes(slug));
    sync();
    window.addEventListener("devtoolbox:storage", sync);
    return () => window.removeEventListener("devtoolbox:storage", sync);
  }, [slug]);
  return (
    <button
      className="button"
      onClick={() => setFavorite(toggleFavorite(slug).includes(slug))}
    >
      <Star size={16} fill={favorite ? "currentColor" : "none"} />
      {favorite
        ? messages.favorites.favorited
        : interpolate(messages.favorites.favorite, { name })}
    </button>
  );
}
