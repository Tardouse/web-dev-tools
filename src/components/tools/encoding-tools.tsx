"use client";

import { useCallback, useState } from "react";
import type { AsciiCodeBase, Base64Mode } from "@/lib/tools";
import type { ToolWorkerRequest } from "@/lib/tool-worker-protocol";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

export function Base64Tool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [mode, setMode] = useState<Base64Mode>("encode");
  const workerTask = useCallback(
    (input: string): ToolWorkerRequest => ({
      operation:
        mode === "encode"
          ? "base64-encode"
          : mode === "decode"
            ? "base64-decode"
            : "base64-auto",
      input,
    }),
    [mode],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput="Hello, developer! 👋"
      actionLabel={
        mode === "encode"
          ? messages.tool.encode
          : mode === "decode"
            ? messages.tool.decode
            : zh
              ? "自动识别"
              : "Auto detect"
      }
      filename="base64.txt"
      definition={definition}
      options={
        <div className="segmented">
          <button
            aria-pressed={mode === "encode"}
            onClick={() => setMode("encode")}
          >
            {messages.tool.encode}
          </button>
          <button
            aria-pressed={mode === "decode"}
            onClick={() => setMode("decode")}
          >
            {messages.tool.decode}
          </button>
          <button
            aria-pressed={mode === "auto"}
            onClick={() => setMode("auto")}
          >
            {zh ? "自动" : "Auto"}
          </button>
        </div>
      }
    />
  );
}

export function UrlEncoderTool({ definition, messages }: ToolComponentProps) {
  const workerTask = useCallback(
    (input: string) => ({ operation: "url-encode", input }) as const,
    [],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput="https://example.com/search?q=developer tools&lang=en"
      actionLabel={messages.tool.encodeUrl}
      filename="encoded-url.txt"
      definition={definition}
    />
  );
}

export function UrlDecoderTool({ definition, messages }: ToolComponentProps) {
  const workerTask = useCallback(
    (input: string) => ({ operation: "url-decode", input }) as const,
    [],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput="https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Ddeveloper%20tools"
      actionLabel={messages.tool.decodeUrl}
      filename="decoded-url.txt"
      definition={definition}
    />
  );
}

export function UrlParserTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const workerTask = useCallback(
    (input: string) => ({ operation: "url-parse", input }) as const,
    [],
  );
  return (
    <TextWorkbench
      messages={messages}
      title={zh ? "URL 解析器" : "URL parser"}
      inputLabel={zh ? "完整 URL" : "Absolute URL"}
      outputLabel={zh ? "URL 组成" : "URL components"}
      workerTask={workerTask}
      initialInput="https://user@example.com:8443/docs/start?q=dev+tools&tag=url#intro"
      actionLabel={zh ? "解析 URL" : "Parse URL"}
      filename="url-components.json"
      definition={definition}
    />
  );
}

export function QueryStringParserTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const workerTask = useCallback(
    (input: string) => ({ operation: "query-parse", input }) as const,
    [],
  );
  return (
    <TextWorkbench
      messages={messages}
      title={zh ? "Query String 解析器" : "Query string parser"}
      inputLabel={zh ? "URL 或查询字符串" : "URL or query string"}
      outputLabel={zh ? "解析结果" : "Parsed values"}
      workerTask={workerTask}
      initialInput="?q=developer+tools&tag=url&tag=encoding&empty="
      actionLabel={zh ? "解析参数" : "Parse parameters"}
      filename="query-parameters.json"
      definition={definition}
    />
  );
}

export function UnicodeConverterTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const workerTask = useCallback(
    (input: string): ToolWorkerRequest => ({
      operation: mode === "encode" ? "unicode-encode" : "unicode-decode",
      input,
    }),
    [mode],
  );
  return (
    <TextWorkbench
      messages={messages}
      title={zh ? "Unicode 转换器" : "Unicode converter"}
      inputLabel={zh ? "文本或 Unicode 转义" : "Text or Unicode escapes"}
      outputLabel={zh ? "转换结果" : "Converted value"}
      workerTask={workerTask}
      initialInput="Hello, 世界 🚀"
      actionLabel={
        mode === "encode" ? messages.tool.encode : messages.tool.decode
      }
      filename="unicode.txt"
      definition={definition}
      options={
        <div className="segmented">
          <button
            aria-pressed={mode === "encode"}
            onClick={() => setMode("encode")}
          >
            {messages.tool.encode}
          </button>
          <button
            aria-pressed={mode === "decode"}
            onClick={() => setMode("decode")}
          >
            {messages.tool.decode}
          </button>
        </div>
      }
    />
  );
}

export function AsciiConverterTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [base, setBase] = useState<AsciiCodeBase>("decimal");
  const workerTask = useCallback(
    (input: string): ToolWorkerRequest =>
      mode === "encode"
        ? { operation: "ascii-encode", input, base }
        : { operation: "ascii-decode", input },
    [base, mode],
  );
  return (
    <TextWorkbench
      messages={messages}
      title={zh ? "ASCII 转换器" : "ASCII converter"}
      inputLabel={zh ? "ASCII 文本或代码" : "ASCII text or codes"}
      outputLabel={zh ? "转换结果" : "Converted value"}
      workerTask={workerTask}
      initialInput="Hello, ASCII!"
      actionLabel={
        mode === "encode" ? messages.tool.encode : messages.tool.decode
      }
      filename="ascii.txt"
      definition={definition}
      options={
        <>
          <div className="segmented">
            <button
              aria-pressed={mode === "encode"}
              onClick={() => setMode("encode")}
            >
              {zh ? "文本转代码" : "Text to codes"}
            </button>
            <button
              aria-pressed={mode === "decode"}
              onClick={() => setMode("decode")}
            >
              {zh ? "代码转文本" : "Codes to text"}
            </button>
          </div>
          {mode === "encode" && (
            <select
              className="tool-option-select"
              aria-label={zh ? "ASCII 输出进制" : "ASCII output base"}
              value={base}
              onChange={(event) => setBase(event.target.value as AsciiCodeBase)}
            >
              <option value="decimal">{zh ? "十进制" : "Decimal"}</option>
              <option value="hex">{zh ? "十六进制" : "Hex"}</option>
              <option value="binary">{zh ? "二进制" : "Binary"}</option>
            </select>
          )}
        </>
      }
    />
  );
}
