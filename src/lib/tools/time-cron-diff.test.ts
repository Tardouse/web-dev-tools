import { describe, expect, it, vi } from "vitest";
import { buildCronExpression, defaultCronBuilder, inspectCron } from "./cron";
import {
  compareText,
  createSideBySideDiff,
  prepareDiffInputs,
  toUnifiedLikeDiff,
} from "./diff";
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
  it("builds all visual Cron schedule modes", () => {
    expect(
      buildCronExpression({
        ...defaultCronBuilder,
        mode: "minutes",
        interval: 5,
      }),
    ).toBe("*/5 * * * *");
    expect(
      buildCronExpression({
        ...defaultCronBuilder,
        mode: "hourly",
        minute: 30,
      }),
    ).toBe("30 * * * *");
    expect(
      buildCronExpression({
        ...defaultCronBuilder,
        mode: "daily",
        hour: 8,
        minute: 15,
      }),
    ).toBe("15 8 * * *");
    expect(
      buildCronExpression({
        ...defaultCronBuilder,
        mode: "weekly",
        hour: 9,
        minute: 0,
        weekdays: [1, 3, 5],
      }),
    ).toBe("0 9 * * 1,3,5");
    expect(
      buildCronExpression({
        ...defaultCronBuilder,
        mode: "monthly",
        dayOfMonth: 20,
        hour: 6,
        minute: 45,
      }),
    ).toBe("45 6 20 * *");
    expect(
      buildCronExpression({
        ...defaultCronBuilder,
        mode: "advanced",
        advanced: {
          minute: "10",
          hour: "2",
          dayOfMonth: "*",
          month: "1-6",
          weekday: "1-5",
        },
      }),
    ).toBe("10 2 * 1-6 1-5");
  });
  it("rejects invalid Cron builder boundaries", () => {
    expect(() =>
      buildCronExpression({
        ...defaultCronBuilder,
        mode: "minutes",
        interval: 0,
      }),
    ).toThrow("Interval");
    expect(() =>
      buildCronExpression({
        ...defaultCronBuilder,
        mode: "weekly",
        weekdays: [],
      }),
    ).toThrow("weekday");
  });
  it("creates added and removed diff segments", () => {
    const parts = compareText("old\n", "new\n", "lines");
    expect(parts.some((part) => part.removed)).toBe(true);
    expect(parts.some((part) => part.added)).toBe(true);
    expect(toUnifiedLikeDiff(parts)).toContain("-old");
  });
  it("creates aligned inline line and character highlights", () => {
    const result = createSideBySideDiff(
      "const mode = 'old';\nremoved\n",
      "const mode = 'new';\nadded\nextra\n",
    );
    expect(result.left).toHaveLength(result.right.length);
    expect(result.left[0].tone).toBe("modified");
    expect(result.right[0].segments.some((segment) => segment.changed)).toBe(
      true,
    );
    expect(result.right.some((line) => line.tone === "added")).toBe(true);
    expect(result.left.some((line) => line.tone === "empty")).toBe(true);
  });
  it("ignores case while preserving each side's original text", () => {
    const parts = compareText("Hello\n", "hello\n", "lines", false, true);
    expect(parts.every((part) => !part.added && !part.removed)).toBe(true);
    const result = createSideBySideDiff(
      "Hello\nKeep\n",
      "hello\nkeep\n",
      false,
      true,
    );
    expect(result.left[0].segments[0].value).toBe("Hello");
    expect(result.right[0].segments[0].value).toBe("hello");
    expect(result.left.every((line) => line.tone === "unchanged")).toBe(true);
  });
  it("normalizes JSON object keys while preserving array order", () => {
    const normalized = prepareDiffInputs(
      '{"name":"Ada","meta":{"active":true,"score":1}}',
      '{"meta":{"score":2,"active":true},"name":"Ada"}',
      "json",
    );
    expect(normalized.before.indexOf('"meta"')).toBeLessThan(
      normalized.before.indexOf('"name"'),
    );
    const parts = compareText('{"a":1,"b":2}', '{"b":2,"a":1}', "json");
    expect(parts.every((part) => !part.added && !part.removed)).toBe(true);
    expect(() => prepareDiffInputs("{", "{}", "json")).toThrow(
      "Original JSON is invalid",
    );
  });
});
