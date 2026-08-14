import { Cron } from "croner";

export interface CronResult {
  expression: string;
  nextRuns: string[];
}
export type CronScheduleMode =
  "minutes" | "hourly" | "daily" | "weekly" | "monthly" | "advanced";
export interface CronBuilderState {
  mode: CronScheduleMode;
  interval: number;
  minute: number;
  hour: number;
  weekdays: number[];
  dayOfMonth: number;
  advanced: {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    weekday: string;
  };
}
export const defaultCronBuilder: CronBuilderState = {
  mode: "minutes",
  interval: 15,
  minute: 0,
  hour: 9,
  weekdays: [1],
  dayOfMonth: 1,
  advanced: {
    minute: "0",
    hour: "9",
    dayOfMonth: "*",
    month: "*",
    weekday: "*",
  },
};

function integer(
  value: number,
  minimum: number,
  maximum: number,
  name: string,
): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum)
    throw new Error(`${name} must be between ${minimum} and ${maximum}.`);
  return value;
}
export function buildCronExpression(state: CronBuilderState): string {
  const minute = integer(state.minute, 0, 59, "Minute");
  const hour = integer(state.hour, 0, 23, "Hour");
  switch (state.mode) {
    case "minutes":
      return `*/${integer(state.interval, 1, 59, "Interval")} * * * *`;
    case "hourly":
      return `${minute} * * * *`;
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekly": {
      const weekdays = [...new Set(state.weekdays)]
        .filter((day) => day >= 0 && day <= 6)
        .sort()
        .join(",");
      if (!weekdays) throw new Error("Select at least one weekday.");
      return `${minute} ${hour} * * ${weekdays}`;
    }
    case "monthly":
      return `${minute} ${hour} ${integer(state.dayOfMonth, 1, 31, "Day of month")} * *`;
    case "advanced": {
      const fields = Object.values(state.advanced).map((field) => field.trim());
      if (fields.some((field) => !field))
        throw new Error("All advanced fields are required.");
      return fields.join(" ");
    }
  }
}
export function inspectCron(expression: string, locale?: string): CronResult {
  if (!expression.trim()) throw new Error("Enter a cron expression.");
  try {
    const cron = new Cron(expression.trim(), { paused: true });
    const nextRuns = cron
      .nextRuns(5)
      .map((date) => date.toLocaleString(locale));
    if (nextRuns.length === 0)
      throw new Error("This expression has no upcoming runs.");
    return { expression: expression.trim(), nextRuns };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Invalid cron expression: ${error.message}`
        : "Invalid cron expression.",
    );
  }
}
