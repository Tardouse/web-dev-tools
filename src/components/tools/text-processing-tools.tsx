"use client";

import { CircleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { byteLength, formatBytes } from "@/lib/config";
import { localizeToolError } from "@/i18n/errors";
import {
  DATA_SIZE_UNITS,
  type DataSizeConversion,
  type DataSizeUnit,
  type LineNumberAction,
  type LineNumberSeparator,
  type LineSortMode,
  type TextDeduplicationMode,
  type TextMergeMode,
  type TextSplitMode,
  type TextSplitOutput,
} from "@/lib/tools";
import { isToolTaskCancellation, runToolWorker } from "@/lib/tool-execution";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";
import {
  ClearButton,
  CopyButton,
  DownloadButton,
  RunButton,
} from "./tool-actions";
import { useLiveWorkerResult } from "./use-live-worker-result";

function formatDataValue(value: number, locale: "en" | "zh"): string {
  if (value === 0) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1e15 || absolute < 1e-6) {
    return value.toExponential(6).replace(/\.?(0+)(?=e)/, "");
  }
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumSignificantDigits: 12,
  }).format(value);
}

export function DataSizeConverterTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [input, setInput] = useState("1");
  const [unit, setUnit] = useState<DataSizeUnit>("MiB");
  const request = useMemo(
    () => ({ operation: "data-size-convert", input, unit }) as const,
    [input, unit],
  );
  const result = useLiveWorkerResult<DataSizeConversion>(request, definition);
  const copyValue = useMemo(
    () =>
      result.value
        ? DATA_SIZE_UNITS.map(
            (target) =>
              `${formatDataValue(result.value!.values[target], locale)} ${target}`,
          ).join("\n")
        : "",
    [locale, result.value],
  );

  return (
    <section className="tool-workspace card data-size-workspace">
      <div className="workspace-header">
        <h2>{zh ? "数据大小换算" : "Data size conversion"}</h2>
        <CopyButton value={copyValue} messages={messages} />
      </div>
      {result.error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{localizeToolError(result.error, messages)}</span>
        </div>
      )}
      <div className="data-size-controls">
        <label className="field">
          <span>{zh ? "数值" : "Value"}</span>
          <input
            className="mono"
            inputMode="decimal"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label={zh ? "数据大小数值" : "Data size value"}
          />
        </label>
        <label className="field">
          <span>{zh ? "原单位" : "Source unit"}</span>
          <select
            value={unit}
            onChange={(event) => setUnit(event.target.value as DataSizeUnit)}
            aria-label={zh ? "数据大小原单位" : "Data size source unit"}
          >
            {DATA_SIZE_UNITS.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="metrics-grid data-size-results" aria-live="polite">
        {DATA_SIZE_UNITS.map((target) => (
          <div className="metric" key={target}>
            <strong className="metric-value data-size-value">
              {result.value
                ? formatDataValue(result.value.values[target], locale)
                : "-"}
            </strong>
            <span className="metric-label">{target}</span>
          </div>
        ))}
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          SI: 1 KB = 1000 B · IEC: 1 KiB = 1024 B
        </span>
      </div>
    </section>
  );
}

function TextToolCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="checkbox text-tool-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function LineCleanerTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [removeBlank, setRemoveBlank] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [trimLines, setTrimLines] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const workerTask = useCallback(
    (input: string) =>
      ({
        operation: "line-clean",
        input,
        options: {
          removeBlank,
          removeDuplicates,
          trimLines,
          caseSensitive,
        },
      }) as const,
    [caseSensitive, removeBlank, removeDuplicates, trimLines],
  );
  return (
    <TextWorkbench
      className="text-processing-workspace"
      messages={messages}
      definition={definition}
      title={zh ? "行清理" : "Line cleaner"}
      inputLabel={zh ? "待清理文本" : "Text to clean"}
      outputLabel={zh ? "清理结果" : "Cleaned text"}
      initialInput={"alpha\n\nbeta\nalpha\n  \ngamma"}
      actionLabel={zh ? "清理文本" : "Clean text"}
      filename="cleaned-lines.txt"
      workerTask={workerTask}
      options={
        <>
          <TextToolCheckbox
            checked={removeBlank}
            label={zh ? "删除空行" : "Remove blank lines"}
            onChange={setRemoveBlank}
          />
          <TextToolCheckbox
            checked={removeDuplicates}
            label={zh ? "删除重复行" : "Remove duplicate lines"}
            onChange={setRemoveDuplicates}
          />
          <TextToolCheckbox
            checked={trimLines}
            label={zh ? "去除首尾空格" : "Trim lines"}
            onChange={setTrimLines}
          />
          <TextToolCheckbox
            checked={caseSensitive}
            label={zh ? "区分大小写" : "Case-sensitive"}
            onChange={setCaseSensitive}
          />
        </>
      }
    />
  );
}

export function LineSorterTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [mode, setMode] = useState<LineSortMode>("natural");
  const [descending, setDescending] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const workerTask = useCallback(
    (input: string) =>
      ({
        operation: "line-sort",
        input,
        options: {
          mode,
          descending,
          caseSensitive,
          locale: zh ? ("zh-CN" as const) : ("en-US" as const),
        },
      }) as const,
    [caseSensitive, descending, mode, zh],
  );
  return (
    <TextWorkbench
      className="text-processing-workspace"
      messages={messages}
      definition={definition}
      title={zh ? "行排序与反转" : "Line sorter and reverser"}
      inputLabel={zh ? "待处理行" : "Lines to process"}
      outputLabel={zh ? "处理结果" : "Processed lines"}
      initialInput={"item10\nitem2\nitem1"}
      actionLabel={zh ? "处理行" : "Process lines"}
      filename="sorted-lines.txt"
      workerTask={workerTask}
      options={
        <>
          <select
            className="select text-tool-select"
            value={mode}
            onChange={(event) => setMode(event.target.value as LineSortMode)}
            aria-label={zh ? "排序方式" : "Line order"}
          >
            <option value="alphabetical">
              {zh ? "字典序" : "Alphabetical"}
            </option>
            <option value="natural">{zh ? "自然排序" : "Natural"}</option>
            <option value="length">{zh ? "按长度" : "By length"}</option>
            <option value="reverse">{zh ? "反转行" : "Reverse lines"}</option>
          </select>
          {mode !== "reverse" && (
            <TextToolCheckbox
              checked={descending}
              label={zh ? "降序" : "Descending"}
              onChange={setDescending}
            />
          )}
          {mode !== "reverse" && (
            <TextToolCheckbox
              checked={caseSensitive}
              label={zh ? "区分大小写" : "Case-sensitive"}
              onChange={setCaseSensitive}
            />
          )}
        </>
      }
    />
  );
}

export function LineNumbererTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [action, setAction] = useState<LineNumberAction>("add");
  const [start, setStart] = useState(1);
  const [pad, setPad] = useState(false);
  const [separator, setSeparator] = useState<LineNumberSeparator>("dot");
  const workerTask = useCallback(
    (input: string) =>
      ({
        operation: "line-number",
        input,
        options: { action, start, pad, separator },
      }) as const,
    [action, pad, separator, start],
  );
  return (
    <TextWorkbench
      className="text-processing-workspace"
      messages={messages}
      definition={definition}
      title={zh ? "行号处理" : "Line numberer"}
      inputLabel={zh ? "文本行" : "Text lines"}
      outputLabel={zh ? "行号结果" : "Line number result"}
      initialInput={"alpha\nbeta\ngamma"}
      actionLabel={
        action === "add"
          ? zh
            ? "添加行号"
            : "Add numbers"
          : zh
            ? "删除行号"
            : "Remove numbers"
      }
      filename="numbered-lines.txt"
      workerTask={workerTask}
      options={
        <>
          <div
            className="segmented"
            aria-label={zh ? "行号操作" : "Line number action"}
          >
            {(["add", "remove"] as const).map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={action === item}
                onClick={() => setAction(item)}
              >
                {item === "add"
                  ? zh
                    ? "添加"
                    : "Add"
                  : zh
                    ? "删除"
                    : "Remove"}
              </button>
            ))}
          </div>
          {action === "add" && (
            <input
              className="input text-tool-number"
              type="number"
              min={0}
              step={1}
              value={start}
              onChange={(event) =>
                setStart(
                  Math.max(0, Math.trunc(Number(event.target.value) || 0)),
                )
              }
              aria-label={zh ? "起始行号" : "First line number"}
            />
          )}
          {action === "add" && (
            <select
              className="select text-tool-select"
              value={separator}
              onChange={(event) =>
                setSeparator(event.target.value as LineNumberSeparator)
              }
              aria-label={zh ? "行号分隔符" : "Line number separator"}
            >
              <option value="dot">1. text</option>
              <option value="colon">1: text</option>
              <option value="tab">1 ⇥ text</option>
            </select>
          )}
          {action === "add" && (
            <TextToolCheckbox
              checked={pad}
              label={zh ? "补零对齐" : "Zero-pad"}
              onChange={setPad}
            />
          )}
        </>
      }
    />
  );
}

export function TextDeduplicatorTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [mode, setMode] = useState<TextDeduplicationMode>("words");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const workerTask = useCallback(
    (input: string) =>
      ({
        operation: "text-deduplicate",
        input,
        options: { mode, caseSensitive },
      }) as const,
    [caseSensitive, mode],
  );
  return (
    <TextWorkbench
      className="text-processing-workspace"
      messages={messages}
      definition={definition}
      title={zh ? "文本去重" : "Text deduplicator"}
      inputLabel={zh ? "待去重文本" : "Text to deduplicate"}
      outputLabel={zh ? "去重结果" : "Deduplicated text"}
      initialInput="alpha beta alpha gamma beta"
      actionLabel={zh ? "去重" : "Deduplicate"}
      filename="deduplicated.txt"
      workerTask={workerTask}
      options={
        <>
          <select
            className="select text-tool-select"
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as TextDeduplicationMode)
            }
            aria-label={zh ? "去重粒度" : "Deduplication unit"}
          >
            <option value="lines">{zh ? "按行" : "Lines"}</option>
            <option value="words">{zh ? "按词" : "Words"}</option>
            <option value="characters">{zh ? "按字符" : "Characters"}</option>
          </select>
          <TextToolCheckbox
            checked={caseSensitive}
            label={zh ? "区分大小写" : "Case-sensitive"}
            onChange={setCaseSensitive}
          />
        </>
      }
    />
  );
}

type SeparatorPreset = "newline" | "blank" | "space" | "custom";

function separatorValue(preset: SeparatorPreset, custom: string): string {
  if (preset === "newline") return "\n";
  if (preset === "blank") return "\n\n";
  if (preset === "space") return " ";
  return custom;
}

export function TextMergerTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [first, setFirst] = useState("alpha-1\nalpha-2");
  const [second, setSecond] = useState("beta-1\nbeta-2");
  const [mode, setMode] = useState<TextMergeMode>("append");
  const [separator, setSeparator] = useState<SeparatorPreset>("blank");
  const [customSeparator, setCustomSeparator] = useState(" | ");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const execution = useRef<AbortController | null>(null);
  useEffect(() => () => execution.current?.abort(), []);

  const run = useCallback(async () => {
    execution.current?.abort();
    const controller = new AbortController();
    execution.current = controller;
    setRunning(true);
    setError("");
    try {
      const result = await runToolWorker<string>(
        {
          operation: "text-merge",
          first,
          second,
          options: {
            mode,
            separator: separatorValue(separator, customSeparator),
          },
        },
        definition,
        controller.signal,
      );
      if (!controller.signal.aborted) setOutput(result);
    } catch (caught) {
      if (isToolTaskCancellation(caught)) return;
      setOutput("");
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
  }, [customSeparator, definition, first, messages, mode, second, separator]);

  const clear = () => {
    execution.current?.abort();
    execution.current = null;
    setRunning(false);
    setFirst("");
    setSecond("");
    setOutput("");
    setError("");
  };

  return (
    <section className="tool-workspace card text-merge-workspace">
      <div className="workspace-header">
        <h2>{zh ? "文本合并" : "Text merger"}</h2>
        <div className="workspace-actions">
          <div
            className="segmented"
            aria-label={zh ? "合并方式" : "Merge mode"}
          >
            {(["append", "interleave"] as const).map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={mode === item}
                onClick={() => setMode(item)}
              >
                {item === "append"
                  ? zh
                    ? "依次合并"
                    : "Append"
                  : zh
                    ? "交错行"
                    : "Interleave"}
              </button>
            ))}
          </div>
          {mode === "append" && (
            <select
              className="select text-tool-select"
              value={separator}
              onChange={(event) =>
                setSeparator(event.target.value as SeparatorPreset)
              }
              aria-label={zh ? "文本分隔符" : "Text separator"}
            >
              <option value="newline">{zh ? "换行" : "New line"}</option>
              <option value="blank">{zh ? "空行" : "Blank line"}</option>
              <option value="space">{zh ? "空格" : "Space"}</option>
              <option value="custom">{zh ? "自定义" : "Custom"}</option>
            </select>
          )}
          {mode === "append" && separator === "custom" && (
            <input
              className="input text-tool-delimiter"
              value={customSeparator}
              onChange={(event) => setCustomSeparator(event.target.value)}
              aria-label={zh ? "自定义文本分隔符" : "Custom text separator"}
            />
          )}
          <ClearButton onClick={clear} messages={messages} />
          <CopyButton value={output} messages={messages} />
          <DownloadButton
            value={output}
            filename="merged-text.txt"
            messages={messages}
          />
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}
      <div className="workspace-grid text-merge-inputs">
        <div className="workspace-panel">
          <div className="panel-label">
            <span>{zh ? "文本 A" : "Text A"}</span>
            <span>{formatBytes(byteLength(first))}</span>
          </div>
          <textarea
            className="editor"
            spellCheck={false}
            value={first}
            onChange={(event) => setFirst(event.target.value)}
            aria-label={zh ? "文本 A" : "Text A"}
          />
        </div>
        <div className="workspace-panel">
          <div className="panel-label">
            <span>{zh ? "文本 B" : "Text B"}</span>
            <span>{formatBytes(byteLength(second))}</span>
          </div>
          <textarea
            className="editor"
            spellCheck={false}
            value={second}
            onChange={(event) => setSecond(event.target.value)}
            aria-label={zh ? "文本 B" : "Text B"}
          />
        </div>
      </div>
      <div className="workspace-panel text-merge-output">
        <div className="panel-label">
          <span>{zh ? "合并结果" : "Merged result"}</span>
          <span>{formatBytes(byteLength(output))}</span>
        </div>
        <pre
          className="editor editor-output"
          data-placeholder={messages.workbench.outputPlaceholder}
          aria-live="polite"
        >
          {output}
        </pre>
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.common.localBrowser}
        </span>
        <RunButton
          onClick={run}
          label={
            running ? messages.common.working : zh ? "合并文本" : "Merge text"
          }
          disabled={running}
        />
      </div>
    </section>
  );
}

export function TextSplitterTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [mode, setMode] = useState<TextSplitMode>("comma");
  const [delimiter, setDelimiter] = useState("::");
  const [trimParts, setTrimParts] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [output, setOutput] = useState<TextSplitOutput>("lines");
  const workerTask = useCallback(
    (input: string) =>
      ({
        operation: "text-split",
        input,
        options: { mode, delimiter, trimParts, removeEmpty, output },
      }) as const,
    [delimiter, mode, output, removeEmpty, trimParts],
  );
  return (
    <TextWorkbench
      className="text-processing-workspace"
      messages={messages}
      definition={definition}
      title={zh ? "文本拆分" : "Text splitter"}
      inputLabel={zh ? "待拆分文本" : "Text to split"}
      outputLabel={zh ? "拆分结果" : "Split result"}
      initialInput="alpha, beta,, gamma"
      actionLabel={zh ? "拆分文本" : "Split text"}
      filename={output === "json" ? "split-text.json" : "split-text.txt"}
      workerTask={workerTask}
      options={
        <>
          <select
            className="select text-tool-select"
            value={mode}
            onChange={(event) => setMode(event.target.value as TextSplitMode)}
            aria-label={zh ? "拆分分隔方式" : "Split delimiter mode"}
          >
            <option value="lines">{zh ? "按换行" : "Line breaks"}</option>
            <option value="whitespace">{zh ? "按空白" : "Whitespace"}</option>
            <option value="comma">{zh ? "按逗号" : "Comma"}</option>
            <option value="custom">{zh ? "自定义" : "Custom"}</option>
          </select>
          {mode === "custom" && (
            <input
              className="input text-tool-delimiter"
              value={delimiter}
              onChange={(event) => setDelimiter(event.target.value)}
              aria-label={zh ? "自定义拆分分隔符" : "Custom split delimiter"}
            />
          )}
          <TextToolCheckbox
            checked={trimParts}
            label={zh ? "去除首尾空格" : "Trim parts"}
            onChange={setTrimParts}
          />
          <TextToolCheckbox
            checked={removeEmpty}
            label={zh ? "忽略空项" : "Skip empty parts"}
            onChange={setRemoveEmpty}
          />
          <select
            className="select text-tool-select"
            value={output}
            onChange={(event) =>
              setOutput(event.target.value as TextSplitOutput)
            }
            aria-label={zh ? "拆分输出格式" : "Split output format"}
          >
            <option value="lines">{zh ? "逐行输出" : "One per line"}</option>
            <option value="json">JSON</option>
          </select>
        </>
      }
    />
  );
}
