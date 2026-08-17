"use client";

import { CircleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { interpolate } from "@/i18n";
import { localizeToolError } from "@/i18n/errors";
import type {
  RegexExplanationToken,
  RegexResult,
  RegexTokenKind,
} from "@/lib/tools";
import type { ToolComponentProps } from "@/lib/types";
import { useLiveWorkerResult } from "./use-live-worker-result";

interface RegexTemplate {
  id: string;
  label: { en: string; zh: string };
  pattern: string;
  flags: string;
  input: string;
  replacement: string;
}

const regexTemplates: RegexTemplate[] = [
  {
    id: "email",
    label: { en: "Email address", zh: "邮箱地址" },
    pattern: "\\b[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}\\b",
    flags: "gi",
    input: "Contact dev@example.com or support@example.org for help.",
    replacement: "<$&>",
  },
  {
    id: "url",
    label: { en: "HTTP URL", zh: "HTTP URL" },
    pattern: "https?://[^\\s<>'\\\"]+",
    flags: "gi",
    input: "Docs: https://example.com/guide?q=regex and http://localhost:3000.",
    replacement: "[$&]",
  },
  {
    id: "ipv4",
    label: { en: "IPv4 address", zh: "IPv4 地址" },
    pattern:
      "\\b(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)){3}\\b",
    flags: "g",
    input: "Allowed: 192.168.1.10; invalid: 999.10.10.10",
    replacement: "[IP:$&]",
  },
  {
    id: "iso-date",
    label: { en: "ISO date", zh: "ISO 日期" },
    pattern:
      "\\b(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])\\b",
    flags: "g",
    input: "Released 2026-08-17; previous 2025-12-01.",
    replacement: "$<day>/$<month>/$<year>",
  },
  {
    id: "uuid",
    label: { en: "UUID", zh: "UUID" },
    pattern:
      "\\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\b",
    flags: "gi",
    input: "Request 550e8400-e29b-41d4-a716-446655440000 completed.",
    replacement: "<uuid>",
  },
];

const tokenLabels: Record<RegexTokenKind, { en: string; zh: string }> = {
  literal: { en: "Literal text", zh: "字面文本" },
  escape: { en: "Escaped token", zh: "转义标记" },
  "character-class": { en: "Character class", zh: "字符类" },
  anchor: { en: "Position anchor", zh: "位置锚点" },
  "group-open": { en: "Group start", zh: "分组开始" },
  "group-close": { en: "Group end", zh: "分组结束" },
  alternation: { en: "Alternative", zh: "分支选择" },
  quantifier: { en: "Quantifier", zh: "数量限定" },
  dot: { en: "Any character", zh: "任意字符" },
};

function tokenDescription(item: RegexExplanationToken, zh: boolean): string {
  const special: Record<string, { en: string; zh: string }> = {
    "\\d": { en: "Decimal digit", zh: "十进制数字" },
    "\\D": { en: "Non-digit", zh: "非数字字符" },
    "\\w": { en: "Word character", zh: "单词字符" },
    "\\W": { en: "Non-word character", zh: "非单词字符" },
    "\\s": { en: "Whitespace", zh: "空白字符" },
    "\\S": { en: "Non-whitespace", zh: "非空白字符" },
    "\\b": { en: "Word boundary", zh: "单词边界" },
    "^": { en: "Start of input or line", zh: "输入或行的开头" },
    $: { en: "End of input or line", zh: "输入或行的结尾" },
    ".": {
      en: "Any character except line terminators",
      zh: "除换行符外的任意字符",
    },
    "(?:": { en: "Non-capturing group", zh: "非捕获分组" },
    "(?=": { en: "Positive lookahead", zh: "正向先行断言" },
    "(?!": { en: "Negative lookahead", zh: "负向先行断言" },
    "(?<=": { en: "Positive lookbehind", zh: "正向后行断言" },
    "(?<!": { en: "Negative lookbehind", zh: "负向后行断言" },
    "|": { en: "Match the left or right branch", zh: "匹配左侧或右侧分支" },
  };
  const resolved = special[item.token] ?? tokenLabels[item.kind];
  if (item.kind === "group-open" && item.token.startsWith("(?<")) {
    return zh ? "命名捕获分组" : "Named capturing group";
  }
  if (item.kind === "quantifier") {
    return zh ? `重复次数：${item.token}` : `Repetition: ${item.token}`;
  }
  return zh ? resolved.zh : resolved.en;
}

const MAX_CAPTURE_ROWS = 200;
const MAX_EXPLANATION_ROWS = 200;

export function RegexTool({
  definition,
  messages,
  locale,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const initial = regexTemplates[0];
  const [template, setTemplate] = useState(initial.id);
  const [pattern, setPattern] = useState(initial.pattern);
  const [flags, setFlags] = useState(initial.flags);
  const [input, setInput] = useState(initial.input);
  const [replacement, setReplacement] = useState(initial.replacement);
  const request = useMemo(
    () =>
      ({
        operation: "regex-test",
        pattern,
        flags,
        input,
        replacement,
      }) as const,
    [flags, input, pattern, replacement],
  );
  const result = useLiveWorkerResult<RegexResult>(request, definition);
  const captureRows = useMemo(
    () =>
      (result.value?.matches ?? [])
        .flatMap((match, matchIndex) =>
          match.groups.map((group) => ({
            match: matchIndex + 1,
            index: match.index,
            ...group,
          })),
        )
        .slice(0, MAX_CAPTURE_ROWS),
    [result.value],
  );
  const totalCaptures =
    result.value?.matches.reduce(
      (total, match) => total + match.groups.length,
      0,
    ) ?? 0;
  const explanation = (result.value?.explanation ?? []).slice(
    0,
    MAX_EXPLANATION_ROWS,
  );

  const toggleFlag = (flag: string) =>
    setFlags((current) =>
      current.includes(flag) ? current.replace(flag, "") : current + flag,
    );

  const applyTemplate = (id: string) => {
    setTemplate(id);
    const selected = regexTemplates.find((item) => item.id === id);
    if (!selected) return;
    setPattern(selected.pattern);
    setFlags(selected.flags);
    setInput(selected.input);
    setReplacement(selected.replacement);
  };

  return (
    <section className="tool-workspace card regex-workspace">
      <div className="workspace-header">
        <h2>{zh ? "Regex Playground" : "Regex playground"}</h2>
        <select
          className="select regex-template-select"
          value={template}
          onChange={(event) => applyTemplate(event.target.value)}
          aria-label={zh ? "常用正则模板" : "Common regex template"}
        >
          <option value="custom">{zh ? "自定义模式" : "Custom pattern"}</option>
          {regexTemplates.map((item) => (
            <option value={item.id} key={item.id}>
              {zh ? item.label.zh : item.label.en}
            </option>
          ))}
        </select>
      </div>
      <div className="regex-controls">
        <label className="field regex-pattern-field">
          <span>{messages.tool.pattern}</span>
          <input
            id="regex-pattern"
            className="input mono"
            value={pattern}
            onChange={(event) => {
              setPattern(event.target.value);
              setTemplate("custom");
            }}
          />
        </label>
        <div
          className="option-row regex-flags"
          aria-label={zh ? "正则 Flags" : "Regex flags"}
        >
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
        <label className="field regex-replacement-field">
          <span>{zh ? "替换表达式" : "Replacement"}</span>
          <input
            className="input mono"
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
            aria-label={zh ? "替换表达式" : "Replacement expression"}
          />
        </label>
      </div>
      {result.error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{localizeToolError(result.error, messages)}</span>
        </div>
      )}
      <div className="workspace-grid regex-main-grid">
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
          <div className="editor editor-output" aria-live="polite">
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
      <div className="regex-details-grid">
        <section className="regex-detail-panel">
          <div className="panel-label">
            <span>{zh ? "捕获组" : "Capture groups"}</span>
            <span>{totalCaptures}</span>
          </div>
          <div className="regex-table-wrap">
            {captureRows.length ? (
              <table className="encoding-data-table regex-capture-table">
                <thead>
                  <tr>
                    <th>{zh ? "匹配" : "Match"}</th>
                    <th>{zh ? "位置" : "Index"}</th>
                    <th>{zh ? "分组" : "Group"}</th>
                    <th>{zh ? "值" : "Value"}</th>
                  </tr>
                </thead>
                <tbody>
                  {captureRows.map((row) => (
                    <tr key={`${row.match}-${row.number}`}>
                      <td>#{row.match}</td>
                      <td>{row.index}</td>
                      <td>
                        {row.name ? `${row.number} · ${row.name}` : row.number}
                      </td>
                      <td>
                        <code>
                          {row.value ?? (zh ? "未参与" : "Unmatched")}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="regex-empty">
                {zh
                  ? "当前模式没有已匹配的捕获组。"
                  : "No capture groups matched."}
              </p>
            )}
          </div>
          {totalCaptures > MAX_CAPTURE_ROWS && (
            <div className="regex-truncated">
              {zh
                ? `仅展示前 ${MAX_CAPTURE_ROWS} 个捕获组。`
                : `Showing the first ${MAX_CAPTURE_ROWS} capture groups.`}
            </div>
          )}
        </section>
        <section className="regex-detail-panel">
          <div className="panel-label">
            <span>{zh ? "替换结果" : "Replacement result"}</span>
            <span>
              {(result.value?.replacementResult.length ?? 0).toLocaleString()}{" "}
              chars
            </span>
          </div>
          <pre
            className="editor editor-output regex-replacement-output"
            aria-label={zh ? "替换结果" : "Replacement result"}
          >
            {result.value?.replacementResult ?? ""}
          </pre>
        </section>
      </div>
      <section className="regex-explanation-panel">
        <div className="panel-label">
          <span>{zh ? "Regex 解释" : "Regex explanation"}</span>
          <span>{explanation.length}</span>
        </div>
        <div className="regex-token-list">
          {explanation.map((item, index) => (
            <div className="regex-token-row" key={`${index}-${item.token}`}>
              <code>{item.token}</code>
              <span>{tokenDescription(item, zh)}</span>
            </div>
          ))}
        </div>
        {(result.value?.explanation.length ?? 0) > MAX_EXPLANATION_ROWS && (
          <div className="regex-truncated">
            {zh
              ? `仅展示前 ${MAX_EXPLANATION_ROWS} 个语法标记。`
              : `Showing the first ${MAX_EXPLANATION_ROWS} syntax tokens.`}
          </div>
        )}
      </section>
      <section className="regex-flavor-panel">
        <div className="panel-label">
          <span>{zh ? "JavaScript 与 PCRE" : "JavaScript and PCRE"}</span>
          <span className="badge">JavaScript RegExp</span>
        </div>
        <div className="regex-flavor-grid">
          {[
            zh
              ? ["定界符", "输入模式本身，不要包含 /pattern/ 两侧斜杠。"]
              : [
                  "Delimiters",
                  "Enter the pattern only, without /pattern/ slashes.",
                ],
            zh
              ? ["Flags", "支持 g、i、m、s、u；PCRE 的 x 扩展模式不可用。"]
              : [
                  "Flags",
                  "Supports g, i, m, s, and u; PCRE extended x mode is unavailable.",
                ],
            zh
              ? ["PCRE 专属", "原子分组、递归、分支重置和占有量词不受支持。"]
              : [
                  "PCRE-only",
                  "Atomic groups, recursion, branch reset, and possessive quantifiers are unsupported.",
                ],
            zh
              ? [
                  "命名分组",
                  "使用 (?<name>...) 和 $<name> 的 JavaScript 语法。",
                ]
              : [
                  "Named groups",
                  "Use JavaScript syntax: (?<name>...) and $<name>.",
                ],
          ].map(([term, detail]) => (
            <div key={term}>
              <strong>{term}</strong>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </section>
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
