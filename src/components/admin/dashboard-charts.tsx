"use client";

import { useId, useState } from "react";
import type { DashboardPoint } from "@/server/db/metrics";
import type { Locale } from "@/i18n";

interface SeriesDefinition {
  key: keyof Pick<DashboardPoint, "activeUsers" | "pageViews" | "uniqueVisitors">;
  label: string;
  color: string;
  dash?: string;
}

export function TrendChart({
  title,
  description,
  points,
  series,
  locale,
}: {
  title: string;
  description: string;
  points: DashboardPoint[];
  series: SeriesDefinition[];
  locale: Locale;
}) {
  const [table, setTable] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const width = 720;
  const height = 260;
  const padding = { left: 42, right: 18, top: 24, bottom: 38 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const max = Math.max(
    1,
    ...points.flatMap((point) => series.map((item) => Number(point[item.key]))),
  );
  const x = (index: number) =>
    padding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) => padding.top + plotHeight - (value / max) * plotHeight;
  const zh = locale === "zh";
  const visibleTicks = [0, Math.round(max / 2), max];

  return (
    <figure className="admin-chart card" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <figcaption className="chart-heading">
        <div>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>
        <button className="button button-sm" onClick={() => setTable((value) => !value)}>
          {table ? (zh ? "查看图表" : "View chart") : zh ? "查看数据表" : "View table"}
        </button>
      </figcaption>
      <div className="chart-legend" aria-label={zh ? "图例" : "Legend"}>
        {series.map((item) => (
          <span key={item.key}>
            <i style={{ background: `var(${item.color})` }} /> {item.label}
          </span>
        ))}
      </div>
      {table ? (
        <div className="table-scroll">
          <table className="admin-table chart-table">
            <thead>
              <tr>
                <th>{zh ? "日期" : "Date"}</th>
                {series.map((item) => <th key={item.key}>{item.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.day}>
                  <td>{formatDay(point.day, locale)}</td>
                  {series.map((item) => <td key={item.key}>{point[item.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-plot-wrap">
          <svg
            className="trend-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          >
            {visibleTicks.map((tick) => (
              <g key={tick}>
                <line className="chart-gridline" x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} />
                <text className="chart-axis-label" x={padding.left - 8} y={y(tick) + 4} textAnchor="end">{tick}</text>
              </g>
            ))}
            {series.map((item) => {
              const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(Number(point[item.key]))}`).join(" ");
              return (
                <g key={item.key}>
                  <path className="chart-line" d={path} style={{ stroke: `var(${item.color})` }} strokeDasharray={item.dash} />
                  {points.map((point, index) => (
                    <circle
                      className="chart-point"
                      cx={x(index)} cy={y(Number(point[item.key]))} r="4"
                      style={{ fill: `var(${item.color})` }}
                      key={point.day}
                    />
                  ))}
                </g>
              );
            })}
            {points.map((point, index) => (
              <g key={point.day}>
                <rect
                  className="chart-hit-area"
                  x={x(index) - Math.max(12, plotWidth / Math.max(1, points.length) / 2)}
                  y={padding.top}
                  width={Math.max(24, plotWidth / Math.max(1, points.length))}
                  height={plotHeight}
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatDay(point.day, locale)}: ${series.map((item) => `${item.label} ${point[item.key]}`).join(", ")}`}
                  onFocus={() => setFocusIndex(index)}
                  onBlur={() => setFocusIndex(null)}
                  onPointerEnter={() => setFocusIndex(index)}
                  onPointerLeave={() => setFocusIndex(null)}
                />
                {(index === 0 || index === points.length - 1) && (
                  <text className="chart-axis-label" x={x(index)} y={height - 10} textAnchor={index === 0 ? "start" : "end"}>{formatDay(point.day, locale)}</text>
                )}
              </g>
            ))}
            {focusIndex !== null && (
              <line className="chart-crosshair" x1={x(focusIndex)} x2={x(focusIndex)} y1={padding.top} y2={padding.top + plotHeight} />
            )}
          </svg>
          {focusIndex !== null && (
            <div className="chart-tooltip" style={{ left: `${(x(focusIndex) / width) * 100}%` }}>
              <strong>{formatDay(points[focusIndex].day, locale)}</strong>
              {series.map((item) => (
                <span key={item.key}><i style={{ background: `var(${item.color})` }} /> <b>{points[focusIndex][item.key]}</b> {item.label}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

export function PopularToolsChart({
  title,
  tools,
  locale,
}: {
  title: string;
  tools: Array<{ slug: string; name: string; count: number }>;
  locale: Locale;
}) {
  const [table, setTable] = useState(false);
  const zh = locale === "zh";
  const max = Math.max(1, ...tools.map((tool) => tool.count));
  return (
    <figure className="admin-chart card popular-chart">
      <figcaption className="chart-heading">
        <div><h2>{title}</h2><p>{zh ? "按工具打开次数排序" : "Ranked by tool opens"}</p></div>
        <button className="button button-sm" onClick={() => setTable((value) => !value)}>
          {table ? (zh ? "查看图表" : "View chart") : zh ? "查看数据表" : "View table"}
        </button>
      </figcaption>
      {tools.length === 0 ? (
        <div className="admin-empty">{zh ? "此时间范围内暂无工具使用记录。" : "No tool usage in this range."}</div>
      ) : table ? (
        <table className="admin-table chart-table"><thead><tr><th>{zh ? "工具" : "Tool"}</th><th>{zh ? "次数" : "Uses"}</th></tr></thead><tbody>{tools.map((tool) => <tr key={tool.slug}><td>{tool.name}</td><td>{tool.count}</td></tr>)}</tbody></table>
      ) : (
        <div className="bar-list">
          {tools.map((tool) => (
            <div className="bar-row" key={tool.slug} tabIndex={0} title={`${tool.name}: ${tool.count}`}>
              <span>{tool.name}</span>
              <div className="bar-track"><i style={{ width: `${(tool.count / max) * 100}%` }} /></div>
              <strong>{tool.count}</strong>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}

function formatDay(day: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
}
