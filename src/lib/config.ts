export const SITE_CONFIG = {
  name: "DevToolbox",
  shortName: "DT",
  description:
    "Fast, private developer utilities for formatting, encoding, testing, and everyday engineering work.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8886",
  locale: "en_US",
};

export const TOOL_LIMITS = {
  text: 1 * 1024 * 1024,
  json: 5 * 1024 * 1024,
  regex: 500 * 1024,
  diff: 2 * 1024 * 1024,
  file: 10 * 1024 * 1024,
  image: 20 * 1024 * 1024,
  archive: 50 * 1024 * 1024,
  maxExtractedSize: 100 * 1024 * 1024,
  maxArchiveEntries: 500,
  maxArchiveDepth: 16,
  maxCompressionRatio: 100,
  maxFileProcessTime: 10_000,
  maxExecutionTime: 10_000,
  maxOutput: 10 * 1024 * 1024,
  maxConcurrentExecutions: 2,
  maxJsonDepth: 100,
  maxRegexLength: 1_000,
  maxRandomBatchSize: 100,
  maxRandomStringLength: 4_096,
  maxPasswordLength: 256,
  maxLoremWords: 1_000,
  maxLoremSentences: 100,
  maxLoremParagraphs: 20,
  maxRandomDecimalPlaces: 10,
} as const;

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function assertInputLimit(value: string, limit: number): void {
  const size = byteLength(value);
  if (size > limit) {
    throw new Error(
      `Input is ${formatBytes(size)}. The limit for this tool is ${formatBytes(limit)}.`,
    );
  }
}
