import { describe, expect, it } from "vitest";
import { TOOL_LIMITS } from "@/lib/config";
import {
  CURL_OUTPUT_FORMATS,
  generateCurl,
  generateFetch,
  generateRequestCode,
  parseCurl,
  type CurlRequest,
} from "./curl";

const request: CurlRequest = {
  method: "POST",
  url: "https://example.com/api",
  headers: [
    { name: "Accept", value: "application/json" },
    { name: "X-Trace", value: "demo" },
  ],
  query: [
    { name: "tag", value: "one" },
    { name: "tag", value: "two words" },
  ],
  cookies: [{ name: "session", value: "abc" }],
  auth: {
    type: "bearer",
    username: "",
    password: "",
    token: "token-value",
  },
  body: {
    type: "raw",
    text: '{"name":"demo"}',
    fields: [],
  },
};

describe("cURL tools", () => {
  it("parses a common POST request into the complete request model", () => {
    expect(
      parseCurl(
        "curl -X POST 'https://example.com/api?tag=one&tag=two' -H 'Content-Type: application/json' -H 'Authorization: Bearer demo-token' -b 'theme=dark; session=abc' --data-raw '{\"ok\":true}'",
      ),
    ).toEqual({
      method: "POST",
      url: "https://example.com/api",
      headers: [{ name: "Content-Type", value: "application/json" }],
      query: [
        { name: "tag", value: "one" },
        { name: "tag", value: "two" },
      ],
      cookies: [
        { name: "theme", value: "dark" },
        { name: "session", value: "abc" },
      ],
      auth: {
        type: "bearer",
        username: "",
        password: "",
        token: "demo-token",
      },
      body: { type: "raw", text: '{"ok":true}', fields: [] },
    });
  });

  it("parses Basic Auth, URL-encoded fields, GET data, and --json", () => {
    const basic = parseCurl(
      "curl 'https://example.com/search' -u 'ada:s3cret' -d 'q=dev tools&tag=one'",
    );
    expect(basic.method).toBe("POST");
    expect(basic.auth).toMatchObject({
      type: "basic",
      username: "ada",
      password: "s3cret",
    });
    expect(basic.body).toEqual({
      type: "form-urlencoded",
      text: "",
      fields: [
        { name: "q", value: "dev tools", kind: "text" },
        { name: "tag", value: "one", kind: "text" },
      ],
    });

    const get = parseCurl(
      "curl --get https://example.com/search --data-urlencode 'q=dev tools' -d 'page=2'",
    );
    expect(get.method).toBe("GET");
    expect(get.query).toEqual([
      { name: "q", value: "dev tools" },
      { name: "page", value: "2" },
    ]);
    expect(get.body.type).toBe("none");

    const json = parseCurl(
      "curl https://example.com/items --json '{\"ok\":true}'",
    );
    expect(json.method).toBe("POST");
    expect(json.headers).toEqual(
      expect.arrayContaining([
        { name: "Content-Type", value: "application/json" },
        { name: "Accept", value: "application/json" },
      ]),
    );
    expect(json.body.text).toBe('{"ok":true}');
  });

  it("parses multipart text and file fields", () => {
    const parsed = parseCurl(
      "curl https://example.com/upload -F 'title=Report' -F 'document=@./report.pdf;type=application/pdf'",
    );
    expect(parsed.method).toBe("POST");
    expect(parsed.body).toEqual({
      type: "multipart",
      text: "",
      fields: [
        { name: "title", value: "Report", kind: "text" },
        {
          name: "document",
          value: "./report.pdf",
          kind: "file",
          contentType: "application/pdf",
        },
      ],
    });
  });

  it("generates all documented targets with query, cookies, auth, and body", () => {
    const signatures: Record<(typeof CURL_OUTPUT_FORMATS)[number], string> = {
      curl: "curl --request POST",
      fetch: "await fetch",
      axios: "await axios",
      "python-requests": "requests.request",
      "python-httpx": "httpx.request",
      go: "http.NewRequest",
      php: "curl_setopt_array",
      java: "HttpRequest.newBuilder",
      csharp: "HttpRequestMessage",
      xhr: "new XMLHttpRequest",
    };
    for (const format of CURL_OUTPUT_FORMATS) {
      const output = generateRequestCode(request, format);
      expect(output, format).toContain(signatures[format]);
      expect(output, format).toContain("tag=one");
      expect(output, format).toContain("token-value");
      if (format !== "xhr") expect(output, format).toContain("session");
    }
    expect(generateCurl(request)).toContain("--cookie 'session=abc'");
    expect(generateFetch(request)).toContain("body:");
  });

  it("generates URL-encoded and multipart bodies for every language family", () => {
    const encoded: CurlRequest = {
      ...request,
      body: {
        type: "form-urlencoded",
        text: "",
        fields: [
          { name: "name", value: "Ada Lovelace", kind: "text" },
          { name: "role", value: "developer", kind: "text" },
        ],
      },
    };
    expect(generateRequestCode(encoded, "curl")).toContain("--data-urlencode");
    expect(generateRequestCode(encoded, "go")).toContain(
      "name=Ada+Lovelace&role=developer",
    );
    expect(generateRequestCode(encoded, "csharp")).toContain(
      "FormUrlEncodedContent",
    );

    const multipart: CurlRequest = {
      ...request,
      headers: [
        ...request.headers,
        { name: "Content-Type", value: "application/json" },
      ],
      body: {
        type: "multipart",
        text: "",
        fields: [
          { name: "caption", value: "Quarterly", kind: "text" },
          {
            name: "document",
            value: "/tmp/report.pdf",
            kind: "file",
            contentType: "application/pdf",
          },
        ],
      },
    };
    const multipartCurl = generateRequestCode(multipart, "curl");
    expect(multipartCurl).toContain("--form");
    expect(multipartCurl).not.toContain("Content-Type: application/json");
    expect(generateRequestCode(multipart, "fetch")).toContain("new FormData");
    expect(generateRequestCode(multipart, "python-requests")).toContain(
      'open("/tmp/report.pdf", "rb")',
    );
    expect(generateRequestCode(multipart, "go")).toContain(
      "multipart.NewWriter",
    );
    expect(generateRequestCode(multipart, "php")).toContain("new CURLFile");
    expect(generateRequestCode(multipart, "java")).toContain("boundary");
    expect(generateRequestCode(multipart, "csharp")).toContain(
      "MultipartFormDataContent",
    );
    expect(generateRequestCode(multipart, "xhr")).toContain("formData.append");
  });

  it("generates requests without a body for every target", () => {
    const withoutBody: CurlRequest = {
      ...request,
      method: "GET",
      body: { type: "none", text: "ignored", fields: [] },
    };
    for (const format of CURL_OUTPUT_FORMATS) {
      expect(generateRequestCode(withoutBody, format), format).not.toContain(
        "ignored",
      );
    }
    expect(generateRequestCode(withoutBody, "curl")).not.toContain("--data");
    expect(generateRequestCode(withoutBody, "fetch")).not.toContain("body:");
  });

  it("rejects missing URLs, unsafe headers, malformed methods, and oversized sections", () => {
    expect(() => parseCurl("")).toThrow("start with curl");
    expect(() => parseCurl("x".repeat(TOOL_LIMITS.text + 1))).toThrow(
      "The limit for this tool",
    );
    expect(() => parseCurl("curl -X GET")).toThrow("No request URL");
    expect(() => parseCurl("curl https://example.com -H invalid")).toThrow(
      "Name: Value",
    );
    expect(() =>
      generateCurl({
        ...request,
        headers: [{ name: "X-Test", value: "safe\r\ninjected" }],
      }),
    ).toThrow("line breaks");
    expect(() => generateCurl({ ...request, method: "GET\nBAD" })).toThrow(
      "HTTP methods",
    );
    expect(() =>
      generateCurl({
        ...request,
        query: Array.from({ length: 101 }, (_, index) => ({
          name: "item",
          value: String(index),
        })),
      }),
    ).toThrow("100 entries");
  });
});
