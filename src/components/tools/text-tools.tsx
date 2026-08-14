"use client";

import { useCallback, useMemo, useState } from "react";
import {
  convertCase,
  countText,
  formatHtmlFallback,
  type CaseMode,
} from "@/lib/tools";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

export function TextCounterTool({ messages, locale }: ToolComponentProps) {
  const [input, setInput] = useState(
    "Build useful tools, protect user privacy, and keep the interface fast.",
  );
  const metrics = useMemo(() => countText(input), [input]);
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <h2>{messages.tool.liveAnalysis}</h2>
      </div>
      <div className="metrics-grid">
        {Object.entries({
          [messages.metrics.characters]: metrics.characters,
          [messages.metrics.words]: metrics.words,
          [messages.metrics.lines]: metrics.lines,
          [messages.metrics.bytes]: metrics.bytes,
          [messages.metrics.noSpaces]: metrics.charactersNoSpaces,
          [messages.metrics.chinese]: metrics.chineseCharacters,
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

const modes: Array<[CaseMode, string]> = [
  ["upper", "UPPER"],
  ["lower", "lower"],
  ["title", "Title"],
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
}: ToolComponentProps) {
  const [mode, setMode] = useState<CaseMode>("camel");
  const transform = useCallback(
    (input: string) => convertCase(input, mode),
    [mode],
  );
  return (
    <TextWorkbench
      messages={messages}
      transform={transform}
      initialInput="developer tools make daily work easier"
      actionLabel={messages.tool.convert}
      maxInputSize={definition?.maxInputSize}
      options={
        <select
          className="select"
          style={{ width: 135, height: 34 }}
          value={mode}
          onChange={(event) => setMode(event.target.value as CaseMode)}
        >
          {modes.map(([value, label]) => (
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
      maxInputSize={definition?.maxInputSize}
    />
  );
}
