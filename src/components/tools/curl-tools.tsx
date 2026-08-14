"use client";

import { useMemo, useState } from "react";
import { CircleAlert } from "lucide-react";
import type { ToolComponentProps } from "@/lib/types";
import { localizeToolError } from "@/i18n/errors";
import { interpolate } from "@/i18n";
import {
  generateCurl,
  generateFetch,
  parseCurl,
  type CurlRequest,
} from "@/lib/tools";
import { CopyButton } from "./tool-actions";

export function CurlParserTool({ messages }: ToolComponentProps) {
  const [input, setInput] = useState(
    "curl -X POST 'https://api.example.com/v1/items' -H 'Content-Type: application/json' -d '{\"name\":\"demo\"}'",
  );
  const result = useMemo(() => {
    try {
      return { value: parseCurl(input), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Parse failed.",
      };
    }
  }, [input]);
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <h2>{messages.tool.curlParser}</h2>
      </div>
      {result.error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {localizeToolError(result.error, messages)}
        </div>
      )}
      <textarea
        className="editor"
        style={{ minHeight: 210 }}
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="panel-label">{messages.tool.parsedRequest}</div>
      {result.value && (
        <div className="parse-grid">
          {Object.entries({
            [messages.common.method]: result.value.method,
            URL: result.value.url,
            [messages.common.headers]: JSON.stringify(
              result.value.headers,
              null,
              2,
            ),
            [messages.common.body]: result.value.data || "—",
          }).map(([key, value]) => (
            <>
              <div className="parse-key" key={`${key}-key`}>
                {key}
              </div>
              <pre
                className="mono"
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
                key={key}
              >
                {value}
              </pre>
            </>
          ))}
        </div>
      )}
    </section>
  );
}

export function CurlGeneratorTool({ messages }: ToolComponentProps) {
  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("https://api.example.com/v1/items");
  const [headerName, setHeaderName] = useState("Content-Type");
  const [headerValue, setHeaderValue] = useState("application/json");
  const [body, setBody] = useState('{"name":"demo"}');
  const [format, setFormat] = useState<"curl" | "fetch">("curl");
  const output = useMemo(() => {
    const request: CurlRequest = {
      method,
      url,
      headers: headerName.trim() ? { [headerName]: headerValue } : {},
      data: body,
    };
    try {
      return {
        value:
          format === "curl" ? generateCurl(request) : generateFetch(request),
        error: "",
      };
    } catch (error) {
      return {
        value: "",
        error: error instanceof Error ? error.message : "Generation failed.",
      };
    }
  }, [method, url, headerName, headerValue, body, format]);
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <h2>{messages.tool.requestBuilder}</h2>
        <div className="workspace-actions">
          <div className="segmented">
            <button
              aria-pressed={format === "curl"}
              onClick={() => setFormat("curl")}
            >
              cURL
            </button>
            <button
              aria-pressed={format === "fetch"}
              onClick={() => setFormat("fetch")}
            >
              Fetch
            </button>
          </div>
          <CopyButton messages={messages} value={output.value} />
        </div>
      </div>
      {output.error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {localizeToolError(output.error, messages)}
        </div>
      )}
      <div className="curl-form">
        <div className="form-row">
          <label className="field">
            <span>{messages.common.method}</span>
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            >
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{messages.common.url}</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>{messages.tool.headerName}</span>
            <input
              value={headerName}
              onChange={(event) => setHeaderName(event.target.value)}
            />
          </label>
          <label className="field">
            <span>{messages.tool.headerValue}</span>
            <input
              value={headerValue}
              onChange={(event) => setHeaderValue(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>{messages.tool.requestBody}</span>
          <textarea
            rows={6}
            className="mono"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
      </div>
      <div className="panel-label">
        {interpolate(messages.tool.generated, {
          format: format === "curl" ? "cURL" : "JavaScript fetch",
        })}
      </div>
      <pre className="editor editor-output" style={{ minHeight: 210 }}>
        {output.value}
      </pre>
    </section>
  );
}
