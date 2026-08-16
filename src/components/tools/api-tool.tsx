"use client";

import { CircleAlert, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { byteLength, formatBytes, TOOL_LIMITS } from "@/lib/config";
import { localizeToolError } from "@/i18n/errors";
import { isToolTaskCancellation, runToolTask } from "@/lib/tool-execution";
import { assertToolOutputLimit } from "@/lib/tool-limits";
import { sendBrowserRequest } from "@/lib/tools/browser-request";
import {
  generateApiSnippet,
  parseHeaderLines,
  type ApiRequestConfig,
} from "@/lib/tools/developer-tools";
import type { ToolComponentProps } from "@/lib/types";
import { ActionButton, CopyButton } from "./tool-actions";

export function ApiRequestBuilderTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("https://api.example.test/v1/items");
  const [headerLines, setHeaderLines] = useState(
    "Content-Type: application/json",
  );
  const [body, setBody] = useState('{"name":"demo"}');
  const [format, setFormat] = useState<"curl" | "fetch" | "axios">("curl");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<{
    status: string;
    duration: number;
    headers: string;
    body: string;
  } | null>(null);
  const execution = useRef<AbortController | null>(null);
  const inputLimit = definition?.maxInputSize ?? 1024 * 1024;
  useEffect(() => () => execution.current?.abort(), []);
  const config = useMemo(() => {
    const inputSize =
      byteLength(url) + byteLength(headerLines) + byteLength(body);
    if (inputSize > inputLimit) {
      return {
        value: null,
        snippet: "",
        error: localizeToolError(
          `Input is ${formatBytes(inputSize)}. The limit for this tool is ${formatBytes(inputLimit)}.`,
          messages,
        ),
      };
    }
    try {
      const value: ApiRequestConfig = {
        method,
        url,
        headers: parseHeaderLines(headerLines),
        body,
      };
      const snippet = generateApiSnippet(value, format);
      assertToolOutputLimit(
        snippet,
        definition?.maxOutputSize ?? TOOL_LIMITS.maxOutput,
      );
      return { value, snippet, error: "" };
    } catch (caught) {
      return {
        value: null,
        snippet: "",
        error:
          caught instanceof Error
            ? localizeToolError(caught.message, messages)
            : "Invalid request.",
      };
    }
  }, [
    body,
    definition,
    format,
    headerLines,
    inputLimit,
    messages,
    method,
    url,
  ]);
  const send = async () => {
    if (!config.value) return;
    execution.current?.abort();
    const controller = new AbortController();
    execution.current = controller;
    setPending(true);
    setError("");
    setResponse(null);
    try {
      const result = await runToolTask(
        (signal) =>
          sendBrowserRequest(config.value!, {
            signal,
            timeoutMs: null,
            maxResponseBytes: definition?.maxOutputSize,
          }),
        definition,
        controller.signal,
      );
      if (!controller.signal.aborted) setResponse(result);
    } catch (caught) {
      if (isToolTaskCancellation(caught)) return;
      setError(
        caught instanceof Error
          ? localizeToolError(caught.message, messages)
          : "Request failed.",
      );
    } finally {
      if (execution.current === controller) {
        execution.current = null;
        setPending(false);
      }
    }
  };
  return (
    <section className="tool-workspace card api-workbench">
      <div className="workspace-header">
        <h2>{zh ? "API 请求工作台" : "API request workbench"}</h2>
        <div className="workspace-actions">
          <label className="field inline compact-tool-option">
            <span className="sr-only">{zh ? "代码格式" : "Code format"}</span>
            <select
              aria-label={zh ? "代码格式" : "Code format"}
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as typeof format)
              }
            >
              <option value="curl">cURL</option>
              <option value="fetch">Fetch</option>
              <option value="axios">Axios</option>
            </select>
          </label>
          <CopyButton value={config.snippet} messages={messages} />
        </div>
      </div>
      {(error || config.error) && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          {error || config.error}
        </div>
      )}
      <div className="api-request-line">
        <label className="field">
          <span className="sr-only">{zh ? "请求方法" : "Request method"}</span>
          <select
            aria-label={zh ? "请求方法" : "Request method"}
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="field api-url-field">
          <span className="sr-only">URL</span>
          <input
            aria-label="URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </label>
        <ActionButton
          onClick={send}
          icon={Send}
          primary
          disabled={pending || !config.value}
        >
          {pending ? (zh ? "发送中…" : "Sending…") : zh ? "发送" : "Send"}
        </ActionButton>
      </div>
      <div className="api-editor-grid">
        <label className="workspace-panel">
          <span className="panel-label">
            {zh ? "Headers（每行一个）" : "Headers (one per line)"}
          </span>
          <textarea
            className="editor api-editor"
            aria-label="Headers"
            value={headerLines}
            onChange={(event) => setHeaderLines(event.target.value)}
          />
        </label>
        <label className="workspace-panel">
          <span className="panel-label">
            {zh ? "请求 Body" : "Request body"}
          </span>
          <textarea
            className="editor api-editor"
            aria-label={zh ? "请求 Body" : "Request body"}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={["GET", "HEAD"].includes(method)}
          />
        </label>
      </div>
      <div className="panel-label">{format.toUpperCase()}</div>
      <pre className="editor editor-output api-code-output">
        {config.snippet}
      </pre>
      {response && (
        <div className="api-response">
          <div className="api-response-meta">
            <span className="badge badge-success">{response.status}</span>
            <span>{response.duration} ms</span>
            <span>{formatBytes(byteLength(response.body))}</span>
          </div>
          <div className="api-editor-grid">
            <pre className="editor editor-output api-editor">
              {response.headers}
            </pre>
            <pre
              className="editor editor-output api-editor"
              aria-label={zh ? "响应 Body" : "Response body"}
            >
              {response.body}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
