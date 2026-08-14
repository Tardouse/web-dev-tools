"use client";

import { useMemo, useState } from "react";
import { compareText, toUnifiedLikeDiff } from "@/lib/tools";
import { CopyButton, DownloadButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";

export function DiffTool({ messages }: ToolComponentProps) {
  const [before, setBefore] = useState(
    "const status = 'draft';\nconsole.log(status);\n",
  );
  const [after, setAfter] = useState(
    "const status = 'ready';\nconsole.info(status);\n",
  );
  const [mode, setMode] = useState<"lines" | "characters">("lines");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const result = useMemo(() => {
    try {
      const parts = compareText(before, after, mode, ignoreWhitespace);
      return { parts, text: toUnifiedLikeDiff(parts), error: "" };
    } catch (error) {
      return {
        parts: [],
        text: "",
        error: error instanceof Error ? error.message : "Diff failed.",
      };
    }
  }, [before, after, mode, ignoreWhitespace]);
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <h2>{messages.tool.textComparison}</h2>
        <div className="workspace-actions">
          <div className="segmented">
            <button
              aria-pressed={mode === "lines"}
              onClick={() => setMode("lines")}
            >
              Lines
            </button>
            <button
              aria-pressed={mode === "characters"}
              onClick={() => setMode("characters")}
            >
              Characters
            </button>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(event) => setIgnoreWhitespace(event.target.checked)}
            />
            {messages.tool.ignoreWhitespace}
          </label>
          <CopyButton messages={messages} value={result.text} />
          <DownloadButton
            messages={messages}
            value={result.text}
            filename="changes.diff"
          />
        </div>
      </div>
      <div className="workspace-grid">
        <div className="workspace-panel">
          <div className="panel-label">{messages.tool.original}</div>
          <textarea
            className="editor"
            value={before}
            onChange={(event) => setBefore(event.target.value)}
          />
        </div>
        <div className="workspace-panel">
          <div className="panel-label">{messages.tool.changed}</div>
          <textarea
            className="editor"
            value={after}
            onChange={(event) => setAfter(event.target.value)}
          />
        </div>
      </div>
      <div className="panel-label">{messages.tool.difference}</div>
      <pre className="editor editor-output" style={{ minHeight: 180 }}>
        {result.parts.map((part, index) => (
          <span
            key={index}
            className={`diff-line${part.added ? " diff-added" : part.removed ? " diff-removed" : ""}`}
          >
            {part.value}
          </span>
        ))}
      </pre>
    </section>
  );
}
