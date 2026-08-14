import { md5 } from "@noble/hashes/legacy.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";

export type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export async function hashText(
  input: string,
  algorithm: HashAlgorithm,
): Promise<string> {
  assertInputLimit(input, TOOL_LIMITS.text);
  const bytes = new TextEncoder().encode(input);
  if (algorithm === "MD5") return bytesToHex(md5(bytes));
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function createUuidList(count: number): string[] {
  const safeCount = Math.max(1, Math.min(100, Math.floor(count)));
  return Array.from({ length: safeCount }, () => crypto.randomUUID());
}

export function assertSafeRegex(pattern: string): void {
  if (pattern.length > TOOL_LIMITS.maxRegexLength) {
    throw new Error(
      `Regular expressions are limited to ${TOOL_LIMITS.maxRegexLength} characters.`,
    );
  }
  const nestedQuantifier =
    /(?:\([^)]*[+*][^)]*\)|\[[^\]]+\][+*]|\.[+*])\s*(?:[+*]|\{\d+,?\d*\})/;
  if (nestedQuantifier.test(pattern)) {
    throw new Error(
      "This expression contains nested quantifiers that may cause excessive backtracking.",
    );
  }
}

export interface RegexResult {
  matches: Array<{ value: string; index: number; groups: string[] }>;
  rendered: Array<{ text: string; match: boolean }>;
}

export function testRegex(
  pattern: string,
  flags: string,
  input: string,
): RegexResult {
  assertInputLimit(input, TOOL_LIMITS.regex);
  assertSafeRegex(pattern);
  if (!pattern)
    return { matches: [], rendered: [{ text: input, match: false }] };
  let expression: RegExp;
  try {
    expression = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Invalid regular expression.",
    );
  }
  const matches: RegexResult["matches"] = [];
  const rendered: RegexResult["rendered"] = [];
  let cursor = 0;
  for (const match of input.matchAll(expression)) {
    if (matches.length >= 1_000) break;
    const index = match.index ?? 0;
    if (index > cursor)
      rendered.push({ text: input.slice(cursor, index), match: false });
    rendered.push({ text: match[0], match: true });
    matches.push({ value: match[0], index, groups: match.slice(1) });
    cursor = index + match[0].length;
    if (match[0].length === 0) cursor = index;
  }
  if (cursor < input.length)
    rendered.push({ text: input.slice(cursor), match: false });
  return { matches, rendered };
}
