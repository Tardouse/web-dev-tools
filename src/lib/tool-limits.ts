import { TOOL_LIMITS, byteLength, formatBytes } from "@/lib/config";
import type { ToolDefinition } from "@/lib/types";

export type ToolLimitErrorCode = "timeout" | "output" | "concurrency";

export class ToolLimitError extends Error {
  constructor(
    readonly code: ToolLimitErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ToolLimitError";
  }
}

export interface ToolExecutionLimits {
  maxExecutionTime: number;
  maxOutputSize: number;
  maxConcurrency: number;
}

export function resolveToolExecutionLimits(
  definition?: Pick<
    ToolDefinition,
    "maxExecutionTime" | "maxOutputSize" | "maxConcurrency"
  >,
): ToolExecutionLimits {
  return {
    maxExecutionTime:
      definition?.maxExecutionTime ?? TOOL_LIMITS.maxExecutionTime,
    maxOutputSize: definition?.maxOutputSize ?? TOOL_LIMITS.maxOutput,
    maxConcurrency:
      definition?.maxConcurrency ?? TOOL_LIMITS.maxConcurrentExecutions,
  };
}

export function outputByteLength(
  value: unknown,
  seen = new Set<object>(),
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "string") return byteLength(value);
  if (typeof value === "number" || typeof value === "bigint") return 8;
  if (typeof value === "boolean") return 1;
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (ArrayBuffer.isView(value)) return value.byteLength;
  if (typeof Blob !== "undefined" && value instanceof Blob) return value.size;
  if (typeof value !== "object" || seen.has(value)) return 0;

  seen.add(value);
  if (Array.isArray(value)) {
    return value.reduce(
      (total, entry) => total + outputByteLength(entry, seen),
      0,
    );
  }
  if (value instanceof Map) {
    let total = 0;
    for (const [key, entry] of value) {
      total += outputByteLength(key, seen) + outputByteLength(entry, seen);
    }
    return total;
  }
  if (value instanceof Set) {
    let total = 0;
    for (const entry of value) total += outputByteLength(entry, seen);
    return total;
  }
  return Object.entries(value).reduce(
    (total, [key, entry]) =>
      total + byteLength(key) + outputByteLength(entry, seen),
    0,
  );
}

export function assertToolOutputLimit(value: unknown, limit: number): void {
  const size = outputByteLength(value);
  if (size > limit) {
    throw new ToolLimitError(
      "output",
      `Output is ${formatBytes(size)}. The limit for this tool is ${formatBytes(limit)}.`,
    );
  }
}

export function assertToolInputLimit(value: unknown, limit: number): void {
  const size = outputByteLength(value);
  if (size > limit) {
    throw new Error(
      `Input is ${formatBytes(size)}. The limit for this tool is ${formatBytes(limit)}.`,
    );
  }
}

export function formatExecutionTime(milliseconds: number): string {
  return milliseconds % 1_000 === 0
    ? `${milliseconds / 1_000} s`
    : `${milliseconds} ms`;
}
