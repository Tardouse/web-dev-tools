import type { ApiRequestConfig } from "./developer-tools";
import { formatBytes } from "@/lib/config";

export const BROWSER_REQUEST_TIMEOUT_MS = 10_000;
export const MAX_BROWSER_RESPONSE_BYTES = 1024 * 1024;

export interface BrowserResponseResult {
  status: string;
  duration: number;
  headers: string;
  body: string;
}

export interface BrowserRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number | null;
  maxResponseBytes?: number;
}

export async function readLimitedResponseBody(
  response: Response,
  maxBytes = MAX_BROWSER_RESPONSE_BYTES,
): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let result = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error(
        `Response exceeds the ${formatBytes(maxBytes).replace(".0 ", " ")} browser limit.`,
      );
    }
    result += decoder.decode(value, { stream: true });
  }
  return result + decoder.decode();
}

export async function sendBrowserRequest(
  input: ApiRequestConfig,
  options: BrowserRequestOptions = {},
): Promise<BrowserResponseResult> {
  if (options.signal?.aborted) {
    throw options.signal.reason instanceof Error
      ? options.signal.reason
      : new DOMException("Request aborted.", "AbortError");
  }
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  let timedOut = false;
  const timeoutMs =
    options.timeoutMs === undefined
      ? BROWSER_REQUEST_TIMEOUT_MS
      : options.timeoutMs;
  const timeout =
    timeoutMs === null
      ? undefined
      : globalThis.setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs);
  const started = performance.now();
  try {
    const method = input.method.toUpperCase();
    const hasBody = input.body.length > 0 && !["GET", "HEAD"].includes(method);
    const response = await fetch(input.url, {
      method,
      headers: input.headers,
      ...(hasBody ? { body: input.body } : {}),
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await readLimitedResponseBody(
      response,
      options.maxResponseBytes ?? MAX_BROWSER_RESPONSE_BYTES,
    );
    return {
      status: `${response.status} ${response.statusText}`.trim(),
      duration: Math.round(performance.now() - started),
      headers: [...response.headers.entries()]
        .map(([name, value]) => `${name}: ${value}`)
        .join("\n"),
      body,
    };
  } catch (error) {
    if (options.signal?.aborted) {
      throw options.signal.reason instanceof Error
        ? options.signal.reason
        : error;
    }
    if (timedOut) {
      throw new Error(`Request timed out after ${timeoutMs! / 1_000} seconds.`);
    }
    throw error;
  } finally {
    if (timeout !== undefined) globalThis.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}
