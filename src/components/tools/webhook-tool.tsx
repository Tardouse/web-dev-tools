"use client";

import { AlignLeft, CircleAlert, Minimize2, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { byteLength, formatBytes } from "@/lib/config";
import { localizeToolError } from "@/i18n/errors";
import { sendBrowserRequest, type BrowserResponseResult } from "@/lib/tools/browser-request";
import { generateApiSnippet, parseHeaderLines, type ApiRequestConfig } from "@/lib/tools/developer-tools";
import { formatWebhookPayload } from "@/lib/tools/http-workbench";
import type { ToolComponentProps } from "@/lib/types";
import { ActionButton, CopyButton } from "./tool-actions";

export function WebhookTesterTool({ definition, locale, messages }: ToolComponentProps) {
  const zh = locale === "zh";
  const [url, setUrl] = useState("https://hooks.example.test/events");
  const [headerLines, setHeaderLines] = useState("Content-Type: application/json\nX-Event-Type: order.created");
  const [payload, setPayload] = useState('{"event":"order.created","data":{"id":42,"status":"paid"}}');
  const [format, setFormat] = useState<"curl" | "fetch" | "axios">("curl");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<BrowserResponseResult | null>(null);
  const inputLimit = definition?.maxInputSize ?? 1024 * 1024;
  const config = useMemo(() => {
    const size = byteLength(payload);
    if (size > inputLimit) {
      return {
        value: null,
        snippet: "",
        error: zh
          ? `Payload 大小为 ${formatBytes(size)}，此工具的上限为 ${formatBytes(inputLimit)}。`
          : `Payload is ${formatBytes(size)}. The limit is ${formatBytes(inputLimit)}.`,
      };
    }
    try {
      const value: ApiRequestConfig = {
        method: "POST",
        url,
        headers: parseHeaderLines(headerLines),
        body: payload,
      };
      return {
        value,
        snippet: generateApiSnippet(value, format),
        error: "",
      };
    } catch (caught) {
      return {
        value: null,
        snippet: "",
        error: caught instanceof Error ? caught.message : "Invalid webhook request.",
      };
    }
  }, [format, headerLines, inputLimit, payload, url, zh]);
  const transformPayload = (compact: boolean) => {
    setError("");
    const size = byteLength(payload);
    if (size > inputLimit) {
      setError(
        zh
          ? `Payload 大小为 ${formatBytes(size)}，此工具的上限为 ${formatBytes(inputLimit)}。`
          : `Payload is ${formatBytes(size)}. The limit is ${formatBytes(inputLimit)}.`,
      );
      return;
    }
    try {
      setPayload(formatWebhookPayload(payload, compact));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? localizeToolError(caught.message, messages)
          : messages.workbench.operationFailed,
      );
    }
  };
  const send = async () => {
    if (!config.value) return;
    setPending(true);
    setError("");
    setResponse(null);
    try {
      setResponse(await sendBrowserRequest(config.value));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed.");
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="tool-workspace card webhook-workbench">
      <div className="workspace-header">
        <h2>{zh ? "Webhook Payload 与请求测试" : "Webhook payload & request tester"}</h2>
        <div className="workspace-actions">
          <label className="field inline compact-tool-option">
            <span className="sr-only">{zh ? "代码格式" : "Code format"}</span>
            <select aria-label={zh ? "代码格式" : "Code format"} value={format} onChange={(event) => setFormat(event.target.value as typeof format)}>
              <option value="curl">cURL</option>
              <option value="fetch">Fetch</option>
              <option value="axios">Axios</option>
            </select>
          </label>
          <CopyButton value={config.snippet} messages={messages} />
        </div>
      </div>
      {(error || config.error) && <div className="error-banner" role="alert"><CircleAlert size={17} /><span>{error || config.error}</span></div>}
      <div className="webhook-request-line">
        <label className="field api-url-field">
          <span className="sr-only">Webhook URL</span>
          <input aria-label="Webhook URL" value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} />
        </label>
        <ActionButton onClick={send} icon={Send} primary disabled={pending || !config.value}>
          {pending ? (zh ? "发送中…" : "Sending…") : zh ? "发送 Webhook" : "Send webhook"}
        </ActionButton>
      </div>
      <div className="api-editor-grid">
        <label className="workspace-panel">
          <span className="panel-label">Headers</span>
          <textarea className="editor api-editor" aria-label="Headers" value={headerLines} onChange={(event) => { setHeaderLines(event.target.value); setError(""); }} />
        </label>
        <div className="workspace-panel">
          <span className="panel-label webhook-payload-label">
            <span>Payload</span>
            <span className="workspace-actions">
              <ActionButton onClick={() => transformPayload(false)} icon={AlignLeft}>{zh ? "格式化" : "Format"}</ActionButton>
              <ActionButton onClick={() => transformPayload(true)} icon={Minimize2}>{zh ? "压缩" : "Minify"}</ActionButton>
            </span>
          </span>
          <textarea className="editor api-editor" aria-label="Payload" value={payload} onChange={(event) => { setPayload(event.target.value); setError(""); }} />
        </div>
      </div>
      <div className="panel-label">{format.toUpperCase()}</div>
      <pre className="editor editor-output api-code-output">{config.snippet}</pre>
      {response && (
        <div className="api-response">
          <div className="api-response-meta"><span className="badge badge-success">{response.status}</span><span>{response.duration} ms</span><span>{formatBytes(byteLength(response.body))}</span></div>
          <div className="api-editor-grid"><pre className="editor editor-output api-editor">{response.headers}</pre><pre className="editor editor-output api-editor" aria-label={zh ? "响应 Body" : "Response body"}>{response.body}</pre></div>
        </div>
      )}
    </section>
  );
}
