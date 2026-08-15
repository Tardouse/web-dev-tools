import { packTar } from "modern-tar";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  createGzipArchive,
  createZipArchive,
  extractGzipArchive,
  extractTarArchive,
  extractZipArchive,
  normalizeArchivePath,
} from "./archive";

const text = (value: string) => new TextEncoder().encode(value);
const decode = (value: Uint8Array) => new TextDecoder().decode(value);

describe("browser-local archive operations", () => {
  it("creates and extracts ZIP files", () => {
    const archive = createZipArchive([
      { name: "docs/readme.txt", data: text("hello") },
      { name: "data.json", data: text('{"ok":true}') },
    ]);
    const entries = extractZipArchive(archive);
    expect(entries.map((entry) => entry.name)).toEqual([
      "docs/readme.txt",
      "data.json",
    ]);
    expect(decode(entries[0].data)).toBe("hello");
  });

  it("rejects ZIP Slip paths and unsafe creation names", () => {
    const archive = zipSync({ "../escape.txt": text("no") });
    expect(() => extractZipArchive(archive)).toThrow(/path traversal/i);
    expect(() =>
      createZipArchive([{ name: "/root.txt", data: text("no") }]),
    ).toThrow(/absolute/i);
    expect(() => normalizeArchivePath("a/../../secret")).toThrow(/traversal/i);
  });

  it("enforces ZIP entry, depth, expanded-size, and ratio limits", () => {
    const archive = zipSync({
      "one.txt": text("A".repeat(16_000)),
      "two.txt": text("B"),
    });
    expect(() => extractZipArchive(archive, { maxEntries: 1 })).toThrow(
      /1 entries/,
    );
    expect(() => extractZipArchive(archive, { maxDepth: 0 })).toThrow(
      /positive/,
    );
    expect(() => extractZipArchive(archive, { maxExtractedSize: 100 })).toThrow(
      /extracted size/i,
    );
    expect(() =>
      extractZipArchive(archive, { maxCompressionRatio: 2 }),
    ).toThrow(/compression ratio/i);
  });

  it("extracts TAR files and rejects traversal entries", async () => {
    const archive = await packTar([
      { header: { name: "safe/file.txt", size: 5 }, body: "hello" },
    ]);
    const extracted = await extractTarArchive(archive);
    expect(extracted).toHaveLength(1);
    expect(extracted[0].name).toBe("safe/file.txt");
    expect(decode(extracted[0].data)).toBe("hello");
    const unsafe = await packTar([
      { header: { name: "../escape.txt", size: 1 }, body: "x" },
    ]);
    await expect(extractTarArchive(unsafe)).rejects.toThrow(/traversal/i);
  });

  it("round-trips GZIP and blocks excessive expansion", () => {
    const original = text("DevToolbox ".repeat(100));
    const archive = createGzipArchive(original);
    expect(decode(extractGzipArchive(archive))).toBe(decode(original));
    expect(() => extractGzipArchive(archive, { maxExtractedSize: 20 })).toThrow(
      /extracted size/i,
    );
    expect(() =>
      extractGzipArchive(archive, { maxCompressionRatio: 2 }),
    ).toThrow(/compression ratio/i);
  });
});
