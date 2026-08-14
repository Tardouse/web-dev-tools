export interface TimestampResult {
  seconds: number;
  milliseconds: number;
  iso: string;
  utc: string;
  local: string;
  relative: string;
}

function relativeTime(date: Date): string {
  const difference = date.getTime() - Date.now();
  const absolute = Math.abs(difference);
  const divisions: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [86_400_000, "day"],
    [3_600_000, "hour"],
    [60_000, "minute"],
    [1_000, "second"],
  ];
  const [divisor, unit] =
    divisions.find(([value]) => absolute >= value) ?? divisions.at(-1)!;
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
    Math.round(difference / divisor),
    unit,
  );
}

export function parseTimestamp(input: string): TimestampResult {
  const value = input.trim();
  if (!value) throw new Error("Enter a timestamp or date.");
  let date: Date;
  if (/^-?\d+$/.test(value)) {
    const numeric = Number(value);
    date = new Date(
      Math.abs(numeric) < 100_000_000_000 ? numeric * 1000 : numeric,
    );
  } else date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new Error("Enter a valid Unix timestamp, ISO date, or local date.");
  return {
    seconds: Math.floor(date.getTime() / 1000),
    milliseconds: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "long",
    }).format(date),
    relative: relativeTime(date),
  };
}
