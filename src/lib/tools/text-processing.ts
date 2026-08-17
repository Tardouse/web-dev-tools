import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";

export const DATA_SIZE_UNITS = [
  "bit",
  "B",
  "KB",
  "MB",
  "GB",
  "TB",
  "KiB",
  "MiB",
  "GiB",
  "TiB",
] as const;

export type DataSizeUnit = (typeof DATA_SIZE_UNITS)[number];

const bitsPerUnit: Record<DataSizeUnit, number> = {
  bit: 1,
  B: 8,
  KB: 8 * 1_000,
  MB: 8 * 1_000 ** 2,
  GB: 8 * 1_000 ** 3,
  TB: 8 * 1_000 ** 4,
  KiB: 8 * 1_024,
  MiB: 8 * 1_024 ** 2,
  GiB: 8 * 1_024 ** 3,
  TiB: 8 * 1_024 ** 4,
};

export interface DataSizeConversion {
  bits: number;
  bytes: number;
  values: Record<DataSizeUnit, number>;
}

export function convertDataSize(
  input: string,
  unit: DataSizeUnit,
): DataSizeConversion {
  assertInputLimit(input, TOOL_LIMITS.text);
  const normalized = input.trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) {
    throw new Error("Enter a non-negative finite data size.");
  }
  const amount = Number(normalized);
  const bits = amount * bitsPerUnit[unit];
  if (!Number.isFinite(amount) || !Number.isFinite(bits)) {
    throw new Error("The data size is too large to convert.");
  }
  const values = Object.fromEntries(
    DATA_SIZE_UNITS.map((target) => [target, bits / bitsPerUnit[target]]),
  ) as Record<DataSizeUnit, number>;
  return { bits, bytes: bits / 8, values };
}

function splitLines(input: string): string[] {
  return input ? input.split(/\r\n|\r|\n/) : [];
}

function comparisonKey(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLowerCase();
}

function uniqueValues(values: string[], caseSensitive: boolean): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = comparisonKey(value, caseSensitive);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface CleanLinesOptions {
  removeBlank: boolean;
  removeDuplicates: boolean;
  trimLines: boolean;
  caseSensitive: boolean;
}

export function cleanLines(input: string, options: CleanLinesOptions): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  let lines = splitLines(input);
  if (options.trimLines) lines = lines.map((line) => line.trim());
  if (options.removeBlank) {
    lines = lines.filter((line) => line.trim().length > 0);
  }
  if (options.removeDuplicates) {
    lines = uniqueValues(lines, options.caseSensitive);
  }
  return lines.join("\n");
}

export type LineSortMode = "alphabetical" | "natural" | "length" | "reverse";

export interface SortLinesOptions {
  mode: LineSortMode;
  descending: boolean;
  caseSensitive: boolean;
  locale: "en-US" | "zh-CN";
}

export function sortLines(input: string, options: SortLinesOptions): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  const lines = splitLines(input);
  if (options.mode === "reverse") return lines.reverse().join("\n");

  const collator = new Intl.Collator(options.locale, {
    numeric: options.mode === "natural",
    sensitivity: options.caseSensitive ? "variant" : "base",
  });
  return lines
    .map((value, index) => ({ value, index }))
    .sort((left, right) => {
      const compared =
        options.mode === "length"
          ? Array.from(left.value).length - Array.from(right.value).length ||
            collator.compare(left.value, right.value)
          : collator.compare(left.value, right.value);
      if (compared === 0) return left.index - right.index;
      return options.descending ? -compared : compared;
    })
    .map(({ value }) => value)
    .join("\n");
}

export type LineNumberAction = "add" | "remove";
export type LineNumberSeparator = "dot" | "colon" | "tab";

export interface LineNumberOptions {
  action: LineNumberAction;
  start: number;
  pad: boolean;
  separator: LineNumberSeparator;
}

const lineNumberSeparators: Record<LineNumberSeparator, string> = {
  dot: ". ",
  colon: ": ",
  tab: "\t",
};

export function transformLineNumbers(
  input: string,
  options: LineNumberOptions,
): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  const lines = splitLines(input);
  if (options.action === "remove") {
    return lines
      .map((line) => {
        const match = line.match(
          /^\s*\d+(?:(?:[.)\]:-])(?:[ \t]+)?|[ \t]+)(.*)$/u,
        );
        return match ? match[1] : line;
      })
      .join("\n");
  }
  if (!Number.isSafeInteger(options.start) || options.start < 0) {
    throw new Error("The first line number must be a non-negative integer.");
  }
  const lastNumber = options.start + Math.max(0, lines.length - 1);
  if (!Number.isSafeInteger(lastNumber)) {
    throw new Error("The line number range is too large.");
  }
  const width = options.pad ? String(lastNumber).length : 0;
  const separator = lineNumberSeparators[options.separator];
  return lines
    .map((line, index) => {
      const number = String(options.start + index).padStart(width, "0");
      return `${number}${separator}${line}`;
    })
    .join("\n");
}

export type TextDeduplicationMode = "lines" | "words" | "characters";

export interface TextDeduplicationOptions {
  mode: TextDeduplicationMode;
  caseSensitive: boolean;
}

export function deduplicateText(
  input: string,
  options: TextDeduplicationOptions,
): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  if (!input) return "";
  if (options.mode === "lines") {
    return uniqueValues(splitLines(input), options.caseSensitive).join("\n");
  }
  if (options.mode === "words") {
    return uniqueValues(input.match(/\S+/gu) ?? [], options.caseSensitive).join(
      " ",
    );
  }
  return uniqueValues(
    Array.from(input.replace(/\r\n?|\n/g, "\n")),
    options.caseSensitive,
  ).join("");
}

export type TextMergeMode = "append" | "interleave";

export interface TextMergeOptions {
  mode: TextMergeMode;
  separator: string;
}

export function mergeText(
  first: string,
  second: string,
  options: TextMergeOptions,
): string {
  assertInputLimit(first, TOOL_LIMITS.text);
  assertInputLimit(second, TOOL_LIMITS.text);
  if (options.mode === "append") {
    if (!first) return second;
    if (!second) return first;
    return `${first}${options.separator}${second}`;
  }
  const firstLines = splitLines(first);
  const secondLines = splitLines(second);
  const output: string[] = [];
  const length = Math.max(firstLines.length, secondLines.length);
  for (let index = 0; index < length; index += 1) {
    if (index < firstLines.length) output.push(firstLines[index]);
    if (index < secondLines.length) output.push(secondLines[index]);
  }
  return output.join("\n");
}

export type TextSplitMode = "lines" | "whitespace" | "comma" | "custom";
export type TextSplitOutput = "lines" | "json";

export interface TextSplitOptions {
  mode: TextSplitMode;
  delimiter: string;
  trimParts: boolean;
  removeEmpty: boolean;
  output: TextSplitOutput;
}

export function splitText(input: string, options: TextSplitOptions): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  let parts: string[];
  switch (options.mode) {
    case "lines":
      parts = input ? input.split(/\r\n|\r|\n/) : [""];
      break;
    case "whitespace":
      parts = input.split(/\s+/u);
      break;
    case "comma":
      parts = input.split(",");
      break;
    case "custom":
      if (!options.delimiter) {
        throw new Error("Enter a custom delimiter before splitting text.");
      }
      parts = input.split(options.delimiter);
      break;
  }
  if (options.trimParts) parts = parts.map((part) => part.trim());
  if (options.removeEmpty) parts = parts.filter((part) => part.length > 0);
  return options.output === "json"
    ? JSON.stringify(parts, null, 2)
    : parts.join("\n");
}
