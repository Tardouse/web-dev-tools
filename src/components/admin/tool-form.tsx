"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";
import {
  createToolAction,
  updateToolAction,
  type ToolActionState,
} from "@/app/[locale]/admin/(console)/tools/actions";
import type { Locale } from "@/i18n";
import type { ManagedToolConfiguration } from "@/lib/tool-admin";
import type { ToolCategoryId } from "@/lib/types";

interface Option {
  value: string;
  label: string;
}

const initialState: ToolActionState = {};

export function ToolForm({
  locale,
  tool,
  implementations,
  categories,
  defaultLimitMb,
}: {
  locale: Locale;
  tool?: ManagedToolConfiguration;
  implementations: Option[];
  categories: Array<{ value: ToolCategoryId; label: string }>;
  defaultLimitMb: number;
}) {
  const action = tool ? updateToolAction : createToolAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const zh = locale === "zh";
  const errorMessages: Record<string, string> = {
    invalid: zh ? "请检查所有字段和限制值。" : "Check every field and limit value.",
    exists: zh ? "该工具路径已经存在。" : "That tool slug already exists.",
    not_found: zh ? "工具不存在或已被删除。" : "The tool no longer exists.",
    forbidden: zh ? "当前账号没有操作权限。" : "Your account cannot perform this action.",
    unknown: zh ? "保存失败，请稍后重试。" : "Save failed. Try again.",
  };
  const value = tool;
  return (
    <form action={formAction} className="admin-config-form">
      <input type="hidden" name="locale" value={locale} />
      {tool && <input type="hidden" name="slug" value={tool.slug} />}

      <section className="settings-section card">
        <div className="settings-section-heading">
          <div>
            <h2>{zh ? "身份与实现" : "Identity & implementation"}</h2>
            <p>{zh ? "定义稳定 URL 和实际运行的核心引擎。" : "Define the stable URL and executable core engine."}</p>
          </div>
        </div>
        <div className="settings-grid">
          <label className="settings-field">
            <span>Slug</span>
            <input className="field-input" name={tool ? undefined : "slug"} defaultValue={value?.slug} disabled={Boolean(tool)} required minLength={2} maxLength={64} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
          </label>
          <label className="settings-field">
            <span>{zh ? "实现引擎" : "Implementation engine"}</span>
            <select className="field-select" name="implementation" defaultValue={value?.implementation ?? implementations[0]?.value} required>
              {implementations.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="settings-field">
            <span>{zh ? "英文名称" : "English name"}</span>
            <input className="field-input" name="nameEn" defaultValue={value?.nameEn} required maxLength={80} />
          </label>
          <label className="settings-field">
            <span>{zh ? "中文名称" : "Chinese name"}</span>
            <input className="field-input" name="nameZh" defaultValue={value?.nameZh} required maxLength={80} />
          </label>
          <label className="settings-field">
            <span>{zh ? "英文短名称" : "English short name"}</span>
            <input className="field-input" name="shortNameEn" defaultValue={value?.shortNameEn} required maxLength={40} />
          </label>
          <label className="settings-field">
            <span>{zh ? "中文短名称" : "Chinese short name"}</span>
            <input className="field-input" name="shortNameZh" defaultValue={value?.shortNameZh} required maxLength={40} />
          </label>
          <label className="settings-field settings-field-wide">
            <span>{zh ? "英文 Description" : "English description"}</span>
            <textarea className="field-input" name="descriptionEn" defaultValue={value?.descriptionEn} required minLength={10} maxLength={500} rows={3} />
          </label>
          <label className="settings-field settings-field-wide">
            <span>{zh ? "中文 Description" : "Chinese description"}</span>
            <textarea className="field-input" name="descriptionZh" defaultValue={value?.descriptionZh} required minLength={5} maxLength={500} rows={3} />
          </label>
        </div>
      </section>

      <section className="settings-section card">
        <div className="settings-section-heading"><div><h2>{zh ? "发现与 SEO" : "Discovery & SEO"}</h2><p>{zh ? "控制分类、搜索词和双语搜索结果摘要。" : "Control category, search terms, and bilingual search snippets."}</p></div></div>
        <div className="settings-grid">
          <label className="settings-field">
            <span>{zh ? "分类" : "Category"}</span>
            <select className="field-select" name="category" defaultValue={value?.category ?? categories[0]?.value} required>{categories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
          </label>
          <label className="settings-field">
            <span>{zh ? "排序值" : "Sort order"}</span>
            <input className="field-input" name="sortOrder" type="number" min={0} max={100000} step={1} defaultValue={value?.sortOrder ?? 1000} required />
          </label>
          <label className="settings-field settings-field-wide">
            <span>{zh ? "英文关键词（逗号分隔）" : "English keywords (comma-separated)"}</span>
            <input className="field-input" name="keywordsEn" defaultValue={value?.keywordsEn.join(", ")} required maxLength={1500} />
          </label>
          <label className="settings-field settings-field-wide">
            <span>{zh ? "中文关键词（逗号分隔）" : "Chinese keywords (comma-separated)"}</span>
            <input className="field-input" name="keywordsZh" defaultValue={value?.keywordsZh.join(", ")} required maxLength={1500} />
          </label>
          <label className="settings-field"><span>{zh ? "英文 SEO 标题" : "English SEO title"}</span><input className="field-input" name="seoTitleEn" defaultValue={value?.seoTitleEn} required maxLength={120} /></label>
          <label className="settings-field"><span>{zh ? "中文 SEO 标题" : "Chinese SEO title"}</span><input className="field-input" name="seoTitleZh" defaultValue={value?.seoTitleZh} required maxLength={120} /></label>
          <label className="settings-field settings-field-wide"><span>{zh ? "英文 SEO 描述" : "English SEO description"}</span><textarea className="field-input" name="seoDescriptionEn" defaultValue={value?.seoDescriptionEn} required maxLength={300} rows={3} /></label>
          <label className="settings-field settings-field-wide"><span>{zh ? "中文 SEO 描述" : "Chinese SEO description"}</span><textarea className="field-input" name="seoDescriptionZh" defaultValue={value?.seoDescriptionZh} required maxLength={300} rows={3} /></label>
        </div>
      </section>

      <section className="settings-section card">
        <div className="settings-section-heading"><div><h2>{zh ? "访问与限制" : "Access & limits"}</h2><p>{zh ? "配置输入大小、登录、免费状态和公开展示。" : "Configure input size, sign-in, free access, and visibility."}</p></div></div>
        <div className="settings-grid">
          <label className="settings-field"><span>{zh ? "最大输入（MB）" : "Maximum input (MB)"}</span><input className="field-input" name="maxInputMb" type="number" min={0.001} max={100} step={0.001} defaultValue={Number((value ? value.maxInputSize / 1024 / 1024 : defaultLimitMb).toFixed(3))} required /></label>
          <div className="settings-toggle-grid settings-field-wide">
            <Toggle name="enabled" defaultChecked={value?.enabled ?? true} label={zh ? "启用工具" : "Tool enabled"} />
            <Toggle name="featured" defaultChecked={value?.featured ?? false} label={zh ? "推荐工具" : "Featured tool"} />
            <Toggle name="requiresLogin" defaultChecked={value?.requiresLogin ?? false} label={zh ? "需要登录" : "Sign-in required"} />
            <Toggle name="freeToUse" defaultChecked={value?.freeToUse ?? true} label={zh ? "允许免费使用" : "Free to use"} />
          </div>
        </div>
      </section>

      {state.ok && <p className="form-success" role="status">{zh ? "工具配置已保存。" : "Tool configuration saved."}</p>}
      {state.error && <p className="form-error" role="alert">{errorMessages[state.error] ?? errorMessages.unknown}</p>}
      <div className="admin-form-actions">
        <button className="button button-primary" disabled={pending}><Save size={16} />{pending ? (zh ? "保存中…" : "Saving…") : zh ? "保存工具" : "Save tool"}</button>
      </div>
    </form>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return <label className="settings-toggle"><input type="checkbox" name={name} defaultChecked={defaultChecked} /><span>{label}</span></label>;
}
