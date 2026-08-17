"use client";

import { CircleAlert } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { type DiffLine, type DiffMode } from "@/lib/tools";
import type { DiffWorkerResult } from "@/lib/tool-worker-protocol";
import { localizeToolError } from "@/i18n/errors";
import { CopyButton, DownloadButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";
import { useLiveWorkerResult } from "./use-live-worker-result";

function DiffHighlightLines({ lines }: { lines: DiffLine[] }) {
  return lines.map((line, row) => (
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
            className={segment.changed ? "diff-char-changed" : undefined}
            key={index}
          >
            {segment.value}
          </span>
        ))}
      </code>
    </div>
  ));
}

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
          <DiffHighlightLines lines={lines} />
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

function JsonInputPane({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="workspace-panel">
      <div className="panel-label">
        <span>{label}</span>
        <span>{value.split("\n").length} lines</span>
      </div>
      <textarea
        className="editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        aria-label={label}
      />
    </div>
  );
}

function DiffResultPane({
  label,
  value,
  lines,
}: {
  label: string;
  value: string;
  lines: DiffLine[];
}) {
  return (
    <div className="diff-pane">
      <div className="panel-label">
        <span>{label}</span>
        <span>{value ? value.split("\n").length - 1 : 0} lines</span>
      </div>
      <div className="diff-editor-shell">
        <div className="diff-highlight">
          <DiffHighlightLines lines={lines} />
        </div>
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
  const [mode, setMode] = useState<DiffMode>("lines");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const request = useMemo(
    () =>
      ({
        operation: "diff",
        before,
        after,
        mode,
        ignoreWhitespace,
        ignoreCase,
      }) as const,
    [after, before, ignoreCase, ignoreWhitespace, mode],
  );
  const worker = useLiveWorkerResult<DiffWorkerResult>(request, definition);
  const result = worker.value ?? {
    model: { left: [], right: [] },
    text: "",
    displayBefore: "",
    displayAfter: "",
  };
  return (
    <section className="tool-workspace card diff-tool-workspace">
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
            <button
              aria-pressed={mode === "json"}
              onClick={() => setMode("json")}
            >
              JSON
            </button>
          </div>
          {mode === "lines" && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(event) => setIgnoreWhitespace(event.target.checked)}
              />
              {messages.tool.ignoreWhitespace}
            </label>
          )}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(event) => setIgnoreCase(event.target.checked)}
            />
            {locale === "zh" ? "忽略大小写" : "Ignore case"}
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
      {mode === "json" ? (
        <>
          <div className="workspace-grid diff-json-input-grid">
            <JsonInputPane
              label={messages.tool.original}
              value={before}
              onChange={setBefore}
            />
            <JsonInputPane
              label={messages.tool.changed}
              value={after}
              onChange={setAfter}
            />
          </div>
          <div
            className="diff-workspace diff-json-result"
            data-testid="inline-diff"
          >
            <DiffResultPane
              label={
                locale === "zh" ? "规范化原始 JSON" : "Normalized original JSON"
              }
              value={result.displayBefore}
              lines={result.model.left}
            />
            <DiffResultPane
              label={
                locale === "zh"
                  ? "规范化修改后 JSON"
                  : "Normalized changed JSON"
              }
              value={result.displayAfter}
              lines={result.model.right}
            />
          </div>
        </>
      ) : (
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
      )}
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {locale === "zh"
            ? mode === "json"
              ? "对象键按字典序规范化，数组顺序保持不变"
              : "差异直接显示在左右文本中"
            : mode === "json"
              ? "Object keys are normalized; array order is preserved"
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
