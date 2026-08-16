import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function assertJsonDepth(value: unknown): void {
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 1 }];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.depth > TOOL_LIMITS.maxJsonDepth) {
      throw new Error(
        `JSON nesting exceeds the maximum depth of ${TOOL_LIMITS.maxJsonDepth}.`,
      );
    }
    if (current.value && typeof current.value === "object") {
      for (const child of Object.values(current.value)) {
        if (child && typeof child === "object")
          stack.push({ value: child, depth: current.depth + 1 });
      }
    }
  }
}

export function parseJson(input: string): JsonValue {
  assertInputLimit(input, TOOL_LIMITS.json);
  if (!input.trim()) throw new Error("Enter JSON to continue.");
  try {
    const value = JSON.parse(input) as JsonValue;
    assertJsonDepth(value);
    return value;
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error(`Invalid JSON: ${error.message}`);
    throw error;
  }
}

export function formatJson(input: string, indent = 2): string {
  return JSON.stringify(parseJson(input), null, indent);
}

export function minifyJson(input: string): string {
  return JSON.stringify(parseJson(input));
}

export function validateJson(input: string): string {
  const value = parseJson(input);
  const kind = Array.isArray(value)
    ? "array"
    : value === null
      ? "null"
      : typeof value;
  return `Valid JSON\nRoot type: ${kind}`;
}
