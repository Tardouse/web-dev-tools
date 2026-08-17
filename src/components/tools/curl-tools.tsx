"use client";

import { Fragment, useMemo, useState } from "react";
import { CircleAlert, Plus, Trash2 } from "lucide-react";
import { localizeToolError } from "@/i18n/errors";
import { TOOL_LIMITS } from "@/lib/config";
import type { ToolWorkerRequest } from "@/lib/tool-worker-protocol";
import type {
  CurlAuth,
  CurlBody,
  CurlBodyField,
  CurlBodyType,
  CurlEntry,
  CurlOutputFormat,
  CurlRequest,
} from "@/lib/tools/curl";
import { CURL_OUTPUT_FORMATS } from "@/lib/tools/curl";
import type { ToolComponentProps } from "@/lib/types";
import {
  ActionButton,
  ClearButton,
  CopyButton,
  DownloadButton,
} from "./tool-actions";
import { useLiveWorkerResult } from "./use-live-worker-result";

const CURL_LABELS = {
  en: {
    command: "cURL command",
    query: "Query",
    cookies: "Cookies",
    auth: "Authentication",
    none: "None",
    raw: "Raw",
    urlEncoded: "URL-encoded",
    multipart: "Multipart",
    basic: "Basic Auth",
    bearer: "Bearer Token",
    username: "Username",
    password: "Password",
    token: "Token",
    name: "Name",
    value: "Value",
    type: "Type",
    text: "Text",
    file: "File",
    filePath: "File path",
    contentType: "Content type",
    addHeader: "Add header",
    addQuery: "Add parameter",
    addCookie: "Add cookie",
    addField: "Add field",
    removeHeader: "Remove header",
    removeQuery: "Remove parameter",
    removeCookie: "Remove cookie",
    removeField: "Remove field",
    bodyType: "Request body type",
    outputFormat: "Output format",
    requestSections: "Request sections",
    parserOutput: "Parsed request JSON",
  },
  zh: {
    command: "cURL 命令",
    query: "查询参数",
    cookies: "Cookie",
    auth: "身份认证",
    none: "无",
    raw: "原始文本",
    urlEncoded: "URL 编码表单",
    multipart: "Multipart 表单",
    basic: "Basic Auth",
    bearer: "Bearer Token",
    username: "用户名",
    password: "密码",
    token: "令牌",
    name: "名称",
    value: "值",
    type: "类型",
    text: "文本",
    file: "文件",
    filePath: "文件路径",
    contentType: "内容类型",
    addHeader: "添加请求头",
    addQuery: "添加查询参数",
    addCookie: "添加 Cookie",
    addField: "添加字段",
    removeHeader: "删除请求头",
    removeQuery: "删除查询参数",
    removeCookie: "删除 Cookie",
    removeField: "删除字段",
    bodyType: "请求体类型",
    outputFormat: "输出格式",
    requestSections: "请求配置分区",
    parserOutput: "解析后的请求 JSON",
  },
} as const;

const FORMAT_LABELS: Record<CurlOutputFormat, string> = {
  curl: "cURL",
  fetch: "JavaScript fetch",
  axios: "Axios",
  "python-requests": "Python requests",
  "python-httpx": "Python httpx",
  go: "Go HTTP",
  php: "PHP cURL",
  java: "Java HttpClient",
  csharp: "C# HttpClient",
  xhr: "XMLHttpRequest",
};

const FORMAT_EXTENSIONS: Record<CurlOutputFormat, string> = {
  curl: "sh",
  fetch: "js",
  axios: "js",
  "python-requests": "py",
  "python-httpx": "py",
  go: "go",
  php: "php",
  java: "java",
  csharp: "cs",
  xhr: "js",
};

type CurlLabels = (typeof CURL_LABELS)["en"] | (typeof CURL_LABELS)["zh"];
type RequestSection = "headers" | "query" | "cookies" | "auth" | "body";
type EntrySection = "headers" | "query" | "cookies";

function initialRequest(): CurlRequest {
  return {
    method: "POST",
    url: "https://api.example.com/v1/items",
    headers: [
      { name: "Content-Type", value: "application/json" },
      { name: "Accept", value: "application/json" },
    ],
    query: [{ name: "draft", value: "true" }],
    cookies: [],
    auth: { type: "none", username: "", password: "", token: "" },
    body: { type: "raw", text: '{"name":"demo"}', fields: [] },
  };
}

function ParsedEntries({
  entries,
  emptyLabel,
}: {
  entries: CurlEntry[];
  emptyLabel: string;
}) {
  if (!entries.length) return <span className="muted">{emptyLabel}</span>;
  return (
    <div className="curl-parsed-list">
      {entries.map((entry, index) => (
        <div className="curl-parsed-entry" key={`${entry.name}-${index}`}>
          <code>{entry.name || "(empty)"}</code>
          <code>{entry.value}</code>
        </div>
      ))}
    </div>
  );
}

function ParsedBody({ body, labels }: { body: CurlBody; labels: CurlLabels }) {
  if (body.type === "none") return <span className="muted">{labels.none}</span>;
  if (body.type === "raw") {
    return (
      <div className="curl-parsed-body">
        <span className="badge">{labels.raw}</span>
        <pre>{body.text}</pre>
      </div>
    );
  }
  return (
    <div className="curl-parsed-body">
      <span className="badge">
        {body.type === "multipart" ? labels.multipart : labels.urlEncoded}
      </span>
      <div className="curl-parsed-list">
        {body.fields.map((field, index) => (
          <div className="curl-parsed-entry" key={`${field.name}-${index}`}>
            <code>{field.name || "(empty)"}</code>
            <code>
              {field.kind === "file" ? `${labels.file}: ` : ""}
              {field.value}
              {field.contentType ? ` (${field.contentType})` : ""}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParsedAuth({ auth, labels }: { auth: CurlAuth; labels: CurlLabels }) {
  if (auth.type === "none") return <span className="muted">{labels.none}</span>;
  return (
    <div className="curl-parsed-auth">
      <span className="badge">
        {auth.type === "basic" ? labels.basic : labels.bearer}
      </span>
      <code>
        {auth.type === "basic"
          ? `${auth.username}:${auth.password}`
          : auth.token}
      </code>
    </div>
  );
}

function EntryEditor({
  entries,
  nameLabel,
  valueLabel,
  addLabel,
  removeLabel,
  onChange,
  onAdd,
  onRemove,
}: {
  entries: CurlEntry[];
  nameLabel: string;
  valueLabel: string;
  addLabel: string;
  removeLabel: string;
  onChange: (index: number, field: keyof CurlEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="curl-entry-editor">
      <div className="curl-entry-heading" aria-hidden="true">
        <span>{nameLabel}</span>
        <span>{valueLabel}</span>
      </div>
      <div className="curl-entry-list">
        {entries.map((entry, index) => (
          <div className="curl-entry-row" key={index}>
            <label className="field">
              <span className="curl-entry-field-label" aria-hidden="true">
                {nameLabel}
              </span>
              <input
                aria-label={`${nameLabel} ${index + 1}`}
                value={entry.name}
                onChange={(event) =>
                  onChange(index, "name", event.target.value)
                }
              />
            </label>
            <label className="field">
              <span className="curl-entry-field-label" aria-hidden="true">
                {valueLabel}
              </span>
              <input
                aria-label={`${valueLabel} ${index + 1}`}
                value={entry.value}
                onChange={(event) =>
                  onChange(index, "value", event.target.value)
                }
              />
            </label>
            <button
              type="button"
              className="icon-button subtle curl-entry-remove"
              aria-label={`${removeLabel} ${index + 1}`}
              title={`${removeLabel} ${index + 1}`}
              onClick={() => onRemove(index)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <ActionButton
        icon={Plus}
        disabled={entries.length >= TOOL_LIMITS.maxCurlEntries}
        onClick={onAdd}
      >
        {addLabel}
      </ActionButton>
    </div>
  );
}

function BodyFieldEditor({
  fields,
  labels,
  allowFiles,
  onChange,
  onAdd,
  onRemove,
}: {
  fields: CurlBodyField[];
  labels: CurlLabels;
  allowFiles: boolean;
  onChange: (index: number, field: keyof CurlBodyField, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="curl-entry-editor">
      <div className="curl-body-field-list">
        {fields.map((field, index) => (
          <div
            className={`curl-body-field-row${allowFiles ? "" : " curl-body-field-row-simple"}`}
            key={index}
          >
            {allowFiles && (
              <label className="field curl-body-kind">
                <span>{labels.type}</span>
                <select
                  aria-label={`${labels.type} ${index + 1}`}
                  value={field.kind}
                  onChange={(event) =>
                    onChange(index, "kind", event.target.value)
                  }
                >
                  <option value="text">{labels.text}</option>
                  <option value="file">{labels.file}</option>
                </select>
              </label>
            )}
            <label className="field">
              <span>{labels.name}</span>
              <input
                aria-label={`${labels.name} ${index + 1}`}
                value={field.name}
                onChange={(event) =>
                  onChange(index, "name", event.target.value)
                }
              />
            </label>
            <label className="field">
              <span>
                {field.kind === "file" ? labels.filePath : labels.value}
              </span>
              <input
                aria-label={`${field.kind === "file" ? labels.filePath : labels.value} ${index + 1}`}
                value={field.value}
                onChange={(event) =>
                  onChange(index, "value", event.target.value)
                }
              />
            </label>
            {allowFiles && field.kind === "file" && (
              <label className="field curl-body-content-type">
                <span>{labels.contentType}</span>
                <input
                  aria-label={`${labels.contentType} ${index + 1}`}
                  value={field.contentType ?? ""}
                  onChange={(event) =>
                    onChange(index, "contentType", event.target.value)
                  }
                />
              </label>
            )}
            <button
              type="button"
              className="icon-button subtle curl-entry-remove"
              aria-label={`${labels.removeField} ${index + 1}`}
              title={`${labels.removeField} ${index + 1}`}
              onClick={() => onRemove(index)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <ActionButton
        icon={Plus}
        disabled={fields.length >= TOOL_LIMITS.maxCurlEntries}
        onClick={onAdd}
      >
        {labels.addField}
      </ActionButton>
    </div>
  );
}

export function CurlParserTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const labels = CURL_LABELS[locale];
  const [input, setInput] = useState(
    "curl --request POST 'https://api.example.com/v1/items?draft=true' --header 'Content-Type: application/json' --header 'Accept: application/json' --oauth2-bearer 'demo-token' --cookie 'theme=dark; session=demo' --data-raw '{\"name\":\"demo\"}'",
  );
  const workerRequest = useMemo<ToolWorkerRequest>(
    () => ({ operation: "curl-parse", input }),
    [input],
  );
  const result = useLiveWorkerResult<CurlRequest>(workerRequest, definition);
  const json = result.value ? JSON.stringify(result.value, null, 2) : "";
  const rows = result.value
    ? [
        [
          messages.common.method,
          <code key="method">{result.value.method}</code>,
        ],
        [messages.common.url, <code key="url">{result.value.url}</code>],
        [
          messages.common.headers,
          <ParsedEntries
            emptyLabel={labels.none}
            entries={result.value.headers}
            key="headers"
          />,
        ],
        [
          labels.query,
          <ParsedEntries
            emptyLabel={labels.none}
            entries={result.value.query}
            key="query"
          />,
        ],
        [
          labels.cookies,
          <ParsedEntries
            emptyLabel={labels.none}
            entries={result.value.cookies}
            key="cookies"
          />,
        ],
        [
          labels.auth,
          <ParsedAuth auth={result.value.auth} labels={labels} key="auth" />,
        ],
        [
          messages.common.body,
          <ParsedBody body={result.value.body} labels={labels} key="body" />,
        ],
      ]
    : [];

  return (
    <section className="tool-workspace card curl-parser-workspace">
      <div className="workspace-header">
        <h2>{messages.tool.curlParser}</h2>
        <div className="workspace-actions">
          <CopyButton messages={messages} value={json} />
          <DownloadButton
            value={json}
            filename="parsed-curl-request.json"
            messages={messages}
            type="application/json"
          />
        </div>
      </div>
      {result.error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{localizeToolError(result.error, messages)}</span>
        </div>
      )}
      <label className="panel-label" htmlFor="curl-command-input">
        {labels.command}
      </label>
      <textarea
        id="curl-command-input"
        className="editor curl-command-input"
        aria-label={labels.command}
        spellCheck={false}
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="panel-label">{messages.tool.parsedRequest}</div>
      <div className="parse-grid" aria-label={labels.parserOutput}>
        {rows.map(([key, value]) => (
          <Fragment key={String(key)}>
            <div className="parse-key">{key}</div>
            <div className="curl-parse-value">{value}</div>
          </Fragment>
        ))}
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.common.localBrowser}
        </span>
      </div>
    </section>
  );
}

export function CurlGeneratorTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const labels = CURL_LABELS[locale];
  const [request, setRequest] = useState<CurlRequest>(initialRequest);
  const [format, setFormat] = useState<CurlOutputFormat>("curl");
  const [section, setSection] = useState<RequestSection>("headers");
  const workerRequest = useMemo<ToolWorkerRequest>(
    () => ({ operation: "curl-generate", request, format }),
    [format, request],
  );
  const output = useLiveWorkerResult<string>(workerRequest, definition);

  const sectionLabels: Record<RequestSection, string> = {
    headers: messages.common.headers,
    query: labels.query,
    cookies: labels.cookies,
    auth: labels.auth,
    body: messages.common.body,
  };

  const updateEntries = (
    target: EntrySection,
    index: number,
    field: keyof CurlEntry,
    value: string,
  ) => {
    setRequest((current) => ({
      ...current,
      [target]: current[target].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  };
  const addEntry = (target: EntrySection) => {
    setRequest((current) => ({
      ...current,
      [target]: [...current[target], { name: "", value: "" }],
    }));
  };
  const removeEntry = (target: EntrySection, index: number) => {
    setRequest((current) => ({
      ...current,
      [target]: current[target].filter(
        (_entry, entryIndex) => entryIndex !== index,
      ),
    }));
  };
  const updateAuth = (field: keyof CurlAuth, value: string) => {
    setRequest((current) => ({
      ...current,
      auth: { ...current.auth, [field]: value },
    }));
  };
  const updateBodyField = (
    index: number,
    field: keyof CurlBodyField,
    value: string,
  ) => {
    setRequest((current) => ({
      ...current,
      body: {
        ...current.body,
        fields: current.body.fields.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, [field]: value } : entry,
        ),
      },
    }));
  };
  const addBodyField = () => {
    setRequest((current) => ({
      ...current,
      body: {
        ...current.body,
        fields: [...current.body.fields, { name: "", value: "", kind: "text" }],
      },
    }));
  };
  const removeBodyField = (index: number) => {
    setRequest((current) => ({
      ...current,
      body: {
        ...current.body,
        fields: current.body.fields.filter(
          (_entry, entryIndex) => entryIndex !== index,
        ),
      },
    }));
  };
  const setBodyType = (type: CurlBodyType) => {
    setRequest((current) => ({
      ...current,
      body: { ...current.body, type },
    }));
  };

  return (
    <section className="tool-workspace card curl-generator-workspace">
      <div className="workspace-header curl-generator-header">
        <h2>{messages.tool.requestBuilder}</h2>
        <div className="workspace-actions">
          <ClearButton
            messages={messages}
            onClick={() => setRequest(initialRequest())}
          />
          <CopyButton messages={messages} value={output.value ?? ""} />
          <DownloadButton
            value={output.value ?? ""}
            filename={`request.${FORMAT_EXTENSIONS[format]}`}
            messages={messages}
          />
        </div>
      </div>
      {output.error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{localizeToolError(output.error, messages)}</span>
        </div>
      )}
      <div className="curl-request-line">
        <label className="field curl-method-field">
          <span>{messages.common.method}</span>
          <select
            aria-label={messages.common.method}
            value={request.method}
            onChange={(event) =>
              setRequest((current) => ({
                ...current,
                method: event.target.value,
              }))
            }
          >
            {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map(
              (item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="field">
          <span>{messages.common.url}</span>
          <input
            aria-label={messages.common.url}
            inputMode="url"
            spellCheck={false}
            value={request.url}
            onChange={(event) =>
              setRequest((current) => ({
                ...current,
                url: event.target.value,
              }))
            }
          />
        </label>
        <label className="field curl-format-field">
          <span>{labels.outputFormat}</span>
          <select
            aria-label={labels.outputFormat}
            value={format}
            onChange={(event) =>
              setFormat(event.target.value as CurlOutputFormat)
            }
          >
            {CURL_OUTPUT_FORMATS.map((item) => (
              <option value={item} key={item}>
                {FORMAT_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="curl-section-tabs"
        role="tablist"
        aria-label={labels.requestSections}
      >
        {(Object.keys(sectionLabels) as RequestSection[]).map((item) => (
          <button
            type="button"
            role="tab"
            id={`curl-tab-${item}`}
            aria-controls={`curl-panel-${item}`}
            aria-selected={section === item}
            onClick={() => setSection(item)}
            key={item}
          >
            {sectionLabels[item]}
            {item === "headers" || item === "query" || item === "cookies" ? (
              <span>{request[item].length}</span>
            ) : null}
          </button>
        ))}
      </div>
      <div
        className="curl-section-panel"
        role="tabpanel"
        id={`curl-panel-${section}`}
        aria-labelledby={`curl-tab-${section}`}
      >
        {section === "headers" && (
          <EntryEditor
            entries={request.headers}
            nameLabel={messages.tool.headerName}
            valueLabel={messages.tool.headerValue}
            addLabel={labels.addHeader}
            removeLabel={labels.removeHeader}
            onChange={(index, field, value) =>
              updateEntries("headers", index, field, value)
            }
            onAdd={() => addEntry("headers")}
            onRemove={(index) => removeEntry("headers", index)}
          />
        )}
        {section === "query" && (
          <EntryEditor
            entries={request.query}
            nameLabel={labels.name}
            valueLabel={labels.value}
            addLabel={labels.addQuery}
            removeLabel={labels.removeQuery}
            onChange={(index, field, value) =>
              updateEntries("query", index, field, value)
            }
            onAdd={() => addEntry("query")}
            onRemove={(index) => removeEntry("query", index)}
          />
        )}
        {section === "cookies" && (
          <EntryEditor
            entries={request.cookies}
            nameLabel={labels.name}
            valueLabel={labels.value}
            addLabel={labels.addCookie}
            removeLabel={labels.removeCookie}
            onChange={(index, field, value) =>
              updateEntries("cookies", index, field, value)
            }
            onAdd={() => addEntry("cookies")}
            onRemove={(index) => removeEntry("cookies", index)}
          />
        )}
        {section === "auth" && (
          <div className="curl-auth-editor">
            <div className="segmented curl-auth-types">
              {(["none", "basic", "bearer"] as const).map((type) => (
                <button
                  type="button"
                  aria-pressed={request.auth.type === type}
                  onClick={() => updateAuth("type", type)}
                  key={type}
                >
                  {type === "none"
                    ? labels.none
                    : type === "basic"
                      ? labels.basic
                      : labels.bearer}
                </button>
              ))}
            </div>
            {request.auth.type === "basic" && (
              <div className="curl-auth-fields">
                <label className="field">
                  <span>{labels.username}</span>
                  <input
                    aria-label={labels.username}
                    autoComplete="off"
                    value={request.auth.username}
                    onChange={(event) =>
                      updateAuth("username", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>{labels.password}</span>
                  <input
                    aria-label={labels.password}
                    autoComplete="new-password"
                    type="password"
                    value={request.auth.password}
                    onChange={(event) =>
                      updateAuth("password", event.target.value)
                    }
                  />
                </label>
              </div>
            )}
            {request.auth.type === "bearer" && (
              <label className="field">
                <span>{labels.token}</span>
                <input
                  aria-label={labels.token}
                  autoComplete="off"
                  type="password"
                  value={request.auth.token}
                  onChange={(event) => updateAuth("token", event.target.value)}
                />
              </label>
            )}
          </div>
        )}
        {section === "body" && (
          <div className="curl-body-editor">
            <div
              className="segmented curl-body-types"
              aria-label={labels.bodyType}
            >
              {(["none", "raw", "form-urlencoded", "multipart"] as const).map(
                (type) => (
                  <button
                    type="button"
                    aria-pressed={request.body.type === type}
                    onClick={() => setBodyType(type)}
                    key={type}
                  >
                    {type === "none"
                      ? labels.none
                      : type === "raw"
                        ? labels.raw
                        : type === "form-urlencoded"
                          ? labels.urlEncoded
                          : labels.multipart}
                  </button>
                ),
              )}
            </div>
            {request.body.type === "raw" && (
              <label className="field">
                <span>{messages.tool.requestBody}</span>
                <textarea
                  aria-label={messages.tool.requestBody}
                  className="mono curl-raw-body"
                  spellCheck={false}
                  value={request.body.text}
                  onChange={(event) =>
                    setRequest((current) => ({
                      ...current,
                      body: { ...current.body, text: event.target.value },
                    }))
                  }
                />
              </label>
            )}
            {(request.body.type === "form-urlencoded" ||
              request.body.type === "multipart") && (
              <BodyFieldEditor
                fields={request.body.fields}
                labels={labels}
                allowFiles={request.body.type === "multipart"}
                onChange={updateBodyField}
                onAdd={addBodyField}
                onRemove={removeBodyField}
              />
            )}
          </div>
        )}
      </div>
      <div className="panel-label curl-output-label">
        <span>{FORMAT_LABELS[format]}</span>
      </div>
      <pre
        className="editor editor-output curl-code-output"
        aria-label={`${FORMAT_LABELS[format]} ${messages.common.output}`}
        data-placeholder={messages.workbench.outputPlaceholder}
      >
        {output.value ?? ""}
      </pre>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.common.localBrowser}
        </span>
      </div>
    </section>
  );
}
