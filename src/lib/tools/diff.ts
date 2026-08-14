import { diffChars, diffLines } from "diff";
import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
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
