import chardet from "chardet";
import mimeDb from "mime-db";
import { md5 } from "@noble/hashes/legacy.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export type FileHashAlgorithm =
  "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export interface EncodingCandidate {
  name: string;
  confidence: number;
  language?: string;
}

const extensionTypes = new Map<string, string>();
for (const [type, entry] of Object.entries(mimeDb)) {
  for (const extension of entry.extensions ?? []) {
    if (!extensionTypes.has(extension)) extensionTypes.set(extension, type);
  }
}

export function mimeFromExtension(filename: string): string | undefined {
  const clean = filename.toLowerCase().split(/[?#]/, 1)[0];
  const extension = clean.includes(".") ? clean.split(".").pop() : clean;
  return extension ? extensionTypes.get(extension) : undefined;
}

export function sniffMimeType(data: Uint8Array): string | undefined {
  const starts = (...bytes: number[]) =>
    bytes.every((byte, index) => data[index] === byte);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))
    return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (starts(0x50, 0x4b, 0x03, 0x04) || starts(0x50, 0x4b, 0x05, 0x06)) {
    return "application/zip";
  }
  if (starts(0x1f, 0x8b)) return "application/gzip";
  if (
    data.length >= 12 &&
    new TextDecoder("latin1").decode(data.slice(0, 4)) === "RIFF" &&
    new TextDecoder("latin1").decode(data.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  if (starts(0x7f, 0x45, 0x4c, 0x46)) return "application/x-elf";
  return undefined;
}

export function resolveFileMime(
  filename: string,
  data: Uint8Array,
  declaredType?: string,
): { type: string; source: "signature" | "extension" | "browser" | "unknown" } {
  const signature = sniffMimeType(data);
  if (signature) return { type: signature, source: "signature" };
  const extension = mimeFromExtension(filename);
  if (extension) return { type: extension, source: "extension" };
  if (declaredType) return { type: declaredType, source: "browser" };
  return { type: "application/octet-stream", source: "unknown" };
}

export async function hashFileBytes(
  data: Uint8Array,
  algorithm: FileHashAlgorithm,
): Promise<string> {
  if (algorithm === "MD5") return bytesToHex(md5(data));
  const copy = Uint8Array.from(data);
  const digest = await crypto.subtle.digest(algorithm, copy.buffer);
  return bytesToHex(new Uint8Array(digest));
}

export function createHexPreview(data: Uint8Array, maxBytes = 4096): string {
  const lines: string[] = [];
  const visible = data.subarray(0, Math.max(0, maxBytes));
  for (let offset = 0; offset < visible.length; offset += 16) {
    const row = visible.subarray(offset, offset + 16);
    const hex = Array.from(row, (byte) => byte.toString(16).padStart(2, "0"))
      .join(" ")
      .padEnd(47, " ");
    const ascii = Array.from(row, (byte) =>
      byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".",
    ).join("");
    lines.push(`${offset.toString(16).padStart(8, "0")}  ${hex}  |${ascii}|`);
  }
  return lines.join("\n");
}

export function detectTextEncodings(
  data: Uint8Array,
  limit = 5,
): EncodingCandidate[] {
  const sample = data.subarray(0, 64 * 1024);
  return chardet
    .analyse(sample)
    .slice(0, Math.max(1, limit))
    .map((item) => ({
      name: item.name,
      confidence: item.confidence,
      ...(item.lang ? { language: item.lang } : {}),
    }));
}

const sizeUnits = {
  B: 1,
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  KiB: 1_024,
  MiB: 1_048_576,
  GiB: 1_073_741_824,
} as const;

export type FileSizeUnit = keyof typeof sizeUnits;

export function convertFileSize(
  value: number,
  from: FileSizeUnit,
): Record<FileSizeUnit, number> {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("File size must be a non-negative number.");
  }
  const bytes = value * sizeUnits[from];
  return Object.fromEntries(
    Object.entries(sizeUnits).map(([unit, multiplier]) => [
      unit,
      bytes / multiplier,
    ]),
  ) as Record<FileSizeUnit, number>;
}
