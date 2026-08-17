"use client";

import { useMemo, useState } from "react";
import { CircleAlert, Shuffle, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { formatBytes, TOOL_LIMITS } from "@/lib/config";
import { localizeToolError } from "@/i18n/errors";
import type { ToolWorkerRequest } from "@/lib/tool-worker-protocol";
import {
  extractColorInput,
  type ColorPaletteEntry,
  type ColorValue,
} from "@/lib/tools/number-color";
import type { ToolComponentProps } from "@/lib/types";
import { ActionButton, CopyButton, DownloadButton } from "./tool-actions";
import { useLiveWorkerResult } from "./use-live-worker-result";

const COLOR_LABELS = {
  en: {
    source: "Source color",
    conversion: "Conversions",
    palette: "Palette",
    css: "CSS generator",
    rgb: "RGB",
    hsl: "HSL",
    hsv: "HSV",
    cmyk: "CMYK",
    complementary: "Complementary",
    contrast: "Accessible contrast",
    contrastHint: "WCAG relative contrast ratio",
    black: "Black text",
    white: "White text",
    preferred: "Recommended",
    random: "Random color",
    copyHex: "Copy HEX",
    copyPalette: "Copy palette value",
    level: "Palette level",
    importColor: "Import color file",
    exportJson: "Download JSON",
    importError: "Could not import a color from this file.",
  },
  zh: {
    source: "源颜色",
    conversion: "颜色转换",
    palette: "调色板",
    css: "CSS 生成器",
    rgb: "RGB",
    hsl: "HSL",
    hsv: "HSV",
    cmyk: "CMYK",
    complementary: "互补色",
    contrast: "可读性对比度",
    contrastHint: "WCAG 相对对比度",
    black: "黑色文字",
    white: "白色文字",
    preferred: "推荐",
    random: "随机颜色",
    copyHex: "复制 HEX",
    copyPalette: "复制调色板颜色",
    level: "调色板级别",
    importColor: "导入颜色文件",
    exportJson: "下载 JSON",
    importError: "无法从此文件导入颜色。",
  },
} as const;

type ColorLabels = (typeof COLOR_LABELS)["en"] | (typeof COLOR_LABELS)["zh"];
type ColorView = "conversion" | "palette" | "css";

function formatRgb(value: ColorValue["rgb"]): string {
  return `rgb(${value.r}, ${value.g}, ${value.b})`;
}

function formatHsl(value: ColorValue["hsl"]): string {
  return `hsl(${value.h}, ${value.s}%, ${value.l}%)`;
}

function formatHsv(value: ColorValue["hsv"]): string {
  return `hsv(${value.h}, ${value.s}%, ${value.v}%)`;
}

function formatCmyk(value: ColorValue["cmyk"]): string {
  return `cmyk(${value.c}%, ${value.m}%, ${value.y}%, ${value.k}%)`;
}

function ValueRow({
  label,
  value,
  messages,
}: {
  label: string;
  value: string;
  messages: ToolComponentProps["messages"];
}) {
  return (
    <div className="color-value-row">
      <span className="field-label">{label}</span>
      <code>{value}</code>
      <CopyButton messages={messages} value={value} />
    </div>
  );
}

function PaletteSwatch({
  entry,
  labels,
  messages,
}: {
  entry: ColorPaletteEntry;
  labels: ColorLabels;
  messages: ToolComponentProps["messages"];
}) {
  return (
    <div
      className="color-palette-swatch"
      style={{ background: entry.hex, color: entry.contrast }}
      title={`${labels.level} ${entry.step}: ${entry.hex}`}
    >
      <span>{entry.step}</span>
      <code>{entry.hex}</code>
      <CopyButton
        messages={messages}
        value={entry.hex}
        label={labels.copyPalette}
      />
    </div>
  );
}

export function ColorTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const labels = COLOR_LABELS[locale];
  const [input, setInput] = useState("#2563EB");
  const [view, setView] = useState<ColorView>("conversion");
  const [importError, setImportError] = useState("");
  const workerRequest = useMemo<ToolWorkerRequest>(
    () => ({ operation: "color-analyze", input }),
    [input],
  );
  const result = useLiveWorkerResult<ColorValue>(workerRequest, definition);
  const value = result.value;
  const viewLabels: Record<ColorView, string> = {
    conversion: labels.conversion,
    palette: labels.palette,
    css: labels.css,
  };

  const randomize = () => {
    const bytes = new Uint8Array(3);
    crypto.getRandomValues(bytes);
    setInput(
      `#${Array.from(bytes)
        .map((channel) => channel.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()}`,
    );
  };

  const importColor = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportError("");
    if (file.size > TOOL_LIMITS.file) {
      setImportError(
        localizeToolError(
          `Input is ${formatBytes(file.size)}. The limit for this tool is ${formatBytes(TOOL_LIMITS.file)}.`,
          messages,
        ),
      );
      return;
    }
    try {
      const imported = extractColorInput(await file.text());
      if (!imported.trim()) throw new Error(labels.importError);
      setInput(imported);
    } catch (caught) {
      setImportError(
        caught instanceof Error
          ? localizeToolError(caught.message, messages)
          : labels.importError,
      );
    }
  };

  return (
    <section className="tool-workspace card color-converter-workspace">
      <div className="workspace-header color-input-header">
        <label className="field color-input-field" htmlFor="color-input">
          <span>{messages.tool.colorInput}</span>
          <input
            id="color-input"
            className="input mono"
            aria-label={messages.tool.colorInput}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        <div className="color-input-actions">
          {value && (
            <input
              type="color"
              className="color-picker"
              value={value.hex}
              onChange={(event) => setInput(event.target.value)}
              aria-label={messages.tool.pickColor}
            />
          )}
          <ActionButton icon={Shuffle} onClick={randomize}>
            {labels.random}
          </ActionButton>
        </div>
      </div>
      <div className="color-input-actions">
        <label className="button button-sm" htmlFor="color-import-file">
          <Upload size={15} />
          {labels.importColor}
        </label>
        <input
          id="color-import-file"
          className="sr-only"
          type="file"
          accept=".css,.json,.txt,text/css,application/json,text/plain"
          onChange={importColor}
        />
      </div>
      {(result.error || importError) && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>
            {localizeToolError(result.error || importError, messages)}
          </span>
        </div>
      )}
      {value && (
        <div aria-live="polite">
          <div
            className="color-source-preview"
            style={{ background: value.hex, color: value.contrast.preferred }}
          >
            <div>
              <span className="field-label">{labels.source}</span>
              <strong>{value.hex}</strong>
            </div>
            <CopyButton
              messages={messages}
              value={value.hex}
              label={labels.copyHex}
            />
          </div>
          <div
            className="color-view-tabs"
            role="tablist"
            aria-label={labels.source}
          >
            {(Object.keys(viewLabels) as ColorView[]).map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={view === item}
                aria-controls={`color-panel-${item}`}
                id={`color-tab-${item}`}
                onClick={() => setView(item)}
                key={item}
              >
                {viewLabels[item]}
              </button>
            ))}
          </div>
          <div
            className="color-view-panel"
            role="tabpanel"
            id={`color-panel-${view}`}
            aria-labelledby={`color-tab-${view}`}
          >
            {view === "conversion" && (
              <div className="color-conversion-view">
                <div className="color-value-table">
                  <ValueRow label="HEX" value={value.hex} messages={messages} />
                  <ValueRow
                    label={labels.rgb}
                    value={formatRgb(value.rgb)}
                    messages={messages}
                  />
                  <ValueRow
                    label={labels.hsl}
                    value={formatHsl(value.hsl)}
                    messages={messages}
                  />
                  <ValueRow
                    label={labels.hsv}
                    value={formatHsv(value.hsv)}
                    messages={messages}
                  />
                  <ValueRow
                    label={labels.cmyk}
                    value={formatCmyk(value.cmyk)}
                    messages={messages}
                  />
                </div>
                <div className="color-detail-section">
                  <div className="color-detail-heading">
                    <strong>{labels.contrast}</strong>
                    <span className="muted">{labels.contrastHint}</span>
                  </div>
                  <div className="color-contrast-grid">
                    <div
                      className="color-contrast-sample"
                      style={{ background: value.hex, color: "#000000" }}
                    >
                      <span>{labels.black}</span>
                      <strong>{value.contrast.blackRatio}:1</strong>
                      {value.contrast.preferred === "#000000" && (
                        <span className="badge">{labels.preferred}</span>
                      )}
                    </div>
                    <div
                      className="color-contrast-sample"
                      style={{ background: value.hex, color: "#FFFFFF" }}
                    >
                      <span>{labels.white}</span>
                      <strong>{value.contrast.whiteRatio}:1</strong>
                      {value.contrast.preferred === "#FFFFFF" && (
                        <span className="badge">{labels.preferred}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="color-detail-section color-complementary">
                  <div className="color-detail-heading">
                    <strong>{labels.complementary}</strong>
                  </div>
                  <div className="color-complementary-row">
                    <span
                      className="color-complementary-swatch"
                      style={{ background: value.complementary.hex }}
                    />
                    <code>{value.complementary.hex}</code>
                    <CopyButton
                      messages={messages}
                      value={value.complementary.hex}
                    />
                  </div>
                </div>
              </div>
            )}
            {view === "palette" && (
              <div className="color-palette-view">
                <div className="color-palette-grid">
                  {value.palette.map((entry) => (
                    <PaletteSwatch
                      entry={entry}
                      labels={labels}
                      messages={messages}
                      key={entry.step}
                    />
                  ))}
                </div>
              </div>
            )}
            {view === "css" && (
              <div className="color-css-view">
                <div className="workspace-actions">
                  <CopyButton messages={messages} value={value.css} />
                  <DownloadButton
                    messages={messages}
                    value={value.css}
                    filename="color-variables.css"
                    type="text/css"
                  />
                  <DownloadButton
                    messages={messages}
                    value={JSON.stringify(value, null, 2)}
                    filename="color-analysis.json"
                    type="application/json"
                    label={labels.exportJson}
                  />
                </div>
                <pre
                  className="editor editor-output color-css-output"
                  aria-label={labels.css}
                >
                  {value.css}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.common.localBrowser}
        </span>
      </div>
    </section>
  );
}
