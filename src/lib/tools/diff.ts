import { diffChars, diffLines } from "diff";
import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";

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

export function compareText(
  before: string,
  after: string,
  mode: "lines" | "characters",
  ignoreWhitespace = false,
): DiffPart[] {
  assertInputLimit(before, TOOL_LIMITS.diff);
  assertInputLimit(after, TOOL_LIMITS.diff);
  return mode === "lines"
    ? diffLines(before, after, { ignoreWhitespace })
    : diffChars(before, after, { ignoreCase: false });
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
): [DiffLine, DiffLine] {
  const changes = diffChars(leftValue, rightValue);
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
): SideBySideDiff {
  assertInputLimit(before, TOOL_LIMITS.diff);
  assertInputLimit(after, TOOL_LIMITS.diff);
  const parts = diffLines(before, after, { ignoreWhitespace });
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  let leftNumber = 1;
  let rightNumber = 1;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part.added && !part.removed) {
      for (const line of splitLines(part.value)) {
        left.push(plainLine(line, leftNumber++, "unchanged"));
        right.push(plainLine(line, rightNumber++, "unchanged"));
      }
      continue;
    }
    const removed = part.removed ? splitLines(part.value) : [];
    const next = parts[index + 1];
    const added = next?.added
      ? splitLines(next.value)
      : part.added
        ? splitLines(part.value)
        : [];
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
