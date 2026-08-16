import { describe, expect, it } from "vitest";
import { readLimitedResponseBody } from "./browser-request";
import { parseHeaderLines } from "./developer-tools";
import {
  buildHttpHeaders,
  formatWebhookPayload,
  renderHttpHeaders,
  type HeaderBuilderInput,
} from "./http-workbench";

const defaultInput: HeaderBuilderInput = {
  accept: "application/json",
  contentType: "application/json",
  customHeaders: "X-Request-ID: test-123",
  authentication: "none",
  token: "",
  username: "",
  password: "",
  apiKeyName: "",
  apiKeyValue: "",
};

describe("HTTP header builder", () => {
  it("builds auth headers and replaces case-insensitive duplicates", () => {
    expect(
      buildHttpHeaders({
        ...defaultInput,
        customHeaders: "authorization: Bearer old\nX-Trace-ID: trace-1",
        authentication: "bearer",
        token: "new-token",
      }),
    ).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Trace-ID": "trace-1",
      Authorization: "Bearer new-token",
    });
    expect(
      buildHttpHeaders({
        ...defaultInput,
        authentication: "basic",
        username: "api",
        password: "secret",
      }).Authorization,
    ).toBe("Basic YXBpOnNlY3JldA==");
  });

  it("validates API key names, credentials, and header values", () => {
    expect(() =>
      buildHttpHeaders({
        ...defaultInput,
        authentication: "api-key",
        apiKeyName: "Bad Header",
        apiKeyValue: "secret",
      }),
    ).toThrow("Invalid header name");
    expect(() =>
      buildHttpHeaders({
        ...defaultInput,
        authentication: "basic",
        username: "name:part",
        password: "secret",
      }),
    ).toThrow("Username cannot contain a colon");
    expect(() => parseHeaderLines("X-Test: safe\rInjected: value")).toThrow(
      "Invalid header value",
    );
  });

  it("renders raw, JSON, and Fetch header formats", () => {
    const headers = { Accept: "application/json", Authorization: "Bearer token" };
    expect(renderHttpHeaders(headers, "lines")).toContain(
      "Authorization: Bearer token",
    );
    expect(JSON.parse(renderHttpHeaders(headers, "json"))).toEqual(headers);
    expect(renderHttpHeaders(headers, "fetch")).toContain(
      'headers: {\n  "Accept": "application/json"',
    );
  });
});

describe("Webhook payload and browser response limits", () => {
  it("formats and minifies JSON webhook payloads", () => {
    const input = '{"event":"created","data":{"id":42}}';
    expect(formatWebhookPayload(input)).toContain('\n  "event": "created"');
    expect(formatWebhookPayload(input, true)).toBe(input);
    expect(() => formatWebhookPayload("{broken}")).toThrow("Invalid JSON");
  });

  it("cancels response bodies that exceed the configured byte limit", async () => {
    await expect(
      readLimitedResponseBody(new Response("four"), 3),
    ).rejects.toThrow("Response exceeds the 1 MB browser limit");
    await expect(
      readLimitedResponseBody(new Response("three"), 5),
    ).resolves.toBe("three");
  });
});
