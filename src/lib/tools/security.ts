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

export type RegexTokenKind =
  | "literal"
  | "escape"
  | "character-class"
  | "anchor"
  | "group-open"
  | "group-close"
  | "alternation"
  | "quantifier"
  | "dot";

export interface RegexExplanationToken {
  token: string;
  kind: RegexTokenKind;
}

export interface RegexCapture {
  number: number;
  name: string | null;
  value: string | null;
}

export interface RegexResult {
  matches: Array<{
    value: string;
    index: number;
    groups: RegexCapture[];
  }>;
  rendered: Array<{ text: string; match: boolean }>;
  replacementResult: string;
  explanation: RegexExplanationToken[];
  matchLimitReached: boolean;
}

function escapedToken(pattern: string, start: number): string {
  if (start + 1 >= pattern.length) return "\\";
  const marker = pattern[start + 1];
  if ((marker === "p" || marker === "P") && pattern[start + 2] === "{") {
    const end = pattern.indexOf("}", start + 3);
    if (end >= 0) return pattern.slice(start, end + 1);
  }
  if (marker === "k" && pattern[start + 2] === "<") {
    const end = pattern.indexOf(">", start + 3);
    if (end >= 0) return pattern.slice(start, end + 1);
  }
  if (marker === "u" && pattern[start + 2] === "{") {
    const end = pattern.indexOf("}", start + 3);
    if (end >= 0) return pattern.slice(start, end + 1);
  }
  if (marker === "u") return pattern.slice(start, start + 6);
  if (marker === "x") return pattern.slice(start, start + 4);
  return pattern.slice(start, start + 2);
}

export function explainRegex(pattern: string): RegexExplanationToken[] {
  assertSafeRegex(pattern);
  const tokens: RegexExplanationToken[] = [];
  let index = 0;
  while (index < pattern.length) {
    const character = pattern[index];
    if (character === "\\") {
      const token = escapedToken(pattern, index);
      tokens.push({ token, kind: "escape" });
      index += token.length;
      continue;
    }
    if (character === "[") {
      let end = index + 1;
      let escaped = false;
      while (end < pattern.length) {
        if (!escaped && pattern[end] === "]") {
          end += 1;
          break;
        }
        escaped = !escaped && pattern[end] === "\\";
        if (pattern[end] !== "\\") escaped = false;
        end += 1;
      }
      tokens.push({
        token: pattern.slice(index, end),
        kind: "character-class",
      });
      index = end;
      continue;
    }
    if (character === "(") {
      const prefixes = ["(?<=", "(?<!", "(?:", "(?=", "(?!"];
      const prefix = prefixes.find((candidate) =>
        pattern.startsWith(candidate, index),
      );
      if (prefix) {
        tokens.push({ token: prefix, kind: "group-open" });
        index += prefix.length;
        continue;
      }
      if (pattern.startsWith("(?<", index)) {
        const end = pattern.indexOf(">", index + 3);
        if (end >= 0) {
          tokens.push({
            token: pattern.slice(index, end + 1),
            kind: "group-open",
          });
          index = end + 1;
          continue;
        }
      }
      tokens.push({ token: character, kind: "group-open" });
      index += 1;
      continue;
    }
    if (character === ")") {
      tokens.push({ token: character, kind: "group-close" });
      index += 1;
      continue;
    }
    if (
      character === "{" &&
      /^\{\d+(?:,\d*)?\}\??/.test(pattern.slice(index))
    ) {
      const token = pattern.slice(index).match(/^\{\d+(?:,\d*)?\}\??/)![0];
      tokens.push({ token, kind: "quantifier" });
      index += token.length;
      continue;
    }
    if (character === "*" || character === "+" || character === "?") {
      const token = pattern[index + 1] === "?" ? `${character}?` : character;
      tokens.push({ token, kind: "quantifier" });
      index += token.length;
      continue;
    }
    if (character === "^" || character === "$") {
      tokens.push({ token: character, kind: "anchor" });
      index += 1;
      continue;
    }
    if (character === "|") {
      tokens.push({ token: character, kind: "alternation" });
      index += 1;
      continue;
    }
    if (character === ".") {
      tokens.push({ token: character, kind: "dot" });
      index += 1;
      continue;
    }
    let end = index + 1;
    while (end < pattern.length && !"\\[](){}*+?.^$|".includes(pattern[end])) {
      end += 1;
    }
    tokens.push({ token: pattern.slice(index, end), kind: "literal" });
    index = end;
  }
  return tokens;
}

function captureGroupNames(pattern: string): Array<string | null> {
  const names: Array<string | null> = [];
  let inClass = false;
  for (let index = 0; index < pattern.length; index += 1) {
    if (pattern[index] === "\\") {
      index += escapedToken(pattern, index).length - 1;
      continue;
    }
    if (pattern[index] === "[") {
      inClass = true;
      continue;
    }
    if (pattern[index] === "]" && inClass) {
      inClass = false;
      continue;
    }
    if (inClass || pattern[index] !== "(") continue;
    if (pattern[index + 1] !== "?") {
      names.push(null);
      continue;
    }
    if (
      pattern.startsWith("(?<=", index) ||
      pattern.startsWith("(?<!", index)
    ) {
      continue;
    }
    if (pattern.startsWith("(?<", index)) {
      const end = pattern.indexOf(">", index + 3);
      if (end >= 0) names.push(pattern.slice(index + 3, end));
    }
  }
  return names;
}

export function testRegex(
  pattern: string,
  flags: string,
  input: string,
  replacement = "",
): RegexResult {
  assertInputLimit(input, TOOL_LIMITS.regex);
  assertSafeRegex(pattern);
  if (replacement.length > TOOL_LIMITS.maxRegexReplacementLength) {
    throw new Error(
      `Regex replacements are limited to ${TOOL_LIMITS.maxRegexReplacementLength} characters.`,
    );
  }
  if (!pattern)
    return {
      matches: [],
      rendered: [{ text: input, match: false }],
      replacementResult: input,
      explanation: [],
      matchLimitReached: false,
    };
  let previewExpression: RegExp;
  let replacementExpression: RegExp;
  try {
    previewExpression = new RegExp(
      pattern,
      flags.includes("g") ? flags : `${flags}g`,
    );
    replacementExpression = new RegExp(pattern, flags);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Invalid regular expression.",
    );
  }
  const matches: RegexResult["matches"] = [];
  const rendered: RegexResult["rendered"] = [];
  const groupNames = captureGroupNames(pattern);
  let matchLimitReached = false;
  let cursor = 0;
  for (const match of input.matchAll(previewExpression)) {
    if (matches.length >= TOOL_LIMITS.maxRegexMatches) {
      matchLimitReached = true;
      break;
    }
    const index = match.index ?? 0;
    if (index > cursor)
      rendered.push({ text: input.slice(cursor, index), match: false });
    rendered.push({ text: match[0], match: true });
    matches.push({
      value: match[0],
      index,
      groups: match.slice(1).map((value, groupIndex) => ({
        number: groupIndex + 1,
        name: groupNames[groupIndex] ?? null,
        value: value ?? null,
      })),
    });
    cursor = index + match[0].length;
    if (match[0].length === 0) cursor = index;
  }
  if (cursor < input.length)
    rendered.push({ text: input.slice(cursor), match: false });
  if (matchLimitReached && replacementExpression.global) {
    throw new Error(
      `Regex replacements are limited to ${TOOL_LIMITS.maxRegexMatches} matches.`,
    );
  }
  return {
    matches,
    rendered,
    replacementResult: input.replace(replacementExpression, replacement),
    explanation: explainRegex(pattern),
    matchLimitReached,
  };
}
