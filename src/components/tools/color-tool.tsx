"use client";

import { useMemo, useState } from "react";
import { CircleAlert } from "lucide-react";
import { parseColor } from "@/lib/tools";
import { CopyButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";
import { localizeToolError } from "@/i18n/errors";

export function ColorTool({ messages }: ToolComponentProps) {
  const [input, setInput] = useState("#2563EB");
  const parsed = useMemo(() => {
    try {
      return { value: parseColor(input), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid color.",
      };
    }
  }, [input]);
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="color-input">{messages.tool.colorInput}</label>
          <input
            id="color-input"
            className="input mono"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        {parsed.value && (
          <input
            type="color"
            value={parsed.value.hex}
            onChange={(event) => setInput(event.target.value)}
            aria-label={messages.tool.pickColor}
            style={{
              width: 48,
              height: 40,
              padding: 2,
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--surface)",
            }}
          />
        )}
      </div>
      {parsed.error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {localizeToolError(parsed.error, messages)}
        </div>
      )}
      {parsed.value && (
        <div style={{ padding: 18, display: "grid", gap: 18 }}>
          <div
            className="color-preview"
            style={{ background: parsed.value.hex }}
          />
          <div className="color-values">
            {[
              ["HEX", parsed.value.hex],
              [
                "RGB",
                `rgb(${parsed.value.rgb.r}, ${parsed.value.rgb.g}, ${parsed.value.rgb.b})`,
              ],
              [
                "HSL",
                `hsl(${parsed.value.hsl.h}, ${parsed.value.hsl.s}%, ${parsed.value.hsl.l}%)`,
              ],
              [messages.tool.cssVariable, `--color: ${parsed.value.hex};`],
            ].map(([label, value]) => (
              <div className="card" style={{ padding: 13 }} key={label}>
                <span className="field-label">{label}</span>
                <div
                  className="option-row"
                  style={{ justifyContent: "space-between" }}
                >
                  <code className="mono">{value}</code>
                  <CopyButton messages={messages} value={value} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
