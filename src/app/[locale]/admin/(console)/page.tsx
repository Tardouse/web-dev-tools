import Link from "next/link";
import { Activity, Braces, ChartNoAxesCombined, CircleGauge, FileArchive, Gauge, MousePointerClick, Server, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { PopularToolsChart, TrendChart } from "@/components/admin/dashboard-charts";
import { formatBytes } from "@/lib/config";
import { getTool } from "@/lib/tool-registry";
import { isLocale, localePath } from "@/i18n";
import { getDashboardData, normalizeDashboardRange } from "@/server/db/metrics";

export default async function AdminDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { range: value } = await searchParams;
  const range = normalizeDashboardRange(value);
  const data = await getDashboardData(range);
  const zh = locale === "zh";
  const number = new Intl.NumberFormat(zh ? "zh-CN" : "en-US", { notation: "compact", maximumFractionDigits: 1 });
  const cards = [
    ["DAU", data.dau, Activity], ["WAU", data.wau, Activity], ["MAU", data.mau, Activity],
    [zh ? "注册用户" : "Registered users", data.registeredUsers, Users],
    [zh ? "活跃账号" : "Active accounts", data.activeUsers, Users],
    [zh ? "工具使用次数" : "Tool uses", data.toolUsageCount, Braces],
    [zh ? "今日访问量" : "Today's visits", data.todayVisits, MousePointerClick],
    ["PV", data.pageViews, ChartNoAxesCombined], ["UV", data.uniqueVisitors, Gauge],
    [zh ? "错误率" : "Error rate", `${data.errorRate.toFixed(2)}%`, CircleGauge],
    [zh ? "API 请求量" : "API requests", data.apiRequests, Server],
    [zh ? "文件处理量" : "Files processed", `${data.filesProcessed} · ${formatBytes(data.fileBytes)}`, FileArchive],
  ] as const;
  const popular = data.popularTools.map((item) => ({ ...item, name: getTool(item.slug, locale)?.name ?? item.slug }));
  return (
    <>
      <header className="admin-page-heading">
        <div><span className="eyebrow">{zh ? "运营概览" : "Operations overview"}</span><h1>{zh ? "管理后台" : "Dashboard"}</h1><p>{zh ? "查看用户活跃、访问流量、工具使用与系统运行情况。" : "Monitor user activity, traffic, tool usage, and system health."}</p></div>
        <nav className="range-filter" aria-label={zh ? "日期范围" : "Date range"}>
          {[1, 7, 30, 90].map((days) => <Link className={range === days ? "is-active" : ""} href={`${localePath(locale, "/admin")}?range=${days}`} key={days}>{days === 1 ? (zh ? "今日" : "Today") : zh ? `${days} 天` : `${days} days`}</Link>)}
        </nav>
      </header>
      <section className="kpi-grid" aria-label={zh ? "关键指标" : "Key metrics"}>
        {cards.map(([label, value, Icon]) => <article className="kpi-card card" key={label}><div className="kpi-label"><span>{label}</span><Icon size={17} /></div><strong>{typeof value === "number" ? number.format(value) : value}</strong><small>{range === 1 ? (zh ? "今日范围" : "Today") : zh ? `最近 ${range} 天` : `Last ${range} days`}</small></article>)}
      </section>
      <section className="dashboard-grid">
        <TrendChart title={zh ? "用户活跃趋势" : "User activity trend"} description={zh ? "每日登录用户，周/月活跃值显示在上方。" : "Daily signed-in users; weekly and monthly totals are summarized above."} points={data.series} locale={locale} series={[{ key: "activeUsers", label: zh ? "活跃用户" : "Active users", color: "--chart-blue" }]} />
        <TrendChart title={zh ? "访问趋势" : "Traffic trend"} description={zh ? "页面浏览量与独立访客使用同一计数轴。" : "Page views and unique visitors share one count axis."} points={data.series} locale={locale} series={[{ key: "pageViews", label: "PV", color: "--chart-blue" }, { key: "uniqueVisitors", label: "UV", color: "--chart-orange", dash: "6 4" }]} />
      </section>
      <PopularToolsChart title={zh ? "热门工具" : "Popular tools"} tools={popular} locale={locale} />
    </>
  );
}
