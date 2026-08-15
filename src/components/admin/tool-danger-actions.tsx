"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useActionState } from "react";
import {
  deleteToolAction,
  resetToolAction,
  type ToolActionState,
} from "@/app/[locale]/admin/(console)/tools/actions";
import type { Locale } from "@/i18n";

const initial: ToolActionState = {};

export function ToolDangerActions({
  locale,
  slug,
  source,
  customized,
}: {
  locale: Locale;
  slug: string;
  source: "core" | "custom";
  customized: boolean;
}) {
  const action = source === "custom" ? deleteToolAction : resetToolAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const zh = locale === "zh";
  if (source === "core" && !customized) return null;
  const deleting = source === "custom";
  return (
    <form
      action={formAction}
      className="tool-danger-form"
      onSubmit={(event) => {
        const message = deleting
          ? zh ? "确认永久删除这个自定义工具？" : "Permanently delete this custom tool?"
          : zh ? "确认恢复核心工具默认配置？" : "Restore the core tool defaults?";
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="slug" value={slug} />
      {state.ok && <p className="form-success" role="status">{zh ? "已恢复默认配置。" : "Defaults restored."}</p>}
      {state.error && <p className="form-error" role="alert">{zh ? "操作失败。" : "The operation failed."}</p>}
      <button className={`button ${deleting ? "button-danger" : ""}`} disabled={pending}>
        {deleting ? <Trash2 size={16} /> : <RotateCcw size={16} />}
        {deleting ? (zh ? "删除自定义工具" : "Delete custom tool") : (zh ? "恢复默认配置" : "Restore defaults")}
      </button>
    </form>
  );
}
