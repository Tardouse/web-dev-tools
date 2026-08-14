"use client";

import { useMemo, useState } from "react";
import { CircleAlert } from "lucide-react";
import { convertBase } from "@/lib/tools";
import { CopyButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";
import { localizeToolError } from "@/i18n/errors";

export function NumberBaseTool({ messages }: ToolComponentProps) {
  const [input, setInput] = useState("255");
  const [from, setFrom] = useState(10);
  const [to, setTo] = useState(16);
  const result = useMemo(() => {
    try {
      return { value: convertBase(input, from, to), error: "" };
    } catch (error) {
      return {
        value: "",
        error: error instanceof Error ? error.message : "Conversion failed.",
      };
    }
  }, [input, from, to]);
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <h2>{messages.tool.baseConverter}</h2>
        <CopyButton messages={messages} value={result.value} />
      </div>
      {result.error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {localizeToolError(result.error, messages)}
        </div>
      )}
      <div style={{ padding: 20, display: "grid", gap: 18 }}>
        <div className="form-row">
          <label className="field">
            <span>{messages.tool.inputNumber}</span>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="input mono"
            />
          </label>
          <div className="option-row">
            <label className="field">
              <span>{messages.tool.fromBase}</span>
              <input
                type="number"
                min={2}
                max={36}
                value={from}
                onChange={(event) => setFrom(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>{messages.tool.toBase}</span>
              <input
                type="number"
                min={2}
                max={36}
                value={to}
                onChange={(event) => setTo(Number(event.target.value))}
              />
            </label>
          </div>
        </div>
        <div
          className="card"
          style={{ padding: 22, background: "var(--surface-muted)" }}
        >
          <span className="field-label">{messages.common.result}</span>
          <pre
            className="mono"
            style={{
              margin: "8px 0 0",
              fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
              overflowWrap: "anywhere",
              whiteSpace: "pre-wrap",
            }}
          >
            {result.value || "—"}
          </pre>
        </div>
        <div className="option-row">
          {[2, 8, 10, 16, 36].map((base) => {
            let value = "—";
            try {
              value = convertBase(input, from, base);
            } catch {}
            return (
              <span className="badge mono" key={base}>
                base {base}: {value}
              </span>
            );
          })}
        </div>
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.tool.arbitraryPrecision}
        </span>
      </div>
    </section>
  );
}
