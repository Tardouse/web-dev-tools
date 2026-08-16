import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";
import { decodeBase64, encodeBase64 } from "./encoding";
import { resolveFileMime } from "./file";

export type Base64Mode = "encode" | "decode" | "auto";
export type AsciiCodeBase = "decimal" | "hex" | "binary";

export interface DecodedBase64File {
  data: Uint8Array;
  mimeType: string;
  source: "data-url" | "signature" | "raw";
}

export interface QueryEntry {
  key: string;
  value: string;
}

export interface Utf8Row {
  character: string;
  codePoint: string;
  bytes: string;
  byteCount: number;
}

export interface Utf8Inspection {
  bytes: number;
  codePoints: number;
  codeUnits: number;
  ascii: number;
  multibyte: number;
  rows: Utf8Row[];
  truncated: number;
}

export interface AsciiEntry {
  decimal: number;
  hex: string;
  binary: string;
  character: string;
  name: string;
  category: "control" | "whitespace" | "digit" | "letter" | "symbol";
}

const controlNames = [
  "NUL (Null)",
  "SOH (Start of Heading)",
  "STX (Start of Text)",
  "ETX (End of Text)",
  "EOT (End of Transmission)",
  "ENQ (Enquiry)",
  "ACK (Acknowledge)",
  "BEL (Bell)",
  "BS (Backspace)",
  "HT (Horizontal Tab)",
  "LF (Line Feed)",
  "VT (Vertical Tab)",
  "FF (Form Feed)",
  "CR (Carriage Return)",
  "SO (Shift Out)",
  "SI (Shift In)",
  "DLE (Data Link Escape)",
  "DC1 (Device Control 1)",
  "DC2 (Device Control 2)",
  "DC3 (Device Control 3)",
  "DC4 (Device Control 4)",
  "NAK (Negative Acknowledge)",
  "SYN (Synchronous Idle)",
  "ETB (End of Transmission Block)",
  "CAN (Cancel)",
  "EM (End of Medium)",
  "SUB (Substitute)",
  "ESC (Escape)",
  "FS (File Separator)",
  "GS (Group Separator)",
  "RS (Record Separator)",
  "US (Unit Separator)",
] as const;

function bytesToBase64(data: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < data.length; index += chunkSize) {
    binary += String.fromCharCode(...data.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function normalizedBase64(input: string): {
  payload: string;
  mimeType?: string;
  dataUrl: boolean;
} {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter Base64 data to continue.");

  let payload = trimmed;
  let mimeType: string | undefined;
  let dataUrl = false;
  const dataUrlMatch = trimmed.match(/^data:([^,]*),(.*)$/is);
  if (dataUrlMatch) {
    const metadata = dataUrlMatch[1];
    if (!/(?:^|;)base64(?:;|$)/i.test(metadata)) {
      throw new Error("The data URL must contain Base64 data.");
    }
    const declaredType = metadata.split(";", 1)[0].trim().toLowerCase();
    if (declaredType) {
      mimeType = /^[\w.+-]+\/[\w.+-]+$/.test(declaredType)
        ? declaredType
        : "application/octet-stream";
    }
    payload = dataUrlMatch[2];
    dataUrl = true;
  }

  payload = payload.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (
    !/^[A-Za-z0-9+/]*={0,2}$/.test(payload) ||
    payload.length % 4 === 1 ||
    /=/.test(payload.slice(0, -2))
  ) {
    throw new Error("Enter valid Base64 file data.");
  }
  payload = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
  return { payload, mimeType, dataUrl };
}

export function transformBase64(input: string, mode: Base64Mode): string {
  if (mode === "encode") return encodeBase64(input);
  if (mode === "decode") return decodeBase64(input);
  const candidate = input.replace(/\s/g, "");
  if (candidate.length >= 4) {
    try {
      return decodeBase64(candidate);
    } catch {
      // Ambiguous or binary input is treated as plain text and encoded.
    }
  }
  return encodeBase64(input);
}

export function encodeFileBase64(
  data: Uint8Array,
  mimeType: string,
  dataUrl: boolean,
): string {
  const encoded = bytesToBase64(data);
  if (!dataUrl) return encoded;
  const safeType = /^[\w.+-]+\/[\w.+-]+$/.test(mimeType)
    ? mimeType
    : "application/octet-stream";
  return `data:${safeType};base64,${encoded}`;
}

export function decodeFileBase64(input: string): DecodedBase64File {
  const normalized = normalizedBase64(input);
  let binary: string;
  try {
    binary = atob(normalized.payload);
  } catch {
    throw new Error("Enter valid Base64 file data.");
  }
  const data = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const detected = resolveFileMime("", data, normalized.mimeType);
  return {
    data,
    mimeType: detected.type,
    source: normalized.dataUrl
      ? "data-url"
      : detected.source === "signature"
        ? "signature"
        : "raw",
  };
}

function decodeComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function queryObject(
  params: URLSearchParams,
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = Object.create(null);
  for (const [key, value] of params) {
    const current = result[key];
    if (current === undefined) result[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else result[key] = [current, value];
  }
  return result;
}

export function parseUrl(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  const source = input.trim();
  if (!source) throw new Error("Enter a valid absolute URL.");
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    throw new Error("Enter a valid absolute URL.");
  }
  const defaultPorts: Record<string, string> = {
    "http:": "80",
    "https:": "443",
    "ftp:": "21",
  };
  const pathSegments = url.pathname
    .split("/")
    .filter(Boolean)
    .map(decodeComponent);
  return JSON.stringify(
    {
      href: url.href,
      origin: url.origin,
      protocol: url.protocol.replace(/:$/, ""),
      username: decodeComponent(url.username),
      password: decodeComponent(url.password),
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      effectivePort: url.port || defaultPorts[url.protocol] || "",
      pathname: url.pathname,
      pathSegments,
      query: queryObject(url.searchParams),
      hash: decodeComponent(url.hash.replace(/^#/, "")),
    },
    null,
    2,
  );
}

function querySource(input: string): string {
  const source = input.trim();
  if (!source) throw new Error("Enter a query string to continue.");
  try {
    if (/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(source)) {
      return new URL(source).search.slice(1);
    }
  } catch {
    throw new Error("Enter a valid URL or query string.");
  }
  const query = source.includes("?")
    ? source.slice(source.indexOf("?") + 1)
    : source;
  return query.replace(/^\?/, "").split("#", 1)[0];
}

export function parseQueryString(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  const params = new URLSearchParams(querySource(input));
  return JSON.stringify(queryObject(params), null, 2);
}

export function buildQueryString(
  entries: QueryEntry[],
  leadingQuestionMark = true,
): string {
  if (entries.length > 100) {
    throw new Error("Query strings are limited to 100 parameter rows.");
  }
  const params = new URLSearchParams();
  for (const entry of entries) {
    if (!entry.key && !entry.value) continue;
    params.append(entry.key, entry.value);
  }
  const value = params.toString();
  return value && leadingQuestionMark ? `?${value}` : value;
}

export function encodeUnicodeEscapes(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  assertValidSurrogates(input);
  return Array.from(input, (character) => {
    const codePoint = character.codePointAt(0)!;
    return codePoint <= 0xffff
      ? `\\u${codePoint.toString(16).toUpperCase().padStart(4, "0")}`
      : `\\u{${codePoint.toString(16).toUpperCase()}}`;
  }).join("");
}

function assertValidSurrogates(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new Error("Unicode input contains an unpaired surrogate.");
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new Error("Unicode input contains an unpaired surrogate.");
    }
  }
}

export function decodeUnicodeEscapes(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  let result = "";
  let cursor = 0;
  while (cursor < input.length) {
    const escapeIndex = input.indexOf("\\u", cursor);
    if (escapeIndex === -1) {
      result += input.slice(cursor);
      break;
    }
    result += input.slice(cursor, escapeIndex);
    const fragment = input.slice(escapeIndex);
    const braced = fragment.match(/^\\u\{([\dA-Fa-f]{1,6})\}/);
    const fixed = fragment.match(/^\\u([\dA-Fa-f]{4})/);
    const match = braced ?? fixed;
    if (!match) throw new Error("Enter valid Unicode escape sequences.");
    const codePoint = Number.parseInt(match[1], 16);
    if (
      braced &&
      (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff))
    ) {
      throw new Error("Enter valid Unicode escape sequences.");
    }
    result += braced
      ? String.fromCodePoint(codePoint)
      : String.fromCharCode(codePoint);
    cursor = escapeIndex + match[0].length;
  }
  assertValidSurrogates(result);
  return result;
}

function asciiToken(value: number, base: AsciiCodeBase): string {
  if (base === "hex")
    return `0x${value.toString(16).toUpperCase().padStart(2, "0")}`;
  if (base === "binary") return `0b${value.toString(2).padStart(8, "0")}`;
  return String(value);
}

export function encodeAscii(input: string, base: AsciiCodeBase): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  return Array.from(input, (character) => {
    const value = character.codePointAt(0)!;
    if (value > 127)
      throw new Error("ASCII only supports code points from 0 to 127.");
    return asciiToken(value, base);
  }).join(" ");
}

export function decodeAscii(input: string): string {
  assertInputLimit(input, TOOL_LIMITS.text);
  const tokens = input
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (!tokens.length) return "";
  return tokens
    .map((token) => {
      const base = /^0x/i.test(token) ? 16 : /^0b/i.test(token) ? 2 : 10;
      const digits = token.replace(/^0[xb]/i, "");
      if (
        !digits ||
        (base === 16 && !/^[\dA-Fa-f]+$/.test(digits)) ||
        (base === 2 && !/^[01]+$/.test(digits)) ||
        (base === 10 && !/^\d+$/.test(digits))
      ) {
        throw new Error(
          "Enter ASCII codes as decimal, 0x hex, or 0b binary values.",
        );
      }
      const value = Number.parseInt(digits, base);
      if (value > 127)
        throw new Error("ASCII only supports code points from 0 to 127.");
      return String.fromCharCode(value);
    })
    .join("");
}

function asciiCategory(value: number): AsciiEntry["category"] {
  if (value < 32 || value === 127) return "control";
  if (value === 32) return "whitespace";
  if (value >= 48 && value <= 57) return "digit";
  if ((value >= 65 && value <= 90) || (value >= 97 && value <= 122))
    return "letter";
  return "symbol";
}

const symbolNames: Record<number, string> = {
  33: "Exclamation mark",
  34: "Double quote",
  35: "Number sign",
  36: "Dollar sign",
  37: "Percent sign",
  38: "Ampersand",
  39: "Apostrophe",
  40: "Left parenthesis",
  41: "Right parenthesis",
  42: "Asterisk",
  43: "Plus sign",
  44: "Comma",
  45: "Hyphen-minus",
  46: "Full stop",
  47: "Solidus",
  58: "Colon",
  59: "Semicolon",
  60: "Less-than sign",
  61: "Equals sign",
  62: "Greater-than sign",
  63: "Question mark",
  64: "Commercial at",
  91: "Left square bracket",
  92: "Reverse solidus",
  93: "Right square bracket",
  94: "Circumflex accent",
  95: "Low line",
  96: "Grave accent",
  123: "Left curly bracket",
  124: "Vertical line",
  125: "Right curly bracket",
  126: "Tilde",
};

function asciiName(decimal: number): string {
  if (decimal < 32) return controlNames[decimal];
  if (decimal === 32) return "Space";
  if (decimal === 127) return "DEL (Delete)";
  if (decimal >= 48 && decimal <= 57) {
    return `Digit ${String.fromCharCode(decimal)}`;
  }
  if (decimal >= 65 && decimal <= 90) {
    return `Uppercase ${String.fromCharCode(decimal)}`;
  }
  if (decimal >= 97 && decimal <= 122) {
    return `Lowercase ${String.fromCharCode(decimal)}`;
  }
  return symbolNames[decimal] ?? String.fromCharCode(decimal);
}

export const ASCII_TABLE: AsciiEntry[] = Array.from(
  { length: 128 },
  (_, decimal) => ({
    decimal,
    hex: decimal.toString(16).toUpperCase().padStart(2, "0"),
    binary: decimal.toString(2).padStart(8, "0"),
    character:
      decimal === 32
        ? "SPACE"
        : decimal < 32 || decimal === 127
          ? "-"
          : String.fromCharCode(decimal),
    name: asciiName(decimal),
    category: asciiCategory(decimal),
  }),
);

function visibleCharacter(character: string): string {
  const names: Record<string, string> = {
    " ": "SPACE",
    "\n": "LF",
    "\r": "CR",
    "\t": "TAB",
  };
  return names[character] ?? character;
}

export function inspectUtf8(input: string, maxRows = 1_000): Utf8Inspection {
  assertInputLimit(input, TOOL_LIMITS.text);
  assertValidSurrogates(input);
  const encoder = new TextEncoder();
  const rows: Utf8Row[] = [];
  let codePoints = 0;
  let ascii = 0;
  let multibyte = 0;
  for (const character of input) {
    codePoints += 1;
    const encoded = encoder.encode(character);
    if (encoded.length === 1) ascii += 1;
    else multibyte += 1;
    if (rows.length < Math.max(0, maxRows)) {
      const point = character.codePointAt(0)!;
      rows.push({
        character: visibleCharacter(character),
        codePoint: `U+${point.toString(16).toUpperCase().padStart(4, "0")}`,
        bytes: Array.from(encoded, (byte) =>
          byte.toString(16).toUpperCase().padStart(2, "0"),
        ).join(" "),
        byteCount: encoded.length,
      });
    }
  }
  return {
    bytes: encoder.encode(input).length,
    codePoints,
    codeUnits: input.length,
    ascii,
    multibyte,
    rows,
    truncated: Math.max(0, codePoints - rows.length),
  };
}
