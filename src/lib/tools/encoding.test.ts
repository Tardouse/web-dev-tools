import { describe, expect, it } from "vitest";
import {
  decodeBase64,
  decodeJwt,
  decodeUrl,
  encodeBase64,
  encodeUrl,
} from "./encoding";

describe("encoding tools", () => {
  it("round-trips Unicode Base64", () => {
    const value = "Hello 世界 👋";
    expect(decodeBase64(encodeBase64(value))).toBe(value);
  });
  it("rejects malformed Base64", () =>
    expect(() => decodeBase64("%%%=")).toThrow("valid Base64"));
  it("round-trips URL components", () => {
    const value = "path?q=developer tools&emoji=🚀";
    expect(decodeUrl(encodeUrl(value))).toBe(value);
  });
  it("reports malformed percent encoding", () =>
    expect(() => decodeUrl("%E0%A4%A")).toThrow("invalid percent"));
  it("decodes JWT claims without claiming verification", () => {
    const result = decodeJwt(
      "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjMiLCJpYXQiOjE3MDAwMDAwMDB9.signature",
    );
    expect(result.payload).toEqual({ sub: "123", iat: 1700000000 });
    expect(result.issuedAt).toBe("2023-11-14T22:13:20.000Z");
  });
  it("rejects non-JWT input", () =>
    expect(() => decodeJwt("not-a-token")).toThrow("three dot-separated"));
});
