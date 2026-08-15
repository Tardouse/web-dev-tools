import { Gunzip, Unzip, UnzipInflate, gzipSync, zipSync } from "fflate";
import { createTarDecoder } from "modern-tar";
import { TOOL_LIMITS } from "@/lib/config";

export interface LocalFileEntry {
  name: string;
  data: Uint8Array;
}

export interface ArchiveLimits {
  maxInputSize: number;
  maxExtractedSize: number;
  maxEntries: number;
  maxDepth: number;
  maxCompressionRatio: number;
  maxProcessTime: number;
}

export const DEFAULT_ARCHIVE_LIMITS: ArchiveLimits = {
  maxInputSize: TOOL_LIMITS.archive,
  maxExtractedSize: TOOL_LIMITS.maxExtractedSize,
  maxEntries: TOOL_LIMITS.maxArchiveEntries,
  maxDepth: TOOL_LIMITS.maxArchiveDepth,
  maxCompressionRatio: TOOL_LIMITS.maxCompressionRatio,
  maxProcessTime: TOOL_LIMITS.maxFileProcessTime,
};

function limitsWith(overrides?: Partial<ArchiveLimits>): ArchiveLimits {
  return { ...DEFAULT_ARCHIVE_LIMITS, ...overrides };
}

function assertPositiveLimit(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
}

function assertLimits(limits: ArchiveLimits): void {
  for (const [label, value] of Object.entries(limits)) {
    assertPositiveLimit(value, label);
  }
}

export function normalizeArchivePath(
  input: string,
  maxDepth = DEFAULT_ARCHIVE_LIMITS.maxDepth,
): string {
  if (!input || input.includes("\0")) {
    throw new Error("Archive entries must have a valid path.");
  }
  const normalized = input.replaceAll("\\", "/");
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    /^[a-zA-Z]:\//.test(normalized)
  ) {
    throw new Error(`Unsafe absolute archive path: ${input}`);
  }
  const directory = normalized.endsWith("/");
  const parts = normalized.split("/").filter(Boolean);
  if (!parts.length || parts.some((part) => part === "." || part === "..")) {
    throw new Error(`Unsafe archive path traversal: ${input}`);
  }
  if (parts.length > maxDepth) {
    throw new Error(`Archive path exceeds the maximum depth of ${maxDepth}.`);
  }
  return `${parts.join("/")}${directory ? "/" : ""}`;
}

function assertInputSize(data: Uint8Array, limits: ArchiveLimits): void {
  if (data.byteLength > limits.maxInputSize) {
    throw new Error("Archive exceeds the maximum input size.");
  }
}

function assertDeadline(startedAt: number, limits: ArchiveLimits): void {
  if (Date.now() - startedAt > limits.maxProcessTime) {
    throw new Error("Archive processing exceeded the time limit.");
  }
}

function assertExpandedTotal(
  total: number,
  compressedSize: number,
  limits: ArchiveLimits,
): void {
  if (total > limits.maxExtractedSize) {
    throw new Error("Archive exceeds the maximum extracted size.");
  }
  if (
    compressedSize > 0 &&
    total > compressedSize * limits.maxCompressionRatio
  ) {
    throw new Error("Archive exceeds the maximum compression ratio.");
  }
}

function concatChunks(chunks: Uint8Array[], total: number): Uint8Array {
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export function createZipArchive(
  files: readonly LocalFileEntry[],
  overrides?: Partial<ArchiveLimits>,
): Uint8Array {
  const limits = limitsWith(overrides);
  assertLimits(limits);
  if (!files.length) throw new Error("Select at least one file.");
  if (files.length > limits.maxEntries) {
    throw new Error(`Archives are limited to ${limits.maxEntries} entries.`);
  }
  const startedAt = Date.now();
  let total = 0;
  const input: Record<string, Uint8Array> = {};
  for (const file of files) {
    const name = normalizeArchivePath(file.name, limits.maxDepth);
    if (name.endsWith("/"))
      throw new Error("File entries cannot end with a slash.");
    if (Object.hasOwn(input, name)) {
      throw new Error(`Duplicate archive path: ${name}`);
    }
    total += file.data.byteLength;
    if (total > limits.maxInputSize) {
      throw new Error("Selected files exceed the maximum input size.");
    }
    assertDeadline(startedAt, limits);
    input[name] = file.data;
  }
  const output = zipSync(input, { level: 6 });
  assertDeadline(startedAt, limits);
  return output;
}

export function extractZipArchive(
  archive: Uint8Array,
  overrides?: Partial<ArchiveLimits>,
): LocalFileEntry[] {
  const limits = limitsWith(overrides);
  assertLimits(limits);
  assertInputSize(archive, limits);
  const startedAt = Date.now();
  const entries: LocalFileEntry[] = [];
  let entryCount = 0;
  let expandedTotal = 0;
  let failure: Error | null = null;
  const unzipper = new Unzip((file) => {
    if (failure) {
      file.terminate();
      return;
    }
    try {
      assertDeadline(startedAt, limits);
      entryCount += 1;
      if (entryCount > limits.maxEntries) {
        throw new Error(
          `Archives are limited to ${limits.maxEntries} entries.`,
        );
      }
      const name = normalizeArchivePath(file.name, limits.maxDepth);
      if ((file.originalSize ?? 0) > limits.maxExtractedSize) {
        throw new Error("Archive exceeds the maximum extracted size.");
      }
      const chunks: Uint8Array[] = [];
      let fileTotal = 0;
      file.ondata = (error, chunk, final) => {
        if (failure) return;
        try {
          if (error) throw error;
          assertDeadline(startedAt, limits);
          fileTotal += chunk.byteLength;
          expandedTotal += chunk.byteLength;
          assertExpandedTotal(expandedTotal, archive.byteLength, limits);
          if (!name.endsWith("/")) chunks.push(chunk.slice());
          if (final && !name.endsWith("/")) {
            entries.push({ name, data: concatChunks(chunks, fileTotal) });
          }
        } catch (error) {
          failure =
            error instanceof Error
              ? error
              : new Error("ZIP extraction failed.");
          file.terminate();
        }
      };
      file.start();
    } catch (error) {
      failure =
        error instanceof Error ? error : new Error("ZIP extraction failed.");
      file.terminate();
    }
  });
  unzipper.register(UnzipInflate);
  try {
    unzipper.push(archive, true);
  } catch (error) {
    if (!failure) {
      failure =
        error instanceof Error ? error : new Error("Invalid ZIP archive.");
    }
  }
  if (failure) throw failure;
  assertDeadline(startedAt, limits);
  return entries;
}

export async function extractTarArchive(
  archive: Uint8Array,
  overrides?: Partial<ArchiveLimits>,
): Promise<LocalFileEntry[]> {
  const limits = limitsWith(overrides);
  assertLimits(limits);
  assertInputSize(archive, limits);
  const startedAt = Date.now();
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(archive);
      controller.close();
    },
  });
  const reader = source
    .pipeThrough(createTarDecoder({ strict: true }))
    .getReader();
  const entries: LocalFileEntry[] = [];
  let entryCount = 0;
  let expandedTotal = 0;
  try {
    while (true) {
      assertDeadline(startedAt, limits);
      const { value: entry, done } = await reader.read();
      if (done) break;
      entryCount += 1;
      if (entryCount > limits.maxEntries) {
        throw new Error(
          `Archives are limited to ${limits.maxEntries} entries.`,
        );
      }
      const name = normalizeArchivePath(entry.header.name, limits.maxDepth);
      const type = entry.header.type ?? "file";
      if (!["file", "directory"].includes(type)) {
        await entry.body.cancel();
        throw new Error(`Unsupported TAR entry type: ${type}`);
      }
      if (entry.header.size > limits.maxExtractedSize) {
        await entry.body.cancel();
        throw new Error("Archive exceeds the maximum extracted size.");
      }
      const chunks: Uint8Array[] = [];
      let fileTotal = 0;
      const bodyReader = entry.body.getReader();
      while (true) {
        assertDeadline(startedAt, limits);
        const { value: chunk, done: bodyDone } = await bodyReader.read();
        if (bodyDone) break;
        fileTotal += chunk.byteLength;
        expandedTotal += chunk.byteLength;
        assertExpandedTotal(expandedTotal, archive.byteLength, limits);
        if (type === "file") chunks.push(chunk.slice());
      }
      if (type === "file" && !name.endsWith("/")) {
        entries.push({ name, data: concatChunks(chunks, fileTotal) });
      }
    }
  } catch (error) {
    await reader.cancel(error).catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  return entries;
}

export function createGzipArchive(
  data: Uint8Array,
  overrides?: Partial<ArchiveLimits>,
): Uint8Array {
  const limits = limitsWith(overrides);
  assertLimits(limits);
  assertInputSize(data, limits);
  const startedAt = Date.now();
  const output = gzipSync(data, { level: 6, mtime: 0 });
  assertDeadline(startedAt, limits);
  return output;
}

export function extractGzipArchive(
  archive: Uint8Array,
  overrides?: Partial<ArchiveLimits>,
): Uint8Array {
  const limits = limitsWith(overrides);
  assertLimits(limits);
  assertInputSize(archive, limits);
  const startedAt = Date.now();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let failure: Error | null = null;
  const gunzip = new Gunzip((chunk) => {
    if (failure) return;
    try {
      assertDeadline(startedAt, limits);
      total += chunk.byteLength;
      assertExpandedTotal(total, archive.byteLength, limits);
      chunks.push(chunk.slice());
    } catch (caught) {
      failure =
        caught instanceof Error ? caught : new Error("GZIP extraction failed.");
    }
  });
  try {
    gunzip.push(archive, true);
  } catch (error) {
    if (!failure) {
      failure =
        error instanceof Error ? error : new Error("Invalid GZIP archive.");
    }
  }
  if (failure) throw failure;
  return concatChunks(chunks, total);
}
