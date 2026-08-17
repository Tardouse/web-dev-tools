"use client";

import { CircleAlert } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  formatHtmlFallback,
  type CaseMode,
  type TextMetrics,
} from "@/lib/tools";
import { localizeToolError } from "@/i18n/errors";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";
import { useLiveWorkerResult } from "./use-live-worker-result";

const emptyMetrics: TextMetrics = {
  characters: 0,
  charactersNoSpaces: 0,
  words: 0,
  lines: 0,
  bytes: 0,
  chineseCharacters: 0,
  englishCharacters: 0,
  numbers: 0,
  spaces: 0,
};

export function TextCounterTool({
  definition,
  messages,
  locale,
}: ToolComponentProps) {
  const [input, setInput] = useState(
    "Build useful tools, protect user privacy, and keep the interface fast.",
  );
  const request = useMemo(
    () => ({ operation: "text-count", input }) as const,
    [input],
  );
  const result = useLiveWorkerResult<TextMetrics>(request, definition);
  const metrics = result.value ?? emptyMetrics;
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <h2>{messages.tool.liveAnalysis}</h2>
      </div>
      {result.error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          {localizeToolError(result.error, messages)}
        </div>
      )}
      <div className="metrics-grid">
        {Object.entries({
          [messages.metrics.characters]: metrics.characters,
          [messages.metrics.words]: metrics.words,
          [messages.metrics.lines]: metrics.lines,
          [messages.metrics.bytes]: metrics.bytes,
          [messages.metrics.noSpaces]: metrics.charactersNoSpaces,
          [messages.metrics.chinese]: metrics.chineseCharacters,
          [messages.metrics.english]: metrics.englishCharacters,
          [messages.metrics.numbers]: metrics.numbers,
          [messages.metrics.whitespace]: metrics.spaces,
        }).map(([label, value]) => (
          <div className="metric" key={label}>
            <strong className="metric-value">
              {value.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
            </strong>
            <span className="metric-label">{label}</span>
          </div>
        ))}
      </div>
      <textarea
        className="editor"
        style={{ minHeight: 360 }}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={messages.tool.typeAnalyze}
        aria-label={messages.tool.typeAnalyze}
      />
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.tool.updatesInstantly}
        </span>
      </div>
    </section>
  );
}

const baseModes: Array<[CaseMode, string]> = [
  ["upper", "UPPER"],
  ["lower", "lower"],
  ["title", "Title Case"],
  ["camel", "camelCase"],
  ["pascal", "PascalCase"],
  ["snake", "snake_case"],
  ["kebab", "kebab-case"],
  ["constant", "CONSTANT"],
  ["dot", "dot.case"],
  ["path", "path/case"],
];
export function CaseConverterTool({
  definition,
  messages,
  locale,
}: ToolComponentProps) {
  const [mode, setMode] = useState<CaseMode>("camel");
  const workerTask = useCallback(
    (input: string) => ({ operation: "case-convert", input, mode }) as const,
    [mode],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput="developer tools make daily work easier"
      actionLabel={messages.tool.convert}
      definition={definition}
      options={
        <select
          className="select"
          style={{ width: 135, height: 34 }}
          value={mode}
          onChange={(event) => setMode(event.target.value as CaseMode)}
          aria-label={locale === "zh" ? "转换格式" : "Case format"}
        >
          {[
            ...baseModes.slice(0, 2),
            [
              "capitalize" as const,
              locale === "zh" ? "首字母大写" : "Capitalize",
            ] as const,
            ...baseModes.slice(2),
          ].map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      }
    />
  );
}

export function HtmlFormatterTool({
  definition,
  messages,
}: ToolComponentProps) {
  const transform = useCallback(async (input: string) => {
    try {
      const prettier = await import("prettier/standalone");
      const html = await import("prettier/plugins/html");
      return await prettier.format(input, {
        parser: "html",
        plugins: [html],
        printWidth: 100,
        tabWidth: 2,
      });
    } catch {
      return formatHtmlFallback(input);
    }
  }, []);
  return (
    <TextWorkbench
      messages={messages}
      transform={transform}
      initialInput={
        "<main><h1>Developer tools</h1><p>Fast, private, and focused.</p></main>"
      }
      actionLabel={messages.tool.formatHtml}
      filename="formatted.html"
      definition={definition}
    />
  );
}
