import { describe, expect, it } from "vitest";
import { assertSafeRegex, hashText, testRegex } from "./security";

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
    const result = testRegex("(dev)(tool)", "i", "DevTool and devtool");
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].groups).toEqual(["Dev", "Tool"]);
  });
  it("blocks obvious nested quantifiers", () =>
    expect(() => assertSafeRegex("(a+)+$")).toThrow("nested quantifiers"));
  it("caps regular expression size", () =>
    expect(() => assertSafeRegex("a".repeat(1001))).toThrow("limited"));
});
