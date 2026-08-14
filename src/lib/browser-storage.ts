const FAVORITES_KEY = "devtoolbox:favorites";
const RECENTS_KEY = "devtoolbox:recents";
const MAX_RECENTS = 8;

function readStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) &&
      value.every((item) => typeof item === "string")
      ? value
      : [];
  } catch {
    return [];
  }
}

function writeStringArray(key: string, value: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(
    new CustomEvent("devtoolbox:storage", { detail: { key } }),
  );
}

export function getFavorites(): string[] {
  return readStringArray(FAVORITES_KEY);
}

export function toggleFavorite(slug: string): string[] {
  const current = getFavorites();
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [slug, ...current];
  writeStringArray(FAVORITES_KEY, next);
  return next;
}

export function getRecentTools(): string[] {
  return readStringArray(RECENTS_KEY);
}

export function recordRecentTool(slug: string): void {
  const next = [
    slug,
    ...getRecentTools().filter((item) => item !== slug),
  ].slice(0, MAX_RECENTS);
  writeStringArray(RECENTS_KEY, next);
}

export const storageKeys = {
  favorites: FAVORITES_KEY,
  recents: RECENTS_KEY,
} as const;
