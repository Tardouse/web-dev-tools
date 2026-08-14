import "server-only";

import { createHash } from "node:crypto";
import { getDatabase, initializeDatabase } from "@/server/db/database";

export const DASHBOARD_RANGES = [1, 7, 30, 90] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export interface DashboardPoint {
  day: string;
  activeUsers: number;
  pageViews: number;
  uniqueVisitors: number;
}

export interface DashboardData {
  range: DashboardRange;
  from: string;
  to: string;
  dau: number;
  wau: number;
  mau: number;
  registeredUsers: number;
  activeUsers: number;
  toolUsageCount: number;
  todayVisits: number;
  pageViews: number;
  uniqueVisitors: number;
  errorRate: number;
  apiRequests: number;
  filesProcessed: number;
  fileBytes: number;
  popularTools: Array<{ slug: string; count: number }>;
  series: DashboardPoint[];
}

function dayStart(daysAgo = 0): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function normalizeDashboardRange(value: unknown): DashboardRange {
  const number = Number(value);
  return DASHBOARD_RANGES.includes(number as DashboardRange)
    ? (number as DashboardRange)
    : 30;
}

function uniqueUserCountSince(since: string): number {
  const row = getDatabase()
    .prepare(
      `SELECT COUNT(DISTINCT user_id) AS count FROM page_view_events
       WHERE user_id IS NOT NULL AND created_at >= ?`,
    )
    .get(since) as { count: number };
  return row.count;
}

export async function getDashboardData(
  range: DashboardRange,
): Promise<DashboardData> {
  await initializeDatabase();
  const database = getDatabase();
  const now = new Date();
  const fromDate = dayStart(range - 1);
  const from = fromDate.toISOString();
  const today = dayStart().toISOString();
  const users = database
    .prepare(
      `SELECT COUNT(*) AS registered,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active
       FROM users`,
    )
    .get() as { registered: number; active: number };
  const pageViews = database
    .prepare(
      `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_id_hash) AS visitors
       FROM page_view_events WHERE created_at >= ?`,
    )
    .get(from) as { views: number; visitors: number };
  const todayVisits = database
    .prepare(
      `SELECT COUNT(DISTINCT visitor_id_hash || ':' || substr(created_at, 1, 10)) AS count
       FROM page_view_events WHERE created_at >= ?`,
    )
    .get(today) as { count: number };
  const toolUsage = database
    .prepare(
      "SELECT COUNT(*) AS count FROM tool_usage_events WHERE created_at >= ?",
    )
    .get(from) as { count: number };
  const daily = database
    .prepare(
      `SELECT COALESCE(SUM(api_requests), 0) AS apiRequests,
        COALESCE(SUM(error_count), 0) AS errors,
        COALESCE(SUM(file_count), 0) AS files,
        COALESCE(SUM(file_bytes), 0) AS fileBytes
       FROM daily_metrics WHERE day >= ?`,
    )
    .get(dateKey(fromDate)) as {
    apiRequests: number;
    errors: number;
    files: number;
    fileBytes: number;
  };
  const popularTools = database
    .prepare(
      `SELECT tool_slug AS slug, COUNT(*) AS count
       FROM tool_usage_events WHERE created_at >= ?
       GROUP BY tool_slug ORDER BY count DESC, slug LIMIT 8`,
    )
    .all(from) as unknown as Array<{ slug: string; count: number }>;
  const pointRows = database
    .prepare(
      `SELECT substr(created_at, 1, 10) AS day,
        COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id END) AS activeUsers,
        COUNT(*) AS pageViews,
        COUNT(DISTINCT visitor_id_hash) AS uniqueVisitors
       FROM page_view_events WHERE created_at >= ?
       GROUP BY day ORDER BY day`,
    )
    .all(from) as unknown as DashboardPoint[];
  const pointMap = new Map(pointRows.map((point) => [point.day, point]));
  const series = Array.from({ length: range }, (_, index) => {
    const date = new Date(fromDate);
    date.setUTCDate(fromDate.getUTCDate() + index);
    const day = dateKey(date);
    return (
      pointMap.get(day) ?? { day, activeUsers: 0, pageViews: 0, uniqueVisitors: 0 }
    );
  });
  const measuredRequests = daily.apiRequests + pageViews.views;
  return {
    range,
    from,
    to: now.toISOString(),
    dau: uniqueUserCountSince(dayStart().toISOString()),
    wau: uniqueUserCountSince(dayStart(6).toISOString()),
    mau: uniqueUserCountSince(dayStart(29).toISOString()),
    registeredUsers: users.registered,
    activeUsers: users.active,
    toolUsageCount: toolUsage.count,
    todayVisits: todayVisits.count,
    pageViews: pageViews.views,
    uniqueVisitors: pageViews.visitors,
    errorRate:
      measuredRequests === 0 ? 0 : (daily.errors / measuredRequests) * 100,
    apiRequests: daily.apiRequests,
    filesProcessed: daily.files,
    fileBytes: daily.fileBytes,
    popularTools: popularTools.map((tool) => ({
      slug: tool.slug,
      count: Number(tool.count),
    })),
    series: series.map((point) => ({
      day: point.day,
      activeUsers: Number(point.activeUsers),
      pageViews: Number(point.pageViews),
      uniqueVisitors: Number(point.uniqueVisitors),
    })),
  };
}

export async function recordPageView(input: {
  path: string;
  visitorId: string;
  userId?: string;
  toolSlug?: string;
}): Promise<void> {
  await initializeDatabase();
  const database = getDatabase();
  const now = new Date().toISOString();
  const visitorHash = createHash("sha256").update(input.visitorId).digest("hex");
  database
    .prepare(
      `INSERT INTO page_view_events (path, visitor_id_hash, user_id, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(input.path, visitorHash, input.userId ?? null, now);
  if (input.toolSlug) {
    database
      .prepare(
        `INSERT INTO tool_usage_events (
          tool_slug, user_id, visitor_id_hash, created_at
        ) VALUES (?, ?, ?, ?)`,
      )
      .run(input.toolSlug, input.userId ?? null, visitorHash, now);
  }
}

export async function incrementDailyMetric(
  metric: "api_requests" | "error_count" | "file_count" | "file_bytes",
  amount = 1,
): Promise<void> {
  await initializeDatabase();
  const day = dateKey(new Date());
  getDatabase()
    .prepare(
      `INSERT INTO daily_metrics (day, ${metric}) VALUES (?, ?)
       ON CONFLICT(day) DO UPDATE SET ${metric} = ${metric} + excluded.${metric}`,
    )
    .run(day, Math.max(0, Math.floor(amount)));
}
