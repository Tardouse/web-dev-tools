import { describe, expect, it } from "vitest";
import { formatJson, minifyJson, parseJson, validateJson } from "./json";

describe("JSON tools", () => {
  it("formats and minifies valid JSON", () => {
    expect(formatJson('{"emoji":"🚀","items":[1,2]}')).toBe(
      '{\n  "emoji": "🚀",\n  "items": [\n    1,\n    2\n  ]\n}',
    );
    expect(minifyJson('{\n "ok": true \n}')).toBe('{"ok":true}');
  });
  it("validates root types", () =>
    expect(validateJson("[1, 2]")).toContain("Root type: array"));
  it("returns useful errors for empty and malformed input", () => {
    expect(() => parseJson(" ")).toThrow("Enter JSON");
    expect(() => parseJson('{"open":')).toThrow("Invalid JSON");
  });
  it("rejects excessive nesting", () => {
    const nested = `${"[".repeat(101)}0${"]".repeat(101)}`;
    expect(() => parseJson(nested)).toThrow("maximum depth");
  });
});
