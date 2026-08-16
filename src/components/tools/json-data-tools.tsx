"use client";

import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  CircleAlert,
  Copy,
} from "lucide-react";
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { copyToClipboard } from "@/lib/clipboard";
import { localizeToolError } from "@/i18n/errors";
import type { JsonTreeResult, JsonValue } from "@/lib/tools";
import type { ToolWorkerRequest } from "@/lib/tool-worker-protocol";
import type { ToolComponentProps } from "@/lib/types";
import {
  ActionButton,
  ClearButton,
  CopyButton,
  DownloadButton,
} from "./tool-actions";
import { TextWorkbench } from "./text-workbench";
import { useLiveWorkerResult } from "./use-live-worker-result";

const example = JSON.stringify(
  {
    project: "DevToolbox",
    private: true,
    tools: ["JSON", "Base64", "Regex"],
    limits: { local: true, maxInputMb: 5 },
  },
  null,
  2,
);

type JsonConversionOperation = "json-to-yaml" | "json-to-xml" | "json-to-csv";

function JsonConverterTool({
  definition,
  locale,
  messages,
  operation,
  format,
  filename,
}: ToolComponentProps & {
  operation: JsonConversionOperation;
  format: string;
  filename: string;
}) {
  const zh = locale === "zh";
  const workerTask = useCallback(
    (input: string): ToolWorkerRequest => ({ operation, input }),
    [operation],
  );
  return (
    <TextWorkbench
      messages={messages}
      title={zh ? `JSON 转 ${format}` : `JSON to ${format}`}
      inputLabel={zh ? "JSON 输入" : "JSON input"}
      outputLabel={zh ? `${format} 输出` : `${format} output`}
      initialInput={example}
      actionLabel={zh ? `转换为 ${format}` : `Convert to ${format}`}
      filename={filename}
      definition={definition}
      workerTask={workerTask}
    />
  );
}

export function JsonToYamlTool(props: ToolComponentProps) {
  return (
    <JsonConverterTool
      {...props}
      operation="json-to-yaml"
      format="YAML"
      filename="data.yaml"
    />
  );
}

export function JsonToXmlTool(props: ToolComponentProps) {
  return (
    <JsonConverterTool
      {...props}
      operation="json-to-xml"
      format="XML"
      filename="data.xml"
    />
  );
}

export function JsonToCsvTool(props: ToolComponentProps) {
  return (
    <JsonConverterTool
      {...props}
      operation="json-to-csv"
      format="CSV"
      filename="data.csv"
    />
  );
}

const pageSize = 100;

function isContainer(value: JsonValue): value is
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    } {
  return value !== null && typeof value === "object";
}

function valueType(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function childCount(value: JsonValue): number {
  if (Array.isArray(value)) return value.length;
  if (value !== null && typeof value === "object") {
    return Object.keys(value).length;
  }
  return 0;
}

function childEntries(
  value: JsonValue,
  limit: number,
): Array<{ key: string; value: JsonValue; index?: number }> {
  if (Array.isArray(value)) {
    return value
      .slice(0, limit)
      .map((child, index) => ({ key: String(index), value: child, index }));
  }
  if (value !== null && typeof value === "object") {
    const result: Array<{ key: string; value: JsonValue }> = [];
    for (const key in value) {
      if (!Object.hasOwn(value, key)) continue;
      result.push({ key, value: value[key] });
      if (result.length >= limit) break;
    }
    return result;
  }
  return [];
}

function childPath(parent: string, key: string, index?: number): string {
  if (index !== undefined) return `${parent}[${index}]`;
  return /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`;
}

function leafValue(value: JsonValue): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null) return "null";
  return String(value);
}

function JsonTreeNode({
  name,
  path,
  value,
  depth,
  expanded,
  visibleCounts,
  locale,
  onToggle,
  onShowMore,
  onCopyPath,
}: {
  name: string;
  path: string;
  value: JsonValue;
  depth: number;
  expanded: Set<string>;
  visibleCounts: Map<string, number>;
  locale: ToolComponentProps["locale"];
  onToggle: (path: string) => void;
  onShowMore: (path: string) => void;
  onCopyPath: (path: string) => void;
}) {
  const container = isContainer(value);
  const open = expanded.has(path);
  const total = childCount(value);
  const visible = visibleCounts.get(path) ?? pageSize;
  const children = container && open ? childEntries(value, visible) : [];
  const zh = locale === "zh";
  const toggleLabel = open
    ? zh
      ? `折叠 ${path}`
      : `Collapse ${path}`
    : zh
      ? `展开 ${path}`
      : `Expand ${path}`;
  const style = {
    "--json-tree-indent": `${Math.min(depth, 12) * 16}px`,
  } as CSSProperties;

  return (
    <div className="json-tree-node">
      <div
        className="json-tree-row"
        role="treeitem"
        aria-expanded={container ? open : undefined}
        aria-level={depth + 1}
        aria-selected={false}
        style={style}
      >
        {container && total > 0 ? (
          <button
            type="button"
            className="icon-button subtle json-tree-toggle"
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={() => onToggle(path)}
          >
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : (
          <span className="json-tree-toggle-spacer" aria-hidden="true" />
        )}
        <code className="json-tree-key" title={name}>
          {name}
        </code>
        <span className={`json-tree-type json-tree-type-${valueType(value)}`}>
          {valueType(value)}
        </span>
        <code className="json-tree-value">
          {container
            ? Array.isArray(value)
              ? `[${total}]`
              : `{${total}}`
            : leafValue(value)}
        </code>
        <button
          type="button"
          className="icon-button subtle json-tree-path"
          aria-label={zh ? `复制路径 ${path}` : `Copy path ${path}`}
          title={zh ? `复制 JSONPath：${path}` : `Copy JSONPath: ${path}`}
          onClick={() => onCopyPath(path)}
        >
          <Copy size={14} />
        </button>
      </div>
      {children.length > 0 && (
        <div role="group">
          {children.map((child) => {
            const nextPath = childPath(path, child.key, child.index);
            return (
              <JsonTreeNode
                key={nextPath}
                name={
                  child.index === undefined ? child.key : `[${child.index}]`
                }
                path={nextPath}
                value={child.value}
                depth={depth + 1}
                expanded={expanded}
                visibleCounts={visibleCounts}
                locale={locale}
                onToggle={onToggle}
                onShowMore={onShowMore}
                onCopyPath={onCopyPath}
              />
            );
          })}
          {total > visible && (
            <button
              type="button"
              className="json-tree-more"
              style={style}
              onClick={() => onShowMore(path)}
            >
              {zh
                ? `再显示 ${Math.min(pageSize, total - visible)} 项`
                : `Show ${Math.min(pageSize, total - visible)} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function JsonTreeViewerTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [input, setInput] = useState(example);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["$"]));
  const [visibleCounts, setVisibleCounts] = useState<Map<string, number>>(
    () => new Map(),
  );
  const request = useMemo(
    () => ({ operation: "json-tree", input }) as const,
    [input],
  );
  const result = useLiveWorkerResult<JsonTreeResult>(request, definition, 120);
  const { toast } = useToast();

  const toggle = (path: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };
  const showMore = (path: string) => {
    setVisibleCounts((current) => {
      const next = new Map(current);
      next.set(path, (next.get(path) ?? pageSize) + pageSize);
      return next;
    });
  };
  const copyPath = async (path: string) => {
    try {
      await copyToClipboard(path);
      toast(zh ? `已复制路径 ${path}` : `Copied path ${path}`);
    } catch {
      toast(messages.workbench.clipboardError, "error");
    }
  };
  const expandTwoLevels = () => {
    if (!result.value) return;
    const next = new Set<string>();
    const visit = (value: JsonValue, path: string, depth: number) => {
      if (!isContainer(value) || next.size >= 500) return;
      next.add(path);
      if (depth >= 1) return;
      for (const child of childEntries(value, pageSize)) {
        visit(child.value, childPath(path, child.key, child.index), depth + 1);
      }
    };
    visit(result.value.value, "$", 0);
    setExpanded(next);
  };

  return (
    <section className="tool-workspace card json-tree-workspace">
      <div className="workspace-header">
        <h2>{zh ? "JSON Tree Viewer" : "JSON tree viewer"}</h2>
        <div className="workspace-actions">
          <ActionButton
            icon={ChevronsDown}
            disabled={!result.value}
            onClick={expandTwoLevels}
          >
            {zh ? "展开两层" : "Expand two levels"}
          </ActionButton>
          <ActionButton
            icon={ChevronsUp}
            disabled={!result.value}
            onClick={() => setExpanded(new Set())}
          >
            {zh ? "全部折叠" : "Collapse all"}
          </ActionButton>
          <ClearButton
            messages={messages}
            onClick={() => {
              setInput("");
              setExpanded(new Set());
              setVisibleCounts(new Map());
            }}
          />
          <CopyButton messages={messages} value={result.value ? input : ""} />
          <DownloadButton
            messages={messages}
            value={result.value ? input : ""}
            filename="data.json"
            type="application/json;charset=utf-8"
          />
        </div>
      </div>
      {result.error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          {localizeToolError(result.error, messages)}
        </div>
      )}
      <div className="workspace-grid json-tree-grid">
        <label className="workspace-panel">
          <span className="panel-label">{zh ? "JSON 输入" : "JSON input"}</span>
          <textarea
            className="editor"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
          />
        </label>
        <div className="workspace-panel json-tree-panel">
          <div className="panel-label">
            <span>{zh ? "结构树" : "Structure"}</span>
            {result.value && (
              <span>
                {result.value.stats.nodes.toLocaleString()}{" "}
                {zh ? "个节点" : "nodes"}
              </span>
            )}
          </div>
          <div
            className="json-tree-scroll"
            role="tree"
            aria-label={zh ? "JSON 结构树" : "JSON structure tree"}
          >
            {result.value && (
              <JsonTreeNode
                name="$"
                path="$"
                value={result.value.value}
                depth={0}
                expanded={expanded}
                visibleCounts={visibleCounts}
                locale={locale}
                onToggle={toggle}
                onShowMore={showMore}
                onCopyPath={(path) => void copyPath(path)}
              />
            )}
          </div>
        </div>
      </div>
      <div className="workspace-footer json-tree-stats">
        {result.value ? (
          <>
            <span>
              {zh ? "对象" : "Objects"}:{" "}
              {result.value.stats.objects.toLocaleString()}
            </span>
            <span>
              {zh ? "数组" : "Arrays"}:{" "}
              {result.value.stats.arrays.toLocaleString()}
            </span>
            <span>
              {zh ? "基础值" : "Primitives"}:{" "}
              {result.value.stats.primitives.toLocaleString()}
            </span>
            <span>
              {zh ? "最大深度" : "Max depth"}: {result.value.stats.maxDepth}
            </span>
          </>
        ) : (
          <span className="workspace-footer-meta">
            {zh
              ? "输入有效 JSON 以浏览结构。"
              : "Enter valid JSON to inspect its structure."}
          </span>
        )}
      </div>
    </section>
  );
}
