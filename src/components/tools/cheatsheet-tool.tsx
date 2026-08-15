"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  searchCheatsheet,
  type CheatsheetId,
} from "@/lib/tools/cheatsheets";
import type { ToolComponentProps } from "@/lib/types";
import { CopyButton } from "./tool-actions";

function sheetId(value: string): CheatsheetId {
  if (value.startsWith("docker")) return "docker";
  if (value.startsWith("nginx")) return "nginx";
  if (value.startsWith("git")) return "git";
  return "linux";
}

export function DeveloperCheatsheetTool({ definition, locale, messages }: ToolComponentProps) {
  const id = sheetId(definition?.implementation ?? definition?.slug ?? "linux-cheatsheet");
  const zh = locale === "zh";
  const [query, setQuery] = useState("");
  const entries = useMemo(() => searchCheatsheet(id, query), [id, query]);
  const names = { linux: "Linux", git: "Git", docker: "Docker", nginx: "Nginx" };
  return (
    <section className="tool-workspace card reference-tool cheatsheet-workbench">
      <div className="workspace-header"><h2>{names[id]} {zh ? "命令速查" : "command reference"}</h2><span className="badge">{entries.length}</span></div>
      <div className="reference-search"><Search size={18} /><input aria-label={zh ? `搜索 ${names[id]} 命令` : `Search ${names[id]} commands`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={zh ? "搜索命令、分组或用途" : "Search command, group, or task"} /></div>
      <div className="cheatsheet-list">{entries.map((entry) => <article className="cheatsheet-row" key={entry.command}><div><span className="badge">{entry.group}</span><p>{zh ? entry.descriptionZh : entry.description}</p></div><code>{entry.command}</code><CopyButton value={entry.command} messages={messages} label={zh ? "复制命令" : "Copy command"} /></article>)}</div>
      {!entries.length && <div className="empty-state">{zh ? "没有匹配的命令" : "No matching commands"}</div>}
    </section>
  );
}
