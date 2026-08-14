import { describe, expect, it, vi } from "vitest";
import { inspectCron } from "./cron";
import { compareText, toUnifiedLikeDiff } from "./diff";
import { parseTimestamp } from "./time";

describe("time, cron, and diff tools", () => {
  it("converts Unix seconds deterministically", () => {
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    expect(parseTimestamp("1704067200")).toMatchObject({
      seconds: 1704067200,
      milliseconds: 1704067200000,
      iso: "2024-01-01T00:00:00.000Z",
    });
    vi.useRealTimers();
  });
  it("rejects invalid dates", () =>
    expect(() => parseTimestamp("definitely-not-a-date")).toThrow(
      "valid Unix",
    ));
  it("validates cron and returns upcoming runs", () =>
    expect(inspectCron("*/15 * * * *").nextRuns).toHaveLength(5));
  it("rejects malformed cron", () =>
    expect(() => inspectCron("not cron")).toThrow("Invalid cron"));
  it("creates added and removed diff segments", () => {
    const parts = compareText("old\n", "new\n", "lines");
    expect(parts.some((part) => part.removed)).toBe(true);
    expect(parts.some((part) => part.added)).toBe(true);
    expect(toUnifiedLikeDiff(parts)).toContain("-old");
  });
});
