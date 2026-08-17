import { diffArrays, diffChars, diffLines } from "diff";
import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";
import { parseJson, type JsonValue } from "@/lib/tools/json";

export type DiffMode = "lines" | "characters" | "json";

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}
export type DiffTone = "unchanged" | "added" | "removed" | "modified" | "empty";
export interface DiffSegment {
  value: string;
  changed: boolean;
}
export interface DiffLine {
  number: number | null;
  tone: DiffTone;
  marker: " " | "+" | "-" | "~";
  segments: DiffSegment[];
}
export interface SideBySideDiff {
  left: DiffLine[];
  right: DiffLine[];
}

function lineTokens(value: string): string[] {
  const tokens = value.match(/[^\n]*(?:\n|$)/g) ?? [];
  if (tokens.at(-1) === "") tokens.pop();
  return tokens;
}

function compareLines(
  before: string,
  after: string,
  ignoreWhitespace: boolean,
  ignoreCase: boolean,
): DiffPart[] {
  if (!ignoreCase) return diffLines(before, after, { ignoreWhitespace });
  const normalize = (line: string) => {
    const whitespaceNormalized = ignoreWhitespace ? line.trim() : line;
    return whitespaceNormalized.toLowerCase();
  };
  return diffArrays(lineTokens(before), lineTokens(after), {
    comparator: (left, right) => normalize(left) === normalize(right),
  }).map((part) => ({
    value: part.value.join(""),
    added: part.added,
    removed: part.removed,
  }));
}

export function compareText(
  before: string,
  after: string,
  mode: DiffMode,
  ignoreWhitespace = false,
  ignoreCase = false,
): DiffPart[] {
  assertInputLimit(before, TOOL_LIMITS.diff);
  assertInputLimit(after, TOOL_LIMITS.diff);
  const prepared =
    mode === "json"
      ? prepareDiffInputs(before, after, mode)
      : { before, after };
  return mode === "lines" || mode === "json"
    ? compareLines(
        prepared.before,
        prepared.after,
        ignoreWhitespace,
        ignoreCase,
      )
    : diffChars(prepared.before, prepared.after, { ignoreCase });
}
export function toUnifiedLikeDiff(parts: DiffPart[]): string {
  return parts
    .map(
      (part) => `${part.added ? "+" : part.removed ? "-" : " "}${part.value}`,
    )
    .join("");
}

function splitLines(value: string): string[] {
  if (!value) return [];
  const lines = value.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}
function plainLine(value: string, number: number, tone: DiffTone): DiffLine {
  return {
    number,
    tone,
    marker: tone === "added" ? "+" : tone === "removed" ? "-" : " ",
    segments: [{ value: value || " ", changed: tone !== "unchanged" }],
  };
}
function emptyLine(): DiffLine {
  return {
    number: null,
    tone: "empty",
    marker: " ",
    segments: [{ value: " ", changed: false }],
  };
}
function modifiedPair(
  leftValue: string,
  rightValue: string,
  leftNumber: number,
  rightNumber: number,
  ignoreCase: boolean,
): [DiffLine, DiffLine] {
  const changes = diffChars(leftValue, rightValue, { ignoreCase });
  const leftSegments: DiffSegment[] = [];
  const rightSegments: DiffSegment[] = [];
  for (const change of changes) {
    if (!change.added)
      leftSegments.push({
        value: change.value,
        changed: Boolean(change.removed),
      });
    if (!change.removed)
      rightSegments.push({
        value: change.value,
        changed: Boolean(change.added),
      });
  }
  return [
    {
      number: leftNumber,
      tone: "modified",
      marker: "~",
      segments: leftSegments.length
        ? leftSegments
        : [{ value: " ", changed: true }],
    },
    {
      number: rightNumber,
      tone: "modified",
      marker: "~",
      segments: rightSegments.length
        ? rightSegments
        : [{ value: " ", changed: true }],
    },
  ];
}

export function createSideBySideDiff(
  before: string,
  after: string,
  ignoreWhitespace = false,
  ignoreCase = false,
): SideBySideDiff {
  assertInputLimit(before, TOOL_LIMITS.diff);
  assertInputLimit(after, TOOL_LIMITS.diff);
  const parts = compareLines(before, after, ignoreWhitespace, ignoreCase);
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  let leftNumber = 1;
  let rightNumber = 1;
  let leftCursor = 0;
  let rightCursor = 0;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part.added && !part.removed) {
      const count = splitLines(part.value).length;
      for (let lineIndex = 0; lineIndex < count; lineIndex += 1) {
        left.push(
          plainLine(beforeLines[leftCursor++] ?? "", leftNumber++, "unchanged"),
        );
        right.push(
          plainLine(
            afterLines[rightCursor++] ?? "",
            rightNumber++,
            "unchanged",
          ),
        );
      }
      continue;
    }
    const removedCount = part.removed ? splitLines(part.value).length : 0;
    const removed = beforeLines.slice(leftCursor, leftCursor + removedCount);
    leftCursor += removedCount;
    const next = parts[index + 1];
    const addedCount = next?.added
      ? splitLines(next.value).length
      : part.added
        ? splitLines(part.value).length
        : 0;
    const added = afterLines.slice(rightCursor, rightCursor + addedCount);
    rightCursor += addedCount;
    if (part.removed && next?.added) index += 1;
    const rowCount = Math.max(removed.length, added.length);
    for (let row = 0; row < rowCount; row += 1) {
      const removedLine = removed[row];
      const addedLine = added[row];
      if (removedLine !== undefined && addedLine !== undefined) {
        const [leftLine, rightLine] = modifiedPair(
          removedLine,
          addedLine,
          leftNumber++,
          rightNumber++,
          ignoreCase,
        );
        left.push(leftLine);
        right.push(rightLine);
      } else if (removedLine !== undefined) {
        left.push(plainLine(removedLine, leftNumber++, "removed"));
        right.push(emptyLine());
      } else if (addedLine !== undefined) {
        left.push(emptyLine());
        right.push(plainLine(addedLine, rightNumber++, "added"));
      }
    }
  }
  if (!left.length && !right.length) {
    left.push(emptyLine());
    right.push(emptyLine());
  }
  return { left, right };
}

function canonicalizeJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value && typeof value === "object") {
    const sorted = Object.create(null) as Record<string, JsonValue>;
    for (const key of Object.keys(value).sort()) {
      sorted[key] = canonicalizeJson(value[key]);
    }
    return sorted;
  }
  return value;
}

function parseDiffJson(input: string, side: "Original" | "Changed"): JsonValue {
  if (!input.trim()) throw new Error(`${side} JSON is required.`);
  try {
    return parseJson(input);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid JSON: ")) {
      throw new Error(
        `${side} JSON is invalid: ${error.message.slice("Invalid JSON: ".length)}`,
      );
    }
    throw error;
  }
}

export function prepareDiffInputs(
  before: string,
  after: string,
  mode: DiffMode,
): { before: string; after: string } {
  assertInputLimit(before, TOOL_LIMITS.diff);
  assertInputLimit(after, TOOL_LIMITS.diff);
  if (mode !== "json") return { before, after };
  return {
    before: `${JSON.stringify(canonicalizeJson(parseDiffJson(before, "Original")), null, 2)}\n`,
    after: `${JSON.stringify(canonicalizeJson(parseDiffJson(after, "Changed")), null, 2)}\n`,
  };
}
