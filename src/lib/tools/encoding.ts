import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";

function bytesToBinary(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return binary;
}

export function encodeBase64(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  return btoa(bytesToBinary(new TextEncoder().encode(input)));
}

export function decodeBase64(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  const normalized = input.replace(/\s/g, "");
  if (!normalized) return "";
  if (
    !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) ||
    normalized.length % 4 !== 0
  ) {
    throw new Error("Enter a valid Base64 string.");
  }
  try {
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("This Base64 value does not contain valid UTF-8 text.");
  }
}

export function encodeUrl(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  return encodeURIComponent(input);
}

export function decodeUrl(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  try {
    return decodeURIComponent(input.replace(/\+/g, " "));
  } catch {
    throw new Error("The value contains an invalid percent-encoded sequence.");
  }
}

function base64UrlDecode(value: string): string {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return decodeBase64(normalized);
}

export interface DecodedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
  issuedAt?: string;
  expiresAt?: string;
  expired?: boolean;
}

export function decodeJwt(input: string): DecodedJwt {
  assertInputLimit(input, TOOL_LIMITS.text);
  const parts = input.trim().split(".");
  if (parts.length !== 3)
    throw new Error("A JWT must contain three dot-separated parts.");
  try {
    const header: unknown = JSON.parse(base64UrlDecode(parts[0]));
    const payload: unknown = JSON.parse(base64UrlDecode(parts[1]));
    const claims =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    const issuedAt =
      typeof claims.iat === "number"
        ? new Date(claims.iat * 1000).toISOString()
        : undefined;
    const expiresAt =
      typeof claims.exp === "number"
        ? new Date(claims.exp * 1000).toISOString()
        : undefined;
    const expired =
      typeof claims.exp === "number"
        ? claims.exp * 1000 < Date.now()
        : undefined;
    return {
      header,
      payload,
      signature: parts[2],
      issuedAt,
      expiresAt,
      expired,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("A JWT"))
      throw error;
    throw new Error("JWT header or payload is not valid Base64URL JSON.");
  }
}
