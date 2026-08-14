"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CircleAlert } from "lucide-react";
import { inspectCron } from "@/lib/tools";
import { CopyButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";
import { localizeToolError } from "@/i18n/errors";

export function CronTool({ messages }: ToolComponentProps) {
  const [expression, setExpression] = useState("*/15 * * * *");
  const presets = [
    [messages.presets.every5m, "*/5 * * * *"],
    [messages.presets.daily9, "0 9 * * *"],
    [messages.presets.weekdays9, "0 9 * * 1-5"],
    [messages.presets.monthly, "0 0 1 * *"],
  ];
  const result = useMemo(() => {
    try {
      return { value: inspectCron(expression), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid cron.",
      };
    }
  }, [expression]);
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="cron-expression">
            {messages.tool.cronExpression}
          </label>
          <input
            id="cron-expression"
            className="input mono"
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
          />
        </div>
        <CopyButton messages={messages} value={expression} />
      </div>
      {result.error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {localizeToolError(result.error, messages)}
        </div>
      )}
      <div style={{ padding: 18 }}>
        <span className="field-label">{messages.tool.presets}</span>
        <div className="option-row" style={{ marginTop: 8 }}>
          {presets.map(([label, value]) => (
            <button
              className="button button-sm"
              key={value}
              onClick={() => setExpression(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-label">
        <span>{messages.tool.nextRuns}</span>
        <span>{messages.common.localTimezone}</span>
      </div>
      {result.value ? (
        <div className="uuid-list">
          {result.value.nextRuns.map((run, index) => (
            <div className="uuid-row" key={run}>
              <CalendarClock size={16} />
              <code>
                {index + 1}. {run}
              </code>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">{messages.tool.cronEmpty}</div>
      )}
    </section>
  );
}
