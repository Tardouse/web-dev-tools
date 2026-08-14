"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CircleAlert } from "lucide-react";
import {
  buildCronExpression,
  defaultCronBuilder,
  inspectCron,
  type CronBuilderState,
  type CronScheduleMode,
} from "@/lib/tools";
import { CopyButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";
import { localizeToolError } from "@/i18n/errors";
import { intlLocale } from "@/i18n";

const modes: CronScheduleMode[] = [
  "minutes",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "advanced",
];
export function CronTool({ messages, locale }: ToolComponentProps) {
  const [builder, setBuilder] = useState<CronBuilderState>(defaultCronBuilder);
  const [expression, setExpression] = useState(() =>
    buildCronExpression(defaultCronBuilder),
  );
  const presets = [
    [messages.presets.every5m, "*/5 * * * *"],
    [messages.presets.daily9, "0 9 * * *"],
    [messages.presets.weekdays9, "0 9 * * 1-5"],
    [messages.presets.monthly, "0 0 1 * *"],
  ];
  const updateBuilder = (patch: Partial<CronBuilderState>) => {
    const next = { ...builder, ...patch };
    setBuilder(next);
    try {
      setExpression(buildCronExpression(next));
    } catch {}
  };
  const updateAdvanced = (
    key: keyof CronBuilderState["advanced"],
    value: string,
  ) => updateBuilder({ advanced: { ...builder.advanced, [key]: value } });
  const result = useMemo(() => {
    try {
      return { value: inspectCron(expression, intlLocale(locale)), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid cron.",
      };
    }
  }, [expression, locale]);
  const timeFields = (
    <div className="cron-time-fields">
      <label className="field">
        <span>{messages.tool.cronHour}</span>
        <select
          value={builder.hour}
          onChange={(event) =>
            updateBuilder({ hour: Number(event.target.value) })
          }
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <option value={hour} key={hour}>
              {String(hour).padStart(2, "0")}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{messages.tool.cronMinute}</span>
        <select
          value={builder.minute}
          onChange={(event) =>
            updateBuilder({ minute: Number(event.target.value) })
          }
        >
          {Array.from({ length: 60 }, (_, minute) => (
            <option value={minute} key={minute}>
              {String(minute).padStart(2, "0")}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <h2>{messages.tool.cronBuilder}</h2>
        <CopyButton messages={messages} value={expression} />
      </div>
      <div className="cron-builder">
        <label className="field">
          <span>{messages.tool.cronMode}</span>
          <select
            value={builder.mode}
            onChange={(event) =>
              updateBuilder({ mode: event.target.value as CronScheduleMode })
            }
          >
            {modes.map((mode) => (
              <option value={mode} key={mode}>
                {messages.tool.cronModes[mode]}
              </option>
            ))}
          </select>
        </label>
        {builder.mode === "minutes" && (
          <label className="field">
            <span>{messages.tool.cronInterval}</span>
            <select
              value={builder.interval}
              onChange={(event) =>
                updateBuilder({ interval: Number(event.target.value) })
              }
            >
              {[1, 2, 5, 10, 15, 20, 30, 45].map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}
        {builder.mode === "hourly" && (
          <label className="field">
            <span>{messages.tool.cronMinute}</span>
            <select
              value={builder.minute}
              onChange={(event) =>
                updateBuilder({ minute: Number(event.target.value) })
              }
            >
              {Array.from({ length: 60 }, (_, minute) => (
                <option value={minute} key={minute}>
                  {minute}
                </option>
              ))}
            </select>
          </label>
        )}
        {["daily", "weekly", "monthly"].includes(builder.mode) && (
          <div className="field">
            <span>{messages.tool.cronTime}</span>
            {timeFields}
          </div>
        )}
        {builder.mode === "weekly" && (
          <fieldset className="cron-weekdays">
            <legend>{messages.tool.cronWeekdays}</legend>
            {messages.tool.weekdays.map((day, index) => (
              <label className="checkbox" key={day}>
                <input
                  type="checkbox"
                  checked={builder.weekdays.includes(index)}
                  onChange={() =>
                    updateBuilder({
                      weekdays: builder.weekdays.includes(index)
                        ? builder.weekdays.filter((item) => item !== index)
                        : [...builder.weekdays, index],
                    })
                  }
                />
                {day}
              </label>
            ))}
          </fieldset>
        )}
        {builder.mode === "monthly" && (
          <label className="field">
            <span>{messages.tool.cronDayOfMonth}</span>
            <select
              value={builder.dayOfMonth}
              onChange={(event) =>
                updateBuilder({ dayOfMonth: Number(event.target.value) })
              }
            >
              {Array.from({ length: 31 }, (_, index) => (
                <option value={index + 1} key={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </label>
        )}
        {builder.mode === "advanced" && (
          <div className="cron-advanced">
            {(
              ["minute", "hour", "dayOfMonth", "month", "weekday"] as const
            ).map((key) => (
              <label className="field" key={key}>
                <span>
                  {messages.tool.cronFields[key === "dayOfMonth" ? "day" : key]}
                </span>
                <input
                  className="mono"
                  value={builder.advanced[key]}
                  onChange={(event) => updateAdvanced(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="cron-expression-row">
        <label className="field">
          <span>{messages.tool.cronGenerated}</span>
          <input
            id="cron-expression"
            className="input mono"
            value={expression}
            onChange={(event) => {
              setExpression(event.target.value);
              setBuilder((current) => ({ ...current, mode: "advanced" }));
            }}
          />
        </label>
        <span className="muted">{messages.tool.cronManualHint}</span>
      </div>
      {result.error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {localizeToolError(result.error, messages)}
        </div>
      )}
      <div className="cron-presets">
        <span className="field-label">{messages.tool.presets}</span>
        <div className="option-row">
          {presets.map(([label, value]) => (
            <button
              className="button button-sm"
              key={value}
              onClick={() => {
                setExpression(value);
                setBuilder((current) => ({ ...current, mode: "advanced" }));
              }}
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
