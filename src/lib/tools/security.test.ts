import { describe, expect, it } from "vitest";
import { assertSafeRegex, explainRegex, hashText, testRegex } from "./security";

describe("security-oriented local tools", () => {
  it("produces known hashes", async () => {
    expect(await hashText("abc", "SHA-256")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(await hashText("abc", "MD5")).toBe(
      "900150983cd24fb0d6963f7d28e17f72",
    );
  });
  it("highlights regex matches and groups", () => {
    const result = testRegex(
      "(?<product>dev)(tool)",
      "gi",
      "DevTool and devtool",
      "$<product> kit",
    );
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].groups).toEqual([
      { number: 1, name: "product", value: "Dev" },
      { number: 2, name: null, value: "Tool" },
    ]);
    expect(result.replacementResult).toBe("Dev kit and dev kit");
    expect(result.explanation).toContainEqual({
      token: "(?<product>",
      kind: "group-open",
    });
  });
  it("explains common regex tokens without executing the expression", () => {
    expect(explainRegex("^\\d{2,4}(?:px|rem)$")).toEqual(
      expect.arrayContaining([
        { token: "^", kind: "anchor" },
        { token: "\\d", kind: "escape" },
        { token: "{2,4}", kind: "quantifier" },
        { token: "(?:", kind: "group-open" },
        { token: "|", kind: "alternation" },
        { token: "$", kind: "anchor" },
      ]),
    );
  });
  it("limits replacement expansion by length and global match count", () => {
    expect(() => testRegex("a", "g", "a", "x".repeat(10_001))).toThrow(
      "limited to 10000 characters",
    );
    expect(() => testRegex("a", "g", "a".repeat(1_001), "b")).toThrow(
      "limited to 1000 matches",
    );
  });
  it("blocks obvious nested quantifiers", () =>
    expect(() => assertSafeRegex("(a+)+$")).toThrow("nested quantifiers"));
  it("caps regular expression size", () =>
    expect(() => assertSafeRegex("a".repeat(1001))).toThrow("limited"));
});
