import { describe, expect, it } from "vitest";
import { TOOL_LIMITS } from "@/lib/config";
import {
  ASCII_TABLE,
  buildQueryString,
  decodeAscii,
  decodeFileBase64,
  decodeUnicodeEscapes,
  encodeAscii,
  encodeFileBase64,
  encodeUnicodeEscapes,
  inspectUtf8,
  parseQueryString,
  parseUrl,
  transformBase64,
} from "./encoding-data";

describe("extended encoding and URL tools", () => {
  it("automatically chooses text Base64 encoding or decoding", () => {
    expect(transformBase64("Hello", "auto")).toBe("SGVsbG8=");
    expect(transformBase64("5LiW55WM", "auto")).toBe("世界");
    expect(transformBase64("%%%%", "auto")).toBe("JSUlJQ==");
  });

  it("round-trips file bytes and preserves a safe data URL MIME type", () => {
    expect(TOOL_LIMITS.maxBase64Output).toBe(
      Math.ceil((TOOL_LIMITS.file * 4) / 3) + 1024,
    );
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 1, 2]);
    const encoded = encodeFileBase64(data, "image/png", true);
    expect(encoded).toMatch(/^data:image\/png;base64,/);
    expect(decodeFileBase64(encoded)).toEqual({
      data,
      mimeType: "image/png",
      source: "data-url",
    });
    expect(() => decodeFileBase64("data:text/plain,hello")).toThrow(
      "must contain Base64",
    );
    expect(decodeFileBase64("data:not a/type;base64,YQ==").mimeType).toBe(
      "application/octet-stream",
    );
    expect(() => decodeFileBase64("not:base64")).toThrow("valid Base64");
  });

  it("parses absolute URLs without losing duplicate query parameters", () => {
    const result = JSON.parse(
      parseUrl("https://user:pass@example.com:8443/a%20b?tag=one&tag=two#part"),
    );
    expect(result).toMatchObject({
      protocol: "https",
      username: "user",
      password: "pass",
      hostname: "example.com",
      port: "8443",
      pathSegments: ["a b"],
      query: { tag: ["one", "two"] },
      hash: "part",
    });
    expect(() => parseUrl("example.com/path")).toThrow("absolute URL");
  });

  it("parses and generates repeated query string values safely", () => {
    expect(
      JSON.parse(
        parseQueryString("https://example.com/?q=dev+tools&q=url&empty="),
      ),
    ).toEqual({ q: ["dev tools", "url"], empty: "" });
    expect(JSON.parse(parseQueryString("?__proto__=safe"))).toEqual(
      Object.fromEntries([["__proto__", "safe"]]),
    );
    expect(
      buildQueryString([
        { key: "q", value: "dev tools" },
        { key: "tag", value: "url" },
        { key: "tag", value: "encoding" },
      ]),
    ).toBe("?q=dev+tools&tag=url&tag=encoding");
  });

  it("round-trips BMP and supplementary Unicode escape sequences", () => {
    const encoded = encodeUnicodeEscapes("A世界🚀");
    expect(encoded).toBe("\\u0041\\u4E16\\u754C\\u{1F680}");
    expect(decodeUnicodeEscapes(encoded)).toBe("A世界🚀");
    expect(decodeUnicodeEscapes("\\uD83D\\uDE80")).toBe("🚀");
    expect(() => decodeUnicodeEscapes("\\u{110000}")).toThrow("valid Unicode");
    expect(() => decodeUnicodeEscapes("\\uD800")).toThrow("unpaired surrogate");
    expect(() => encodeUnicodeEscapes("\ud800")).toThrow("unpaired surrogate");
  });

  it("converts ASCII text and mixed code notation", () => {
    expect(encodeAscii("Az!", "decimal")).toBe("65 122 33");
    expect(encodeAscii("Az!", "hex")).toBe("0x41 0x7A 0x21");
    expect(encodeAscii("A", "binary")).toBe("0b01000001");
    expect(decodeAscii("65, 0x7A 0b00100001")).toBe("Az!");
    expect(() => encodeAscii("世界", "decimal")).toThrow("0 to 127");
    expect(ASCII_TABLE).toHaveLength(128);
    expect(ASCII_TABLE[10]).toMatchObject({ name: "LF (Line Feed)" });
    expect(ASCII_TABLE[65]).toMatchObject({
      character: "A",
      hex: "41",
      name: "Uppercase A",
    });
  });

  it("reports UTF-8 bytes per Unicode code point with bounded rows", () => {
    expect(inspectUtf8("A世🚀", 2)).toEqual({
      bytes: 8,
      codePoints: 3,
      codeUnits: 4,
      ascii: 1,
      multibyte: 2,
      rows: [
        { character: "A", codePoint: "U+0041", bytes: "41", byteCount: 1 },
        {
          character: "世",
          codePoint: "U+4E16",
          bytes: "E4 B8 96",
          byteCount: 3,
        },
      ],
      truncated: 1,
    });
  });
});
