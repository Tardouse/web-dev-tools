"use client";

import { CircleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { byteLength, formatBytes } from "@/lib/config";
import {
  buildHttpHeaders,
  renderHttpHeaders,
  type AuthenticationMode,
  type HeaderOutputFormat,
} from "@/lib/tools/http-workbench";
import type { ToolComponentProps } from "@/lib/types";
import { CopyButton } from "./tool-actions";

export function HttpHeaderBuilderTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [accept, setAccept] = useState("application/json");
  const [contentType, setContentType] = useState("application/json");
  const [customHeaders, setCustomHeaders] = useState("X-Request-ID: demo-123");
  const [authentication, setAuthentication] =
    useState<AuthenticationMode>("bearer");
  const [token, setToken] = useState("demo-token");
  const [username, setUsername] = useState("api-user");
  const [password, setPassword] = useState("change-me");
  const [apiKeyName, setApiKeyName] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("demo-key");
  const [format, setFormat] = useState<HeaderOutputFormat>("lines");
  const maxInputSize = definition?.maxInputSize ?? 1024 * 1024;
  const result = useMemo(() => {
    const rawInput = [
      accept,
      contentType,
      customHeaders,
      token,
      username,
      password,
      apiKeyName,
      apiKeyValue,
    ].join("\n");
    const size = byteLength(rawInput);
    if (size > maxInputSize) {
      return {
        output: "",
        error: zh
          ? `输入大小为 ${formatBytes(size)}，此工具的上限为 ${formatBytes(maxInputSize)}。`
          : `Input is ${formatBytes(size)}. The limit is ${formatBytes(maxInputSize)}.`,
      };
    }
    try {
      return {
        output: renderHttpHeaders(
          buildHttpHeaders({
            accept,
            contentType,
            customHeaders,
            authentication,
            token,
            username,
            password,
            apiKeyName,
            apiKeyValue,
          }),
          format,
        ),
        error: "",
      };
    } catch (error) {
      return {
        output: "",
        error: error instanceof Error ? error.message : "Header generation failed.",
      };
    }
  }, [
    accept,
    apiKeyName,
    apiKeyValue,
    authentication,
    contentType,
    customHeaders,
    format,
    maxInputSize,
    password,
    token,
    username,
    zh,
  ]);
  const authenticationLabels: Record<AuthenticationMode, string> = {
    none: zh ? "无认证" : "No auth",
    bearer: "Bearer",
    basic: "Basic Auth",
    "api-key": "API Key",
  };
  return (
    <section className="tool-workspace card header-builder-workbench">
      <div className="workspace-header">
        <h2>{zh ? "HTTP Header 与认证生成器" : "HTTP header & auth builder"}</h2>
        <div className="workspace-actions">
          <label className="field inline compact-tool-option">
            <span className="sr-only">{zh ? "输出格式" : "Output format"}</span>
            <select
              aria-label={zh ? "输出格式" : "Output format"}
              value={format}
              onChange={(event) => setFormat(event.target.value as HeaderOutputFormat)}
            >
              <option value="lines">Header Lines</option>
              <option value="json">JSON</option>
              <option value="fetch">Fetch</option>
            </select>
          </label>
          <CopyButton value={result.output} messages={messages} />
        </div>
      </div>
      <div className="developer-toolbar" role="group" aria-label={zh ? "认证方式" : "Authentication method"}>
        {(Object.keys(authenticationLabels) as AuthenticationMode[]).map((mode) => (
          <button
            type="button"
            aria-pressed={authentication === mode}
            className={authentication === mode ? "is-active" : ""}
            onClick={() => setAuthentication(mode)}
            key={mode}
          >
            {authenticationLabels[mode]}
          </button>
        ))}
      </div>
      <div className="header-builder-grid">
        <label className="field">
          <span className="field-label">Accept</span>
          <select aria-label="Accept" value={accept} onChange={(event) => setAccept(event.target.value)}>
            <option value="application/json">application/json</option>
            <option value="text/html">text/html</option>
            <option value="application/xml">application/xml</option>
            <option value="*/*">*/*</option>
            <option value="">{zh ? "不生成" : "Omit"}</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Content-Type</span>
          <select aria-label="Content-Type" value={contentType} onChange={(event) => setContentType(event.target.value)}>
            <option value="application/json">application/json</option>
            <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
            <option value="text/plain; charset=utf-8">text/plain; charset=utf-8</option>
            <option value="application/xml">application/xml</option>
            <option value="">{zh ? "不生成" : "Omit"}</option>
          </select>
        </label>
        {authentication === "bearer" && (
          <label className="field header-field-wide">
            <span className="field-label">Bearer Token</span>
            <input aria-label="Bearer Token" value={token} onChange={(event) => setToken(event.target.value)} />
          </label>
        )}
        {authentication === "basic" && (
          <>
            <label className="field">
              <span className="field-label">{zh ? "用户名" : "Username"}</span>
              <input aria-label={zh ? "用户名" : "Username"} value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">{zh ? "密码" : "Password"}</span>
              <input aria-label={zh ? "密码" : "Password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
          </>
        )}
        {authentication === "api-key" && (
          <>
            <label className="field">
              <span className="field-label">{zh ? "Header 名称" : "Header name"}</span>
              <input aria-label={zh ? "API Key Header 名称" : "API key header name"} value={apiKeyName} onChange={(event) => setApiKeyName(event.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">{zh ? "API Key 值" : "API key value"}</span>
              <input aria-label={zh ? "API Key 值" : "API key value"} value={apiKeyValue} onChange={(event) => setApiKeyValue(event.target.value)} />
            </label>
          </>
        )}
        <label className="field header-field-wide">
          <span className="field-label">{zh ? "自定义 Headers（每行一个）" : "Custom headers (one per line)"}</span>
          <textarea aria-label={zh ? "自定义 Headers" : "Custom headers"} value={customHeaders} onChange={(event) => setCustomHeaders(event.target.value)} />
        </label>
      </div>
      {result.error && <div className="error-banner" role="alert"><CircleAlert size={17} /><span>{result.error}</span></div>}
      <div className="panel-label">{zh ? "生成结果" : "Generated headers"}</div>
      <pre className="editor editor-output header-builder-output" aria-live="polite">{result.output}</pre>
    </section>
  );
}
