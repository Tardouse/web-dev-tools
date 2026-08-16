"use client";

import { useEffect, useState } from "react";
import { isToolTaskCancellation, runToolWorker } from "@/lib/tool-execution";
import type {
  ToolWorkerRequest,
  ToolWorkerResult,
} from "@/lib/tool-worker-protocol";
import type { ToolDefinition } from "@/lib/types";

interface LiveWorkerResult<TResult> {
  value: TResult | null;
  error: string;
}

export function useLiveWorkerResult<TResult extends ToolWorkerResult>(
  request: ToolWorkerRequest,
  definition?: ToolDefinition,
  delay = 80,
): LiveWorkerResult<TResult> {
  const [result, setResult] = useState<LiveWorkerResult<TResult>>({
    value: null,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResult((current) => ({ ...current, error: "" }));
      try {
        const value = await runToolWorker<TResult>(
          request,
          definition,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setResult({ value, error: "" });
        }
      } catch (caught) {
        if (isToolTaskCancellation(caught)) return;
        setResult({
          value: null,
          error:
            caught instanceof Error ? caught.message : "Tool worker failed.",
        });
      }
    }, delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [definition, delay, request]);

  return result;
}
