"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleAlert, Clock3 } from "lucide-react";
import { parseTimestamp } from "@/lib/tools";
import { CopyButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";
import { localizeToolError } from "@/i18n/errors";

export function TimestampTool({ messages }: ToolComponentProps) {
  const [now, setNow] = useState(0);
  const [input, setInput] = useState("0");
  useEffect(() => {
    const update = () => setNow(Math.floor(Date.now() / 1000));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const parsed = useMemo(() => {
    try {
      return { value: parseTimestamp(input), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid date.",
      };
    }
  }, [input]);
  return (
    <section className="tool-workspace card">
      <div className="timestamp-now">
        <span className="field-label">
          <Clock3 size={14} style={{ verticalAlign: "-2px" }} />{" "}
          {messages.tool.currentUnix}
        </span>
        <strong>{now}</strong>
      </div>
      <div className="workspace-header">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="timestamp-input">
            {messages.tool.timestampOrDate}
          </label>
          <input
            id="timestamp-input"
            className="input mono"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <button
          className="button button-sm"
          onClick={() => setInput(String(now))}
        >
          Use now
        </button>
      </div>
      {parsed.error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {localizeToolError(parsed.error, messages)}
        </div>
      )}
      {parsed.value && (
        <div className="parse-grid">
          {Object.entries({
            [messages.parsed.unixSeconds]: parsed.value.seconds,
            [messages.parsed.milliseconds]: parsed.value.milliseconds,
            [messages.parsed.iso]: parsed.value.iso,
            [messages.parsed.utc]: parsed.value.utc,
            [messages.parsed.local]: parsed.value.local,
            [messages.parsed.relative]: parsed.value.relative,
          }).map(([key, value]) => (
            <>
              <div className="parse-key" key={`${key}-key`}>
                {key}
              </div>
              <div className="mono" key={key}>
                {value}
              </div>
            </>
          ))}
        </div>
      )}
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {messages.tool.browserTimezone}
        </span>
        <CopyButton
          messages={messages}
          value={parsed.value?.iso ?? ""}
          label={`${messages.common.copy} ISO`}
        />
      </div>
    </section>
  );
}
