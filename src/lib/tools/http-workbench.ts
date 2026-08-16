import { parseHeaderLines } from "./developer-tools";
import { encodeBase64 } from "./encoding";

export type AuthenticationMode = "none" | "bearer" | "basic" | "api-key";
export type HeaderOutputFormat = "lines" | "json" | "fetch";

export interface HeaderBuilderInput {
  accept: string;
  contentType: string;
  customHeaders: string;
  authentication: AuthenticationMode;
  token: string;
  username: string;
  password: string;
  apiKeyName: string;
  apiKeyValue: string;
}

function requiredSafeValue(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  if (/[\r\n]/.test(trimmed)) throw new Error(`${label} cannot contain line breaks.`);
  return trimmed;
}

function setHeader(
  headers: Record<string, string>,
  name: string,
  value: string,
): void {
  const existing = Object.keys(headers).find(
    (key) => key.toLowerCase() === name.toLowerCase(),
  );
  if (existing) delete headers[existing];
  headers[name] = value;
}

export function buildHttpHeaders(input: HeaderBuilderInput): Record<string, string> {
  const headers: Record<string, string> = {};
  if (input.accept) setHeader(headers, "Accept", input.accept);
  if (input.contentType) setHeader(headers, "Content-Type", input.contentType);
  for (const [name, value] of Object.entries(parseHeaderLines(input.customHeaders))) {
    setHeader(headers, name, value);
  }
  if (input.authentication === "bearer") {
    setHeader(
      headers,
      "Authorization",
      `Bearer ${requiredSafeValue(input.token, "Bearer token")}`,
    );
  }
  if (input.authentication === "basic") {
    const username = requiredSafeValue(input.username, "Username");
    if (username.includes(":")) throw new Error("Username cannot contain a colon.");
    if (/[\r\n]/.test(input.password)) {
      throw new Error("Password cannot contain line breaks.");
    }
    setHeader(
      headers,
      "Authorization",
      `Basic ${encodeBase64(`${username}:${input.password}`)}`,
    );
  }
  if (input.authentication === "api-key") {
    const name = requiredSafeValue(input.apiKeyName, "API key header name");
    const value = requiredSafeValue(input.apiKeyValue, "API key value");
    parseHeaderLines(`${name}: ${value}`);
    setHeader(headers, name, value);
  }
  return headers;
}

export function renderHttpHeaders(
  headers: Record<string, string>,
  format: HeaderOutputFormat,
): string {
  if (format === "json") return JSON.stringify(headers, null, 2);
  if (format === "fetch") {
    return `headers: ${JSON.stringify(headers, null, 2)}`;
  }
  return Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join("\n");
}

export function formatWebhookPayload(
  input: string,
  compact = false,
): string {
  if (!input.trim()) throw new Error("Enter a JSON webhook payload.");
  try {
    return JSON.stringify(JSON.parse(input), null, compact ? 0 : 2);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Parsing failed.";
    throw new Error(`Invalid JSON: ${detail}`);
  }
}
