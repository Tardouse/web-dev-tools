"use client";

import { useMemo, useState } from "react";
import type { ToolComponentProps } from "@/lib/types";
import { localizeToolError } from "@/i18n/errors";
import { interpolate } from "@/i18n";
import { CircleAlert } from "lucide-react";
import type { RegexResult } from "@/lib/tools";
import { useLiveWorkerResult } from "./use-live-worker-result";

export function RegexTool({ definition, messages }: ToolComponentProps) {
  const [pattern, setPattern] = useState(
    "\\b[a-zA-Z]+@[a-zA-Z]+\\.[a-zA-Z]{2,}\\b",
  );
  const [flags, setFlags] = useState("gi");
  const [input, setInput] = useState(
    "Contact dev@example.com or support@example.org for help.",
  );
  const request = useMemo(
    () => ({ operation: "regex-test", pattern, flags, input }) as const,
    [flags, input, pattern],
  );
  const result = useLiveWorkerResult<RegexResult>(request, definition);
  const toggleFlag = (flag: string) =>
    setFlags((current) =>
      current.includes(flag) ? current.replace(flag, "") : current + flag,
    );
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="regex-pattern">{messages.tool.pattern}</label>
          <input
            id="regex-pattern"
            className="input mono"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
          />
        </div>
        <div className="option-row">
          {(["g", "i", "m", "s", "u"] as const).map((flag) => (
            <label
              className="checkbox regex-flag"
              key={flag}
              title={`${messages.tool.regexFlags[flag]} (${flag})`}
            >
              <input
                type="checkbox"
                checked={flags.includes(flag)}
                onChange={() => toggleFlag(flag)}
              />
              <span>{messages.tool.regexFlags[flag]}</span>
              <code>{flag}</code>
            </label>
          ))}
        </div>
      </div>
      {result.error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {localizeToolError(result.error, messages)}
        </div>
      )}
      <div className="workspace-grid">
        <div className="workspace-panel">
          <div className="panel-label">
            <span>{messages.tool.testString}</span>
            <span>{input.length.toLocaleString()} chars</span>
          </div>
          <textarea
            className="editor"
            aria-label={messages.tool.testString}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <div className="workspace-panel">
          <div className="panel-label">
            <span>{messages.tool.matchPreview}</span>
            <span>
              {interpolate(messages.tool.matches, {
                count: result.value?.matches.length ?? 0,
              })}
            </span>
          </div>
          <div className="editor editor-output">
            {result.value?.rendered.map((part, index) =>
              part.match ? (
                <mark className="regex-match" key={index}>
                  {part.text || "∅"}
                </mark>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
          </div>
        </div>
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.tool.regexSafety}
        </span>
        <span className="badge">
          {interpolate(messages.tool.matches, {
            count: result.value?.matches.length ?? 0,
          })}
        </span>
      </div>
    </section>
  );
}
