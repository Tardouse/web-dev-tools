"use client";

import { CircleAlert } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { type DiffLine } from "@/lib/tools";
import type { DiffWorkerResult } from "@/lib/tool-worker-protocol";
import { localizeToolError } from "@/i18n/errors";
import { CopyButton, DownloadButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";
import { useLiveWorkerResult } from "./use-live-worker-result";

function DiffPane({
  label,
  value,
  onChange,
  lines,
  side,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  lines: DiffLine[];
  side: "left" | "right";
}) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const syncScroll = (target: HTMLTextAreaElement) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = target.scrollTop;
      highlightRef.current.scrollLeft = target.scrollLeft;
    }
  };
  return (
    <div className={`diff-pane diff-pane-${side}`}>
      <div className="panel-label">
        <span>{label}</span>
        <span>{value.split("\n").length} lines</span>
      </div>
      <div className="diff-editor-shell">
        <div className="diff-highlight" ref={highlightRef} aria-hidden="true">
          {lines.map((line, row) => (
            <div
              className={`diff-inline-line diff-inline-${line.tone}`}
              key={`${row}-${line.number}`}
            >
              <span className="diff-gutter">
                <span>{line.number ?? ""}</span>
                <b>{line.marker}</b>
              </span>
              <code>
                {line.segments.map((segment, index) => (
                  <span
                    className={
                      segment.changed ? "diff-char-changed" : undefined
                    }
                    key={index}
                  >
                    {segment.value}
                  </span>
                ))}
              </code>
            </div>
          ))}
        </div>
        <textarea
          className="diff-textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => syncScroll(event.currentTarget)}
          spellCheck={false}
          aria-label={label}
        />
      </div>
    </div>
  );
}

export function DiffTool({ definition, messages, locale }: ToolComponentProps) {
  const [before, setBefore] = useState(
    "const status = 'draft';\nconsole.log(status);\n",
  );
  const [after, setAfter] = useState(
    "const status = 'ready';\nconsole.info(status);\n",
  );
  const [mode, setMode] = useState<"lines" | "characters">("lines");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const request = useMemo(
    () =>
      ({
        operation: "diff",
        before,
        after,
        mode,
        ignoreWhitespace,
      }) as const,
    [after, before, ignoreWhitespace, mode],
  );
  const worker = useLiveWorkerResult<DiffWorkerResult>(request, definition);
  const result = worker.value ?? {
    model: { left: [], right: [] },
    text: "",
  };
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
              {messages.tool.lines}
            </button>
            <button
              aria-pressed={mode === "characters"}
              onClick={() => setMode("characters")}
            >
              {messages.tool.characters}
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
      {worker.error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          {localizeToolError(worker.error, messages)}
        </div>
      )}
      <div className="diff-workspace" data-testid="inline-diff">
        <DiffPane
          label={messages.tool.original}
          value={before}
          onChange={setBefore}
          lines={result.model.left}
          side="left"
        />
        <DiffPane
          label={messages.tool.changed}
          value={after}
          onChange={setAfter}
          lines={result.model.right}
          side="right"
        />
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {locale === "zh"
            ? "差异直接显示在左右文本中"
            : "Differences are highlighted directly in both editors"}
        </span>
        <span className="badge">
          {
            result.model.left.filter(
              (line) => line.tone !== "unchanged" && line.tone !== "empty",
            ).length
          }
        </span>
      </div>
    </section>
  );
}
