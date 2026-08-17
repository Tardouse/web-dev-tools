import { afterEach, describe, expect, it, vi } from "vitest";
import {
  runToolWorker,
  ToolExecutionLimiter,
  workerInputPayload,
} from "./tool-execution";
import {
  assertToolInputLimit,
  assertToolOutputLimit,
  outputByteLength,
  ToolLimitError,
} from "./tool-limits";

const limits = {
  maxExecutionTime: 1_000,
  maxOutputSize: 1_024,
  maxConcurrency: 1,
};

describe("unified tool execution limits", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("measures strings, binary views, and nested structured output", () => {
    const output = {
      text: "你好",
      files: [{ name: "demo.bin", data: new Uint8Array(12) }],
    };
    expect(outputByteLength(output)).toBeGreaterThanOrEqual(18);
    expect(() => assertToolOutputLimit(output, 8)).toThrowError(ToolLimitError);
  });

  it("rejects output before returning it to the caller", async () => {
    const limiter = new ToolExecutionLimiter({
      ...limits,
      maxOutputSize: 4,
    });
    await expect(limiter.run(() => "12345")).rejects.toMatchObject({
      code: "output",
    });
    expect(limiter.activeCount).toBe(0);
  });

  it("measures only user payload for structured worker input", () => {
    expect(() =>
      assertToolInputLimit(
        workerInputPayload({
          operation: "diff",
          before: "1234",
          after: "5678",
          mode: "lines",
          ignoreWhitespace: false,
        }),
        4,
      ),
    ).toThrow(/Input is/);
    expect(
      outputByteLength(
        workerInputPayload({
          operation: "file-hash",
          data: new Uint8Array(7),
          algorithm: "SHA-256",
        }),
      ),
    ).toBe(7);
    expect(
      outputByteLength(
        workerInputPayload({
          operation: "file-base64-encode",
          data: new Uint8Array(9),
          mimeType: "application/octet-stream",
          dataUrl: true,
        }),
      ),
    ).toBe(9);
    expect(
      outputByteLength(
        workerInputPayload({
          operation: "regex-test",
          pattern: "a",
          flags: "g",
          input: "body",
          replacement: "replacement",
        }),
      ),
    ).toBe(16);
    expect(
      workerInputPayload({
        operation: "curl-generate",
        format: "fetch",
        request: {
          method: "POST",
          url: "https://example.com/items",
          headers: [{ name: "Accept", value: "application/json" }],
          query: [],
          cookies: [],
          auth: {
            type: "none",
            username: "",
            password: "",
            token: "",
          },
          body: { type: "raw", text: "payload", fields: [] },
        },
      }),
    ).toMatchObject({ body: { text: "payload" } });
  });

  it("caps concurrent operations with one shared slot", async () => {
    const limiter = new ToolExecutionLimiter(limits);
    let release: (value: string) => void = () => undefined;
    const first = limiter.run(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );
    await Promise.resolve();

    expect(limiter.activeCount).toBe(1);
    await expect(limiter.run(() => "second")).rejects.toMatchObject({
      code: "concurrency",
    });

    release("first");
    await expect(first).resolves.toBe("first");
    expect(limiter.activeCount).toBe(0);
  });

  it("aborts a task when its execution deadline expires", async () => {
    vi.useFakeTimers();
    const limiter = new ToolExecutionLimiter({
      ...limits,
      maxExecutionTime: 25,
    });
    const task = limiter.run(
      (signal) =>
        new Promise<never>((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        }),
    );
    const rejection = expect(task).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(25);
    await rejection;
    expect(limiter.activeCount).toBe(0);
  });

  it("terminates a worker when its execution deadline expires", async () => {
    vi.useFakeTimers();
    const terminate = vi.fn();
    class PendingWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      onmessageerror: ((event: MessageEvent) => void) | null = null;
      postMessage() {}
      terminate = terminate;
    }
    vi.stubGlobal("Worker", PendingWorker);
    const task = runToolWorker<string>(
      { operation: "json-minify", input: '{"ok":true}' },
      {
        maxInputSize: 1_024,
        maxOutputSize: 1_024,
        maxExecutionTime: 25,
        maxConcurrency: 1,
      },
    );
    const rejection = expect(task).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(25);
    await rejection;
    expect(terminate).toHaveBeenCalledOnce();
  });
});
