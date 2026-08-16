"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { searchCheatsheet, type CheatsheetId } from "@/lib/tools/cheatsheets";
import type { ToolComponentProps } from "@/lib/types";
import { CopyButton } from "./tool-actions";

const sheetConfig: Record<
  CheatsheetId,
  { name: string; subjectEn: string; subjectZh: string }
> = {
  linux: { name: "Linux", subjectEn: "commands", subjectZh: "命令" },
  git: { name: "Git", subjectEn: "commands", subjectZh: "命令" },
  docker: { name: "Docker", subjectEn: "commands", subjectZh: "命令" },
  nginx: { name: "Nginx", subjectEn: "configuration", subjectZh: "配置" },
  vim: { name: "Vim", subjectEn: "commands", subjectZh: "命令" },
  regex: { name: "Regex", subjectEn: "patterns", subjectZh: "模式" },
  bash: { name: "Bash", subjectEn: "commands", subjectZh: "命令" },
  sql: { name: "SQL", subjectEn: "statements", subjectZh: "语句" },
  javascript: {
    name: "JavaScript",
    subjectEn: "snippets",
    subjectZh: "代码",
  },
  python: { name: "Python", subjectEn: "snippets", subjectZh: "代码" },
  "http-status-code": {
    name: "HTTP",
    subjectEn: "status codes",
    subjectZh: "状态码",
  },
  css: { name: "CSS", subjectEn: "snippets", subjectZh: "片段" },
};

const sheetBySlug: Record<string, CheatsheetId> = {
  "linux-cheatsheet": "linux",
  "git-cheatsheet": "git",
  "docker-cheatsheet": "docker",
  "nginx-cheatsheet": "nginx",
  "vim-cheatsheet": "vim",
  "regex-cheatsheet": "regex",
  "bash-cheatsheet": "bash",
  "sql-cheatsheet": "sql",
  "javascript-cheatsheet": "javascript",
  "python-cheatsheet": "python",
  "http-status-code-cheatsheet": "http-status-code",
  "css-cheatsheet": "css",
};

function sheetId(value: string): CheatsheetId {
  return sheetBySlug[value] ?? "linux";
}

export function DeveloperCheatsheetTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const id = sheetId(
    definition?.implementation ?? definition?.slug ?? "linux-cheatsheet",
  );
  const zh = locale === "zh";
  const [query, setQuery] = useState("");
  const entries = useMemo(() => searchCheatsheet(id, query), [id, query]);
  const config = sheetConfig[id];
  return (
    <section className="tool-workspace card reference-tool cheatsheet-workbench">
      <div className="workspace-header">
        <h2>
          {config.name} {zh ? "速查" : "cheatsheet"}
        </h2>
        <span className="badge">{entries.length}</span>
      </div>
      <div className="reference-search">
        <Search size={18} />
        <input
          aria-label={
            zh
              ? `搜索 ${config.name} ${config.subjectZh}`
              : `Search ${config.name} ${config.subjectEn}`
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            zh ? "搜索条目、分组或用途" : "Search entry, group, or task"
          }
        />
      </div>
      <div className="cheatsheet-list">
        {entries.map((entry) => (
          <article
            className="cheatsheet-row"
            key={`${entry.group}-${entry.command}`}
          >
            <div>
              <span className="badge">{entry.group}</span>
              <p>{zh ? entry.descriptionZh : entry.description}</p>
            </div>
            <code>{entry.command}</code>
            <CopyButton
              value={entry.command}
              messages={messages}
              label={
                zh ? `复制${config.subjectZh}` : `Copy ${config.subjectEn}`
              }
            />
          </article>
        ))}
      </div>
      {!entries.length && (
        <div className="empty-state">
          {zh ? "没有匹配的条目" : "No matching entries"}
        </div>
      )}
    </section>
  );
}
