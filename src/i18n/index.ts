import { en, type Messages } from "./messages/en";
import { zh } from "./messages/zh";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Messages> = { en, zh };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? `{${key}}`),
  );
}

export type { Messages };
export * from "./config";
