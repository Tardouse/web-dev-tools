import { describe, expect, it } from "vitest";
import { generateCurl, generateFetch, parseCurl } from "./curl";

describe("cURL tools", () => {
  it("parses a common POST request", () => {
    expect(
      parseCurl(
        "curl -X POST 'https://example.com/api' -H 'Content-Type: application/json' -d '{\"ok\":true}'",
      ),
    ).toEqual({
      method: "POST",
      url: "https://example.com/api",
      headers: { "Content-Type": "application/json" },
      data: '{"ok":true}',
    });
  });
  it("infers POST when data is supplied", () =>
    expect(parseCurl("curl https://example.com -d 'hello'").method).toBe(
      "POST",
    ));
  it("does not execute requests", () => {
    const request = {
      method: "POST",
      url: "https://example.com/api",
      headers: { Accept: "application/json" },
      data: "{}",
    };
    expect(generateCurl(request)).toContain("curl --request POST");
    expect(generateFetch(request)).toContain("await fetch");
  });
  it("rejects commands without a URL", () =>
    expect(() => parseCurl("curl -X GET")).toThrow("No request URL"));
});
