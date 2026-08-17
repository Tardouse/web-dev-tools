import {
  assertToolInputLimit,
  assertToolOutputLimit,
  formatExecutionTime,
  resolveToolExecutionLimits,
  ToolLimitError,
  type ToolExecutionLimits,
} from "@/lib/tool-limits";
import {
  collectTransferables,
  type ToolWorkerEnvelope,
  type ToolWorkerReply,
  type ToolWorkerRequest,
  type ToolWorkerResult,
} from "@/lib/tool-worker-protocol";
import { TOOL_LIMITS } from "@/lib/config";
import type { ToolDefinition } from "@/lib/types";

interface ToolTaskOptions extends Partial<ToolExecutionLimits> {
  signal?: AbortSignal;
}

function cancellationError(reason?: unknown): Error {
  if (reason instanceof Error) return reason;
  const error = new Error("Tool execution was cancelled.");
  error.name = "AbortError";
  return error;
}

export function isToolTaskCancellation(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function validateLimits(limits: ToolExecutionLimits): void {
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be a positive number.`);
    }
  }
}

export class ToolExecutionLimiter {
  private active = 0;

  constructor(private readonly defaults = resolveToolExecutionLimits()) {
    validateLimits(defaults);
  }

  get activeCount(): number {
    return this.active;
  }

  async run<TResult>(
    task: (signal: AbortSignal) => TResult | Promise<TResult>,
    options: ToolTaskOptions = {},
  ): Promise<TResult> {
    const { signal: callerSignal, ...overrides } = options;
    const limits = { ...this.defaults, ...overrides };
    validateLimits(limits);
    if (callerSignal?.aborted) {
      throw cancellationError(callerSignal.reason);
    }
    if (this.active >= limits.maxConcurrency) {
      throw new ToolLimitError(
        "concurrency",
        `No more than ${limits.maxConcurrency} tool operations can run at once.`,
      );
    }

    this.active += 1;
    const controller = new AbortController();
    const abortFromCaller = () =>
      controller.abort(cancellationError(callerSignal?.reason));
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
    const timeout = globalThis.setTimeout(
      () =>
        controller.abort(
          new ToolLimitError(
            "timeout",
            `Tool execution exceeded the ${formatExecutionTime(limits.maxExecutionTime)} limit.`,
          ),
        ),
      limits.maxExecutionTime,
    );

    try {
      const result = await new Promise<TResult>((resolve, reject) => {
        const abort = () => reject(cancellationError(controller.signal.reason));
        controller.signal.addEventListener("abort", abort, { once: true });
        Promise.resolve()
          .then(() => task(controller.signal))
          .then(resolve, reject)
          .finally(() => controller.signal.removeEventListener("abort", abort));
      });
      assertToolOutputLimit(result, limits.maxOutputSize);
      return result;
    } finally {
      globalThis.clearTimeout(timeout);
      callerSignal?.removeEventListener("abort", abortFromCaller);
      this.active -= 1;
    }
  }
}

const sharedLimiter = new ToolExecutionLimiter();

export function runToolTask<TResult>(
  task: (signal: AbortSignal) => TResult | Promise<TResult>,
  definition?: Pick<
    ToolDefinition,
    "maxExecutionTime" | "maxOutputSize" | "maxConcurrency"
  >,
  signal?: AbortSignal,
): Promise<TResult> {
  return sharedLimiter.run(task, {
    ...resolveToolExecutionLimits(definition),
    signal,
  });
}

function workerError(reply: Extract<ToolWorkerReply, { ok: false }>): Error {
  const { error } = reply;
  if (error.code) return new ToolLimitError(error.code, error.message);
  const result = new Error(error.message);
  result.name = error.name;
  return result;
}

export function workerInputPayload(request: ToolWorkerRequest): unknown {
  switch (request.operation) {
    case "regex-test":
      return [request.pattern, request.input];
    case "diff":
      return [request.before, request.after];
    case "text-merge":
      return [request.first, request.second];
    case "archive-extract":
    case "archive-gzip":
    case "file-hash":
      return request.data;
    case "file-base64-encode":
      return request.data;
    case "archive-create-zip":
      return request.files.map(({ name, data }) => ({ name, data }));
    case "ssh-key":
      return [
        request.options.algorithm,
        request.options.size,
        request.options.comment,
        request.options.passphrase,
      ];
    default:
      return request.input;
  }
}

export function runToolWorker<TResult extends ToolWorkerResult>(
  request: ToolWorkerRequest,
  definition?: Pick<
    ToolDefinition,
    "maxInputSize" | "maxExecutionTime" | "maxOutputSize" | "maxConcurrency"
  >,
  signal?: AbortSignal,
): Promise<TResult> {
  const limits = resolveToolExecutionLimits(definition);
  assertToolInputLimit(
    workerInputPayload(request),
    definition?.maxInputSize ?? TOOL_LIMITS.text,
  );
  return runToolTask<TResult>(
    (taskSignal) =>
      new Promise<TResult>((resolve, reject) => {
        const worker = new Worker(
          new URL("../workers/tool-execution.worker.ts", import.meta.url),
          { type: "module", name: `devtoolbox-${request.operation}` },
        );
        const cleanup = () => {
          taskSignal.removeEventListener("abort", abort);
          worker.terminate();
        };
        const abort = () => {
          cleanup();
          reject(cancellationError(taskSignal.reason));
        };
        worker.onmessage = (event: MessageEvent<ToolWorkerReply>) => {
          cleanup();
          if (event.data.ok) resolve(event.data.result as TResult);
          else reject(workerError(event.data));
        };
        worker.onerror = (event) => {
          cleanup();
          reject(new Error(event.message || "Tool worker failed."));
        };
        worker.onmessageerror = () => {
          cleanup();
          reject(new Error("Tool worker returned an unreadable result."));
        };
        taskSignal.addEventListener("abort", abort, { once: true });
        const envelope: ToolWorkerEnvelope = {
          request,
          maxOutputSize: limits.maxOutputSize,
        };
        try {
          worker.postMessage(envelope, collectTransferables(request));
        } catch (error) {
          cleanup();
          reject(error);
        }
      }),
    definition,
    signal,
  );
}
