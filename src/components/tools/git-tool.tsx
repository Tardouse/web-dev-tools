"use client";

import { CircleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import {
  generateBranchName,
  generateGitCommand,
  parseGitRemote,
  type GitCommandKind,
} from "@/lib/tools/developer-tools";
import type { ToolComponentProps } from "@/lib/types";
import { CopyButton } from "./tool-actions";

type Mode = GitCommandKind | "branch" | "url";

export function GitCommandBuilderTool({ locale, messages }: ToolComponentProps) {
  const zh = locale === "zh";
  const [mode, setMode] = useState<Mode>("clone");
  const [repository, setRepository] = useState("git@github.com:acme/platform.git");
  const [branch, setBranch] = useState("main");
  const [reference, setReference] = useState("HEAD~1");
  const [branchType, setBranchType] = useState("feature");
  const [description, setDescription] = useState("add developer tools");
  const result = useMemo(() => {
    try {
      const value =
        mode === "branch"
          ? generateBranchName(branchType, description)
          : mode === "url"
            ? JSON.stringify(parseGitRemote(repository), null, 2)
            : generateGitCommand({ kind: mode, repository, branch, reference });
      return { value, error: "" };
    } catch (error) {
      return { value: "", error: error instanceof Error ? error.message : "Generation failed." };
    }
  }, [branch, branchType, description, mode, reference, repository]);
  const labels: Record<Mode, string> = {
    clone: "Clone",
    reset: "Reset",
    rebase: "Rebase",
    "cherry-pick": "Cherry-pick",
    branch: zh ? "分支名" : "Branch name",
    url: zh ? "URL 解析" : "URL parser",
  };
  return (
    <section className="tool-workspace card developer-workbench">
      <div className="workspace-header">
        <h2>{zh ? "Git 命令工作台" : "Git command workbench"}</h2>
        <CopyButton value={result.value} messages={messages} />
      </div>
      <div className="developer-toolbar" role="tablist" aria-label={zh ? "Git 操作" : "Git operation"}>
        {(Object.keys(labels) as Mode[]).map((item) => (
          <button role="tab" aria-selected={mode === item} className={mode === item ? "is-active" : ""} onClick={() => setMode(item)} key={item}>{labels[item]}</button>
        ))}
      </div>
      {mode === "reset" && <div className="error-banner git-warning"><CircleAlert size={17} /><span>{zh ? "Hard reset 会丢弃未提交修改；执行前请确认目标引用。" : "Hard reset discards uncommitted changes. Verify the target reference first."}</span></div>}
      <div className="developer-form-grid">
        {(mode === "clone" || mode === "url") && <label className="field developer-field-wide"><span className="field-label">{zh ? "仓库 URL" : "Repository URL"}</span><input aria-label={zh ? "仓库 URL" : "Repository URL"} value={repository} onChange={(event) => setRepository(event.target.value)} /></label>}
        {mode === "clone" && <label className="field"><span className="field-label">{zh ? "分支（可选）" : "Branch (optional)"}</span><input aria-label={zh ? "分支（可选）" : "Branch (optional)"} value={branch} onChange={(event) => setBranch(event.target.value)} /></label>}
        {(["reset", "rebase", "cherry-pick"] as Mode[]).includes(mode) && <label className="field developer-field-wide"><span className="field-label">{mode === "cherry-pick" ? (zh ? "Commit（空格或逗号分隔）" : "Commits (space or comma separated)") : zh ? "目标引用" : "Target reference"}</span><input aria-label={zh ? "目标引用" : "Target reference"} value={reference} onChange={(event) => setReference(event.target.value)} /></label>}
        {mode === "branch" && <><label className="field"><span className="field-label">{zh ? "分支类型" : "Branch type"}</span><select aria-label={zh ? "分支类型" : "Branch type"} value={branchType} onChange={(event) => setBranchType(event.target.value)}>{["feature", "fix", "chore", "docs", "release"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span className="field-label">{zh ? "简短描述" : "Short description"}</span><input aria-label={zh ? "简短描述" : "Short description"} value={description} onChange={(event) => setDescription(event.target.value)} /></label></>}
      </div>
      {result.error && <div className="error-banner" role="alert"><CircleAlert size={17} />{result.error}</div>}
      <div className="panel-label">{mode === "url" ? (zh ? "解析结果" : "Parsed remote") : (zh ? "生成结果" : "Generated result")}</div>
      <pre className="editor editor-output developer-output" aria-live="polite">{result.value}</pre>
    </section>
  );
}
