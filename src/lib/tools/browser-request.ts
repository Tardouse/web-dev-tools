import type { ApiRequestConfig } from "./developer-tools";

export const BROWSER_REQUEST_TIMEOUT_MS = 10_000;
export const MAX_BROWSER_RESPONSE_BYTES = 1024 * 1024;

export interface BrowserResponseResult {
  status: string;
  duration: number;
  headers: string;
  body: string;
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
      throw new Error("Response exceeds the 1 MB browser limit.");
    }
    result += decoder.decode(value, { stream: true });
  }
  return result + decoder.decode();
}

export async function sendBrowserRequest(
  input: ApiRequestConfig,
): Promise<BrowserResponseResult> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    BROWSER_REQUEST_TIMEOUT_MS,
  );
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
    const body = await readLimitedResponseBody(response);
    return {
      status: `${response.status} ${response.statusText}`.trim(),
      duration: Math.round(performance.now() - started),
      headers: [...response.headers.entries()]
        .map(([name, value]) => `${name}: ${value}`)
        .join("\n"),
      body,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out after 10 seconds.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
