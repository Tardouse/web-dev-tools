import { Cron } from "croner";

export interface CronResult {
  expression: string;
  nextRuns: string[];
}

export function inspectCron(expression: string): CronResult {
  if (!expression.trim()) throw new Error("Enter a cron expression.");
  try {
    const cron = new Cron(expression.trim(), { paused: true });
    const nextRuns = cron.nextRuns(5).map((date) => date.toLocaleString());
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
