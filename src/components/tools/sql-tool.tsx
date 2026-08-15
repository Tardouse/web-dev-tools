"use client";

import { useCallback, useState } from "react";
import {
  formatSqlQuery,
  type SqlDialect,
} from "@/lib/tools/code-workbench";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

const dialects: Array<{ value: SqlDialect; label: string }> = [
  { value: "sql", label: "Standard SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "transactsql", label: "SQL Server" },
];

export function SqlFormatterTool({ definition, locale, messages }: ToolComponentProps) {
  const [dialect, setDialect] = useState<SqlDialect>("postgresql");
  const [keywordCase, setKeywordCase] = useState<"upper" | "lower" | "preserve">("upper");
  const zh = locale === "zh";
  const transform = useCallback(
    (input: string) => formatSqlQuery(input, dialect, keywordCase),
    [dialect, keywordCase],
  );
  return (
    <TextWorkbench
      messages={messages}
      title={zh ? "SQL 格式化与美化" : "SQL formatting & beautifying"}
      initialInput="select u.id,u.name,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.active=true group by u.id,u.name order by orders desc;"
      actionLabel={zh ? "格式化 SQL" : "Format SQL"}
      filename="query.sql"
      maxInputSize={definition?.maxInputSize}
      transform={transform}
      options={
        <div className="compact-option-row">
          <label className="field inline compact-tool-option">
            <span className="sr-only">{zh ? "SQL 方言" : "SQL dialect"}</span>
            <select aria-label={zh ? "SQL 方言" : "SQL dialect"} value={dialect} onChange={(event) => setDialect(event.target.value as SqlDialect)}>
              {dialects.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="field inline compact-tool-option">
            <span className="sr-only">{zh ? "关键字大小写" : "Keyword case"}</span>
            <select aria-label={zh ? "关键字大小写" : "Keyword case"} value={keywordCase} onChange={(event) => setKeywordCase(event.target.value as typeof keywordCase)}>
              <option value="upper">{zh ? "关键字大写" : "Uppercase keywords"}</option>
              <option value="lower">{zh ? "关键字小写" : "Lowercase keywords"}</option>
              <option value="preserve">{zh ? "保持大小写" : "Preserve case"}</option>
            </select>
          </label>
        </div>
      }
    />
  );
}
