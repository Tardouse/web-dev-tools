import { TOOL_LIMITS, assertInputLimit, byteLength } from "@/lib/config";

export interface TextMetrics {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  bytes: number;
  chineseCharacters: number;
  englishCharacters: number;
  numbers: number;
  spaces: number;
}

export function countText(input: string): TextMetrics {
  assertInputLimit(input, TOOL_LIMITS.text);
  return {
    characters: Array.from(input).length,
    charactersNoSpaces: Array.from(input.replace(/\s/g, "")).length,
    words: input.trim() ? (input.match(/[\p{L}\p{N}_'-]+/gu) ?? []).length : 0,
    lines: input ? input.split(/\r\n|\r|\n/).length : 0,
    bytes: byteLength(input),
    chineseCharacters: (input.match(/[\p{Script=Han}]/gu) ?? []).length,
    englishCharacters: (input.match(/[A-Za-z]/g) ?? []).length,
    numbers: (input.match(/\p{N}/gu) ?? []).length,
    spaces: (input.match(/\s/gu) ?? []).length,
  };
}

function words(value: string): string[] {
  return value
    .trim()
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[._/\\-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

export type CaseMode =
  | "upper"
  | "lower"
  | "capitalize"
  | "title"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "path";

export function convertCase(input: string, mode: CaseMode): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  if (mode === "upper") return input.toUpperCase();
  if (mode === "lower") return input.toLowerCase();
  if (mode === "capitalize") {
    const index = input.search(/\p{L}/u);
    if (index < 0) return input;
    const [letter] = Array.from(input.slice(index));
    return `${input.slice(0, index)}${letter.toLocaleUpperCase()}${input.slice(index + letter.length)}`;
  }
  const items = words(input);
  const capitalize = (word: string) =>
    word ? word[0].toUpperCase() + word.slice(1) : word;
  switch (mode) {
    case "title":
      return items.map(capitalize).join(" ");
    case "camel":
      return items
        .map((word, index) => (index === 0 ? word : capitalize(word)))
        .join("");
    case "pascal":
      return items.map(capitalize).join("");
    case "snake":
      return items.join("_");
    case "kebab":
      return items.join("-");
    case "constant":
      return items.join("_").toUpperCase();
    case "dot":
      return items.join(".");
    case "path":
      return items.join("/");
  }
}

export function formatHtmlFallback(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  if (!input.trim()) return "";
  const tokens = input
    .replace(/>\s*</g, "><")
    .split(/(?=<)|(?<=>)/g)
    .filter((token) => token.trim());
  let depth = 0;
  const output: string[] = [];
  const voidTags =
    /^(?:<!|<\?|<(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b)/i;
  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (/^<\//.test(token)) depth = Math.max(0, depth - 1);
    output.push(`${"  ".repeat(depth)}${token}`);
    if (
      /^<[^!/][^>]*[^/]>/i.test(token) &&
      !voidTags.test(token) &&
      !/^<[^>]+>.*<\/[^>]+>$/.test(token)
    )
      depth += 1;
  }
  return output.join("\n");
}
