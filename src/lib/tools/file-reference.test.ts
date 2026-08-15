import { describe, expect, it } from "vitest";
import {
  convertFileSize,
  createHexPreview,
  detectTextEncodings,
  hashFileBytes,
  mimeFromExtension,
  resolveFileMime,
} from "./file";
import { lookupHttpStatuses, lookupMimeTypes, statusClass } from "./reference";

describe("file inspection", () => {
  it("resolves MIME types from signatures before extensions", () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(resolveFileMime("wrong.txt", png)).toEqual({
      type: "image/png",
      source: "signature",
    });
    expect(mimeFromExtension("archive.tar.gz")).toBe("application/gzip");
  });

  it("hashes bytes and renders a bounded hex preview", async () => {
    const bytes = new TextEncoder().encode("abc");
    expect(await hashFileBytes(bytes, "SHA-256")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(await hashFileBytes(bytes, "MD5")).toBe(
      "900150983cd24fb0d6963f7d28e17f72",
    );
    expect(createHexPreview(bytes)).toContain("61 62 63");
    expect(createHexPreview(bytes)).toContain("|abc|");
  });

  it("detects text encodings and converts SI and IEC sizes", () => {
    const candidates = detectTextEncodings(
      new TextEncoder().encode("plain utf-8 text"),
    );
    expect(candidates.length).toBeGreaterThan(0);
    expect(convertFileSize(1, "MiB").B).toBe(1_048_576);
    expect(convertFileSize(1, "MB").MiB).toBeCloseTo(0.953674, 5);
  });
});

describe("MIME and HTTP references", () => {
  it("finds MIME types by extension and full media type", () => {
    expect(lookupMimeTypes("json")[0].type).toBe("application/json");
    expect(lookupMimeTypes(".png")[0]).toMatchObject({ type: "image/png" });
  });

  it("searches and groups standard HTTP statuses", () => {
    expect(lookupHttpStatuses("not found")).toEqual([
      expect.objectContaining({ code: 404 }),
    ]);
    expect(
      lookupHttpStatuses("", "5xx").every((item) => item.code >= 500),
    ).toBe(true);
    expect(statusClass(204)).toBe("Success");
    expect(statusClass(429)).toBe("Client error");
  });
});
