"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { lookupHttpStatuses, lookupMimeTypes, statusClass } from "@/lib/tools";
import type { ToolComponentProps } from "@/lib/types";

export function MimeTypeLookupTool({ locale }: ToolComponentProps) {
  const zh = locale === "zh";
  const [query, setQuery] = useState("json");
  const results = useMemo(() => lookupMimeTypes(query), [query]);
  return (
    <section className="tool-workspace card reference-tool">
      <div className="workspace-header">
        <h2>{zh ? "MIME Type 查询" : "MIME type lookup"}</h2>
        <span className="badge">{results.length}</span>
      </div>
      <div className="reference-search">
        <Search size={18} />
        <input
          autoFocus
          aria-label={zh ? "搜索 MIME Type" : "Search MIME types"}
          placeholder={
            zh
              ? "输入扩展名或 MIME Type，例如 json、.png"
              : "Extension or media type, e.g. json, .png"
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="reference-table-wrap">
        <table className="reference-table">
          <thead>
            <tr>
              <th>MIME Type</th>
              <th>{zh ? "扩展名" : "Extensions"}</th>
              <th>Charset</th>
              <th>{zh ? "可压缩" : "Compressible"}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.type}>
                <td>
                  <code>{item.type}</code>
                </td>
                <td>
                  {item.extensions.length
                    ? item.extensions
                        .map((extension) => `.${extension}`)
                        .join(", ")
                    : "—"}
                </td>
                <td>{item.charset ?? "—"}</td>
                <td>
                  {item.compressible === true
                    ? zh
                      ? "是"
                      : "Yes"
                    : item.compressible === false
                      ? zh
                        ? "否"
                        : "No"
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results.length && (
          <div className="empty-state">
            {zh ? "没有匹配的 MIME Type" : "No matching MIME types"}
          </div>
        )}
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {zh
            ? "基于 IANA 与常用媒体类型注册表"
            : "IANA and common media type registry"}
        </span>
      </div>
    </section>
  );
}

export function HttpStatusReferenceTool({ locale }: ToolComponentProps) {
  const zh = locale === "zh";
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<
    "all" | "1xx" | "2xx" | "3xx" | "4xx" | "5xx"
  >("all");
  const results = useMemo(
    () => lookupHttpStatuses(query, group),
    [query, group],
  );
  return (
    <section className="tool-workspace card reference-tool">
      <div className="workspace-header">
        <h2>{zh ? "HTTP 状态码参考" : "HTTP status reference"}</h2>
        <div className="segmented">
          {(["all", "1xx", "2xx", "3xx", "4xx", "5xx"] as const).map((item) => (
            <button
              key={item}
              aria-pressed={group === item}
              onClick={() => setGroup(item)}
            >
              {item === "all" ? (zh ? "全部" : "All") : item}
            </button>
          ))}
        </div>
      </div>
      <div className="reference-search">
        <Search size={18} />
        <input
          aria-label={zh ? "搜索 HTTP 状态码" : "Search HTTP status codes"}
          placeholder={
            zh
              ? "搜索 404、Not Found 或描述"
              : "Search 404, Not Found, or a description"
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="status-list">
        {results.map((status) => (
          <article
            className={`status-row status-${Math.floor(status.code / 100)}xx`}
            key={status.code}
          >
            <strong>{status.code}</strong>
            <div>
              <h3>{status.name}</h3>
              <p>{status.description}</p>
            </div>
            <span>{statusClass(status.code)}</span>
          </article>
        ))}
        {!results.length && (
          <div className="empty-state">
            {zh ? "没有匹配的状态码" : "No matching status codes"}
          </div>
        )}
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {results.length} {zh ? "个标准状态码" : "standard status codes"}
        </span>
      </div>
    </section>
  );
}
