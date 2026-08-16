"use client";

import {
  CircleAlert,
  Download,
  FileUp,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { localizeToolError } from "@/i18n/errors";
import { byteLength, formatBytes, TOOL_LIMITS } from "@/lib/config";
import { downloadBytes } from "@/lib/clipboard";
import {
  ASCII_TABLE,
  buildQueryString,
  type DecodedBase64File,
  type QueryEntry,
  type Utf8Inspection,
} from "@/lib/tools";
import { isToolTaskCancellation, runToolWorker } from "@/lib/tool-execution";
import type { ToolComponentProps } from "@/lib/types";
import {
  ActionButton,
  ClearButton,
  CopyButton,
  DownloadButton,
  RunButton,
} from "./tool-actions";
import { useLiveWorkerResult } from "./use-live-worker-result";

function safeDownloadName(value: string): string {
  return value.trim().split(/[\\/]/).pop() || "decoded-file.bin";
}

function extensionForMime(mimeType: string): string {
  const common: Record<string, string> = {
    "application/json": "json",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/octet-stream": "bin",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "text/css": "css",
    "text/csv": "csv",
    "text/html": "html",
    "text/plain": "txt",
  };
  return (
    common[mimeType] ?? mimeType.split("/")[1]?.split(/[;+]/, 1)[0] ?? "bin"
  );
}

export function FileBase64Tool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const base64InputLimit =
    definition?.maxInputSize ?? TOOL_LIMITS.maxBase64Output;
  const base64OutputLimit =
    definition?.maxOutputSize ?? TOOL_LIMITS.maxBase64Output;
  const fileLimit = Math.max(
    1,
    Math.floor(
      ((Math.min(base64InputLimit, base64OutputLimit) - 1024) * 3) / 4,
    ),
  );
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [dataUrl, setDataUrl] = useState(true);
  const [encoded, setEncoded] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [decoded, setDecoded] = useState<DecodedBase64File | null>(null);
  const [decodedName, setDecodedName] = useState("decoded-file.bin");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const execution = useRef<AbortController | null>(null);

  useEffect(() => () => execution.current?.abort(), []);

  const clear = () => {
    execution.current?.abort();
    execution.current = null;
    setRunning(false);
    setFile(null);
    setFileData(null);
    setEncoded("");
    setBase64Input("");
    setDecoded(null);
    setDecodedName("decoded-file.bin");
    setError("");
  };

  const switchMode = (next: "encode" | "decode") => {
    clear();
    setMode(next);
  };

  const chooseFile = async (selected: File) => {
    setError("");
    setEncoded("");
    if (selected.size > fileLimit) {
      setFile(null);
      setFileData(null);
      setError(
        zh
          ? `文件不能超过 ${formatBytes(fileLimit)}。`
          : `Files cannot exceed ${formatBytes(fileLimit)}.`,
      );
      return;
    }
    try {
      setFile(selected);
      setFileData(new Uint8Array(await selected.arrayBuffer()));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : messages.workbench.operationFailed,
      );
    }
  };

  const run = async () => {
    execution.current?.abort();
    const controller = new AbortController();
    execution.current = controller;
    setRunning(true);
    setError("");
    setDecoded(null);
    try {
      if (mode === "encode") {
        if (!file || !fileData) {
          throw new Error(zh ? "请先选择文件。" : "Choose a file first.");
        }
        const result = await runToolWorker<string>(
          {
            operation: "file-base64-encode",
            data: fileData.slice(),
            mimeType: file.type || "application/octet-stream",
            dataUrl,
          },
          definition,
          controller.signal,
        );
        if (!controller.signal.aborted) setEncoded(result);
      } else {
        const result = await runToolWorker<DecodedBase64File>(
          { operation: "file-base64-decode", input: base64Input },
          definition,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setDecoded(result);
          if (decodedName === "decoded-file.bin") {
            setDecodedName(`decoded-file.${extensionForMime(result.mimeType)}`);
          }
        }
      }
    } catch (caught) {
      if (isToolTaskCancellation(caught)) return;
      if (mode === "encode") setEncoded("");
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
  };

  return (
    <section className="tool-workspace card file-base64-workspace">
      <div className="workspace-header">
        <h2>{zh ? "文件 Base64 转换" : "File Base64 converter"}</h2>
        <div className="workspace-actions">
          <div className="segmented">
            <button
              aria-pressed={mode === "encode"}
              onClick={() => switchMode("encode")}
            >
              {zh ? "文件转 Base64" : "File to Base64"}
            </button>
            <button
              aria-pressed={mode === "decode"}
              onClick={() => switchMode("decode")}
            >
              {zh ? "Base64 转文件" : "Base64 to file"}
            </button>
          </div>
          <ClearButton onClick={clear} messages={messages} />
          {mode === "encode" && (
            <>
              <CopyButton value={encoded} messages={messages} />
              <DownloadButton
                value={encoded}
                filename={`${file?.name ?? "file"}.base64.txt`}
                messages={messages}
              />
            </>
          )}
          {mode === "decode" && (
            <ActionButton
              icon={Download}
              disabled={!decoded}
              onClick={() => {
                if (!decoded) return;
                downloadBytes(
                  decoded.data,
                  safeDownloadName(decodedName),
                  decoded.mimeType,
                );
              }}
            >
              {zh ? "下载文件" : "Download file"}
            </ActionButton>
          )}
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}
      {mode === "encode" ? (
        <div className="file-base64-grid">
          <div className="file-base64-panel">
            <div className="panel-label">
              <span>{zh ? "本地文件" : "Local file"}</span>
              <span>{formatBytes(fileLimit)}</span>
            </div>
            <label className="file-dropzone compact file-base64-dropzone">
              <FileUp size={28} />
              <strong>
                {file?.name ??
                  (zh ? "选择要编码的文件" : "Choose a file to encode")}
              </strong>
              <span>
                {file
                  ? `${formatBytes(file.size)} · ${file.type || "application/octet-stream"}`
                  : zh
                    ? "文件只在当前浏览器中读取"
                    : "The file stays in this browser"}
              </span>
              <input
                type="file"
                aria-label={zh ? "选择要编码的文件" : "Choose file to encode"}
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) void chooseFile(selected);
                }}
              />
            </label>
            <label className="checkbox file-base64-option">
              <input
                type="checkbox"
                checked={dataUrl}
                onChange={(event) => setDataUrl(event.target.checked)}
              />
              {zh
                ? "包含 MIME 类型的 Data URL"
                : "Include MIME type as a data URL"}
            </label>
          </div>
          <div className="file-base64-panel">
            <div className="panel-label">
              <span>Base64</span>
              <span>{formatBytes(byteLength(encoded))}</span>
            </div>
            <textarea
              className="editor file-base64-output"
              readOnly
              value={encoded}
              aria-label={zh ? "Base64 输出" : "Base64 output"}
              placeholder={messages.workbench.outputPlaceholder}
            />
          </div>
        </div>
      ) : (
        <div className="file-base64-grid">
          <div className="file-base64-panel">
            <div className="panel-label">
              <span>Base64 / Data URL</span>
              <span>{formatBytes(byteLength(base64Input))}</span>
            </div>
            <textarea
              className="editor"
              value={base64Input}
              onChange={(event) => setBase64Input(event.target.value)}
              aria-label={zh ? "Base64 文件数据" : "Base64 file data"}
              placeholder="data:application/octet-stream;base64,..."
            />
          </div>
          <div className="file-base64-panel file-base64-result">
            <div className="panel-label">
              <span>{zh ? "文件结果" : "File result"}</span>
            </div>
            {decoded ? (
              <div className="file-base64-metadata">
                <div>
                  <span>MIME</span>
                  <strong>{decoded.mimeType}</strong>
                </div>
                <div>
                  <span>{zh ? "大小" : "Size"}</span>
                  <strong>{formatBytes(decoded.data.byteLength)}</strong>
                </div>
                <div>
                  <span>{zh ? "识别来源" : "Detected from"}</span>
                  <strong>{decoded.source}</strong>
                </div>
                <label className="field">
                  <span className="field-label">
                    {zh ? "下载文件名" : "Download filename"}
                  </span>
                  <input
                    aria-label={zh ? "下载文件名" : "Download filename"}
                    value={decodedName}
                    onChange={(event) => setDecodedName(event.target.value)}
                  />
                </label>
              </div>
            ) : (
              <div className="file-base64-empty">
                <FileUp size={30} />
                <span>
                  {zh
                    ? "解码后的文件信息将显示在这里"
                    : "Decoded file details appear here"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.common.localBrowser}
        </span>
        <RunButton
          onClick={() => void run()}
          label={
            running
              ? messages.common.working
              : mode === "encode"
                ? zh
                  ? "编码文件"
                  : "Encode file"
                : zh
                  ? "解码文件"
                  : "Decode file"
          }
          disabled={
            running || (mode === "encode" ? !fileData : !base64Input.trim())
          }
        />
      </div>
    </section>
  );
}

export function QueryStringGeneratorTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [entries, setEntries] = useState<QueryEntry[]>([
    { key: "q", value: "developer tools" },
    { key: "tag", value: "url" },
    { key: "tag", value: "encoding" },
  ]);
  const [leadingMark, setLeadingMark] = useState(true);
  const maxInput = definition?.maxInputSize ?? TOOL_LIMITS.text;
  const maxOutput = definition?.maxOutputSize ?? TOOL_LIMITS.maxOutput;
  const calculation = useMemo(() => {
    const inputSize = byteLength(JSON.stringify(entries));
    if (inputSize > maxInput) {
      return {
        output: "",
        error: zh
          ? `参数内容不能超过 ${formatBytes(maxInput)}。`
          : `Parameter content cannot exceed ${formatBytes(maxInput)}.`,
      };
    }
    try {
      const output = buildQueryString(entries, leadingMark);
      if (byteLength(output) > maxOutput) {
        return {
          output: "",
          error: zh
            ? `输出不能超过 ${formatBytes(maxOutput)}。`
            : `Output cannot exceed ${formatBytes(maxOutput)}.`,
        };
      }
      return { output, error: "" };
    } catch (caught) {
      return {
        output: "",
        error:
          caught instanceof Error
            ? caught.message
            : messages.workbench.operationFailed,
      };
    }
  }, [
    entries,
    leadingMark,
    maxInput,
    maxOutput,
    messages.workbench.operationFailed,
    zh,
  ]);

  const update = (index: number, field: keyof QueryEntry, value: string) => {
    setEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  return (
    <section className="tool-workspace card query-generator-workspace">
      <div className="workspace-header">
        <h2>{zh ? "Query String 生成器" : "Query string generator"}</h2>
        <div className="workspace-actions">
          <ClearButton
            messages={messages}
            onClick={() => setEntries([{ key: "", value: "" }])}
          />
          <CopyButton value={calculation.output} messages={messages} />
          <DownloadButton
            value={calculation.output}
            filename="query-string.txt"
            messages={messages}
          />
        </div>
      </div>
      {calculation.error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{calculation.error}</span>
        </div>
      )}
      <div className="query-generator-body">
        <div className="query-generator-options">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={leadingMark}
              onChange={(event) => setLeadingMark(event.target.checked)}
            />
            {zh ? "包含开头的问号" : "Include leading question mark"}
          </label>
        </div>
        <div className="query-row-list">
          {entries.map((entry, index) => (
            <div className="query-row" key={index}>
              <label className="field">
                <span className="field-label">{zh ? "参数名" : "Key"}</span>
                <input
                  aria-label={`${zh ? "参数名" : "Parameter key"} ${index + 1}`}
                  value={entry.key}
                  onChange={(event) => update(index, "key", event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">{zh ? "参数值" : "Value"}</span>
                <input
                  aria-label={`${zh ? "参数值" : "Parameter value"} ${index + 1}`}
                  value={entry.value}
                  onChange={(event) =>
                    update(index, "value", event.target.value)
                  }
                />
              </label>
              <button
                type="button"
                className="icon-button subtle query-row-remove"
                aria-label={`${zh ? "删除参数" : "Remove parameter"} ${index + 1}`}
                title={zh ? "删除参数" : "Remove parameter"}
                disabled={entries.length === 1}
                onClick={() =>
                  setEntries((current) =>
                    current.filter((_, item) => item !== index),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <ActionButton
          icon={Plus}
          disabled={entries.length >= 100}
          onClick={() =>
            setEntries((current) => [...current, { key: "", value: "" }])
          }
        >
          {zh ? "添加参数" : "Add parameter"}
        </ActionButton>
        <div className="query-output">
          <div className="panel-label">
            <span>Query String</span>
            <span>{formatBytes(byteLength(calculation.output))}</span>
          </div>
          <pre
            className="editor-output"
            data-placeholder={messages.workbench.outputPlaceholder}
          >
            {calculation.output}
          </pre>
        </div>
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.common.localBrowser}
        </span>
      </div>
    </section>
  );
}

type AsciiFilter = "all" | "control" | "printable";

export function AsciiTableTool({ locale, messages }: ToolComponentProps) {
  const zh = locale === "zh";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AsciiFilter>("all");
  const categoryLabels = zh
    ? {
        control: "控制字符",
        whitespace: "空白",
        digit: "数字",
        letter: "字母",
        symbol: "符号",
      }
    : {
        control: "Control",
        whitespace: "Whitespace",
        digit: "Digit",
        letter: "Letter",
        symbol: "Symbol",
      };
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return ASCII_TABLE.filter((entry) => {
      if (filter === "control" && entry.category !== "control") return false;
      if (filter === "printable" && entry.category === "control") return false;
      return (
        !term ||
        entry.name.toLowerCase().includes(term) ||
        entry.character.toLowerCase().includes(term) ||
        String(entry.decimal).includes(term) ||
        entry.hex.toLowerCase().includes(term) ||
        entry.binary.includes(term)
      );
    });
  }, [filter, query]);

  return (
    <section className="tool-workspace card ascii-table-workspace">
      <div className="workspace-header">
        <h2>{zh ? "ASCII 字符表" : "ASCII character table"}</h2>
        <div className="segmented">
          {(["all", "control", "printable"] as const).map((item) => (
            <button
              key={item}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item === "all"
                ? zh
                  ? "全部"
                  : "All"
                : item === "control"
                  ? zh
                    ? "控制字符"
                    : "Control"
                  : zh
                    ? "可打印"
                    : "Printable"}
            </button>
          ))}
        </div>
      </div>
      <div className="ascii-table-filter">
        <Search size={17} />
        <input
          aria-label={zh ? "搜索 ASCII 字符" : "Search ASCII characters"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            zh ? "搜索名称、字符或编码" : "Search name, character, or code"
          }
        />
        <span>{rows.length} / 128</span>
      </div>
      <div className="data-table-scroll ascii-table-scroll">
        <table className="data-table encoding-data-table">
          <thead>
            <tr>
              <th>{zh ? "字符" : "Character"}</th>
              <th>{zh ? "名称" : "Name"}</th>
              <th>{zh ? "十进制" : "Decimal"}</th>
              <th>{zh ? "十六进制" : "Hex"}</th>
              <th>{zh ? "二进制" : "Binary"}</th>
              <th>{zh ? "类别" : "Category"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.decimal}>
                <td>
                  <code>{entry.character}</code>
                </td>
                <td>{entry.name}</td>
                <td>
                  <code>{entry.decimal}</code>
                </td>
                <td>
                  <code>0x{entry.hex}</code>
                </td>
                <td>
                  <code>{entry.binary}</code>
                </td>
                <td>{categoryLabels[entry.category]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.common.localBrowser}
        </span>
      </div>
    </section>
  );
}

export function Utf8InspectorTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [input, setInput] = useState("Hello, 世界 🚀");
  const [visible, setVisible] = useState(100);
  const request = useMemo(
    () => ({ operation: "utf8-inspect", input }) as const,
    [input],
  );
  const result = useLiveWorkerResult<Utf8Inspection>(request, definition, 100);
  const inspection = result.value;

  return (
    <section className="tool-workspace card utf8-workspace">
      <div className="workspace-header">
        <h2>{zh ? "UTF-8 编码查看" : "UTF-8 encoding inspector"}</h2>
        <div className="workspace-actions">
          <ClearButton
            messages={messages}
            onClick={() => {
              setInput("");
              setVisible(100);
            }}
          />
          <CopyButton messages={messages} value={input} />
          <DownloadButton
            messages={messages}
            value={input}
            filename="utf8-text.txt"
          />
        </div>
      </div>
      {result.error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{localizeToolError(result.error, messages)}</span>
        </div>
      )}
      <div className="utf8-input-panel">
        <div className="panel-label">
          <span>{zh ? "文本输入" : "Text input"}</span>
          <span>{formatBytes(byteLength(input))}</span>
        </div>
        <textarea
          className="editor"
          aria-label={zh ? "UTF-8 文本输入" : "UTF-8 text input"}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setVisible(100);
          }}
          placeholder={messages.workbench.placeholder}
        />
      </div>
      {inspection && (
        <>
          <div className="metrics-grid utf8-metrics">
            <div className="metric">
              <strong className="metric-value">{inspection.bytes}</strong>
              <span className="metric-label">
                {zh ? "UTF-8 字节" : "UTF-8 bytes"}
              </span>
            </div>
            <div className="metric">
              <strong className="metric-value">{inspection.codePoints}</strong>
              <span className="metric-label">
                {zh ? "Unicode 码点" : "Code points"}
              </span>
            </div>
            <div className="metric">
              <strong className="metric-value">{inspection.codeUnits}</strong>
              <span className="metric-label">
                UTF-16 {zh ? "代码单元" : "code units"}
              </span>
            </div>
            <div className="metric">
              <strong className="metric-value">{inspection.multibyte}</strong>
              <span className="metric-label">
                {zh ? "多字节字符" : "Multibyte characters"}
              </span>
            </div>
          </div>
          <div className="data-table-scroll utf8-table-scroll">
            <table className="data-table encoding-data-table">
              <thead>
                <tr>
                  <th>{zh ? "字符" : "Character"}</th>
                  <th>{zh ? "Unicode 码点" : "Code point"}</th>
                  <th>UTF-8 Hex</th>
                  <th>{zh ? "字节数" : "Bytes"}</th>
                </tr>
              </thead>
              <tbody>
                {inspection.rows.slice(0, visible).map((row, index) => (
                  <tr key={`${index}-${row.codePoint}`}>
                    <td>
                      <code>{row.character}</code>
                    </td>
                    <td>
                      <code>{row.codePoint}</code>
                    </td>
                    <td>
                      <code>{row.bytes}</code>
                    </td>
                    <td>{row.byteCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inspection.rows.length > visible && (
            <div className="utf8-show-more">
              <ActionButton
                onClick={() => setVisible((current) => current + 100)}
              >
                {zh ? "再显示 100 项" : "Show 100 more"}
              </ActionButton>
            </div>
          )}
          {inspection.truncated > 0 && (
            <div className="utf8-truncated">
              {zh
                ? `为保持页面流畅，仅展示前 ${inspection.rows.length} 个码点，其余 ${inspection.truncated} 个已计入统计。`
                : `For responsiveness, only the first ${inspection.rows.length} code points are listed; ${inspection.truncated} more are included in the totals.`}
            </div>
          )}
        </>
      )}
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.common.localBrowser}
        </span>
      </div>
    </section>
  );
}
