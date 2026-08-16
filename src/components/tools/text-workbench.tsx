"use client";

import { CircleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { byteLength, formatBytes, TOOL_LIMITS } from "@/lib/config";
import type { Messages } from "@/i18n";
import { localizeToolError } from "@/i18n/errors";
import {
  isToolTaskCancellation,
  runToolTask,
  runToolWorker,
} from "@/lib/tool-execution";
import type { ToolWorkerRequest } from "@/lib/tool-worker-protocol";
import type { ToolDefinition } from "@/lib/types";
import {
  ClearButton,
  CopyButton,
  DownloadButton,
  RunButton,
} from "./tool-actions";

interface TextWorkbenchProps {
  messages: Messages;
  title?: string;
  inputLabel?: string;
  outputLabel?: string;
  placeholder?: string;
  outputPlaceholder?: string;
  initialInput?: string;
  actionLabel?: string;
  filename?: string;
  definition?: ToolDefinition;
  transform?: (input: string) => string | Promise<string>;
  workerTask?: (input: string) => ToolWorkerRequest | null;
  options?: React.ReactNode;
}
export function TextWorkbench({
  messages,
  title,
  inputLabel,
  outputLabel,
  placeholder,
  outputPlaceholder,
  initialInput = "",
  actionLabel,
  filename = "result.txt",
  definition,
  transform,
  workerTask,
  options,
}: TextWorkbenchProps) {
  const maxInputSize = definition?.maxInputSize ?? TOOL_LIMITS.text;
  const resolvedTitle = title ?? messages.common.workspace;
  const resolvedInput = inputLabel ?? messages.common.input;
  const resolvedOutput = outputLabel ?? messages.common.output;
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const execution = useRef<AbortController | null>(null);
  useEffect(() => () => execution.current?.abort(), []);
  const run = useCallback(async () => {
    execution.current?.abort();
    const controller = new AbortController();
    execution.current = controller;
    setRunning(true);
    setError("");
    const inputSize = byteLength(input);
    if (inputSize > maxInputSize) {
      setOutput("");
      setError(
        localizeToolError(
          `Input is ${formatBytes(inputSize)}. The limit for this tool is ${formatBytes(maxInputSize)}.`,
          messages,
        ),
      );
      execution.current = null;
      setRunning(false);
      return;
    }
    try {
      const request = workerTask?.(input);
      const result = request
        ? await runToolWorker<string>(request, definition, controller.signal)
        : await runToolTask(
            () => {
              if (!transform) throw new Error("Tool operation is unavailable.");
              return transform(input);
            },
            definition,
            controller.signal,
          );
      if (!controller.signal.aborted) setOutput(result);
    } catch (caught) {
      if (isToolTaskCancellation(caught)) return;
      setOutput("");
      setError(
        caught instanceof Error
          ? localizeToolError(caught.message, messages)
          : messages.workbench.operationFailed,
      );
    } finally {
      if (execution.current === controller) {
        execution.current = null;
        setRunning(false);
      }
    }
  }, [definition, input, maxInputSize, messages, transform, workerTask]);
  const clear = () => {
    execution.current?.abort();
    execution.current = null;
    setRunning(false);
    setInput("");
    setOutput("");
    setError("");
  };
  return (
    <section className="tool-workspace card" aria-label={resolvedTitle}>
      <div className="workspace-header">
        <h2>{resolvedTitle}</h2>
        <div className="workspace-actions">
          {options}
          <ClearButton onClick={clear} messages={messages} />
          <CopyButton value={output} messages={messages} />
          <DownloadButton
            value={output}
            filename={filename}
            messages={messages}
          />
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}
      <div className="workspace-grid">
        <div className="workspace-panel">
          <div className="panel-label">
            <span>{resolvedInput}</span>
            <span>
              {formatBytes(byteLength(input))} / {formatBytes(maxInputSize)}
            </span>
          </div>
          <textarea
            className="editor"
            spellCheck={false}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder ?? messages.workbench.placeholder}
            aria-label={resolvedInput}
          />
        </div>
        <div className="workspace-panel">
          <div className="panel-label">
            <span>{resolvedOutput}</span>
            <span>{formatBytes(byteLength(output))}</span>
          </div>
          <pre
            className="editor editor-output"
            data-placeholder={
              outputPlaceholder ?? messages.workbench.outputPlaceholder
            }
            aria-live="polite"
          >
            {output}
          </pre>
        </div>
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.common.localBrowser}
        </span>
        <RunButton
          onClick={run}
          label={
            running
              ? messages.common.working
              : (actionLabel ?? messages.common.run)
          }
          disabled={running}
        />
      </div>
    </section>
  );
}
