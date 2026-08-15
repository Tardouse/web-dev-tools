"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";
import {
  updateSettingsAction,
  type SettingsActionState,
} from "@/app/[locale]/admin/(console)/settings/actions";
import type { Locale } from "@/i18n";
import type { SiteSettings } from "@/lib/site-settings";

const initial: SettingsActionState = {};

export function SystemSettingsForm({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const [state, action, pending] = useActionState(updateSettingsAction, initial);
  const zh = locale === "zh";
  return (
    <form action={action} className="admin-config-form">
      <input type="hidden" name="locale" value={locale} />
      <section className="settings-section card">
        <div className="settings-section-heading"><div><h2>{zh ? "品牌与站点信息" : "Brand & site identity"}</h2><p>{zh ? "用于导航、页面元数据和公开页脚。" : "Used by navigation, metadata, and the public footer."}</p></div></div>
        <div className="settings-grid">
          <Field name="siteName" label={zh ? "网站名称" : "Site name"} value={settings.siteName} required maxLength={80} />
          <Field name="logoText" label={zh ? "Logo 文字" : "Logo text"} value={settings.logoText} required maxLength={12} />
          <Field name="logoUrl" label={zh ? "Logo URL（可选）" : "Logo URL (optional)"} value={settings.logoUrl} maxLength={500} wide />
          <Area name="descriptionZh" label="中文 Description" value={settings.descriptionZh} maxLength={500} />
          <Area name="descriptionEn" label="English Description" value={settings.descriptionEn} maxLength={500} />
          <Area name="footerZh" label={zh ? "中文 Footer" : "Chinese footer"} value={settings.footerZh} maxLength={300} />
          <Area name="footerEn" label={zh ? "英文 Footer" : "English footer"} value={settings.footerEn} maxLength={300} />
          <Field name="legalText" label={zh ? "ICP / 法律信息" : "Legal / registration text"} value={settings.legalText} maxLength={500} wide />
          <Field name="contactEmail" label={zh ? "联系邮箱" : "Contact email"} value={settings.contactEmail} type="email" maxLength={254} wide />
        </div>
      </section>

      <section className="settings-section card">
        <div className="settings-section-heading"><div><h2>{zh ? "账号与访问" : "Accounts & access"}</h2><p>{zh ? "控制新账号、验证流程和维护页面。" : "Control new accounts, verification, and maintenance mode."}</p></div></div>
        <div className="settings-toggle-grid">
          <Toggle name="registrationEnabled" label={zh ? "开放用户注册" : "User registration"} checked={settings.registrationEnabled} />
          <Toggle name="emailVerificationEnabled" label={zh ? "要求邮箱验证" : "Require email verification"} checked={settings.emailVerificationEnabled} />
          <Toggle name="maintenanceMode" label={zh ? "维护模式" : "Maintenance mode"} checked={settings.maintenanceMode} danger />
          <Toggle name="adsEnabled" label={zh ? "显示广告位" : "Show advertising slots"} checked={settings.adsEnabled} />
        </div>
      </section>

      <section className="settings-section card">
        <div className="settings-section-heading"><div><h2>{zh ? "容量与 API 限额" : "Capacity & API limits"}</h2><p>{zh ? "所有 API 数值均为每个身份每分钟的请求数。" : "API values are requests per identity per minute."}</p></div></div>
        <div className="settings-grid">
          <NumberField name="defaultToolLimitMb" label={zh ? "默认工具限制（MB）" : "Default tool limit (MB)"} value={settings.defaultToolLimit / 1024 / 1024} min={0.001} max={100} step={0.001} />
          <NumberField name="fileUploadLimitMb" label={zh ? "文件上传限制（MB）" : "File upload limit (MB)"} value={settings.fileUploadLimit / 1024 / 1024} min={0.001} max={100} step={0.001} />
          <NumberField name="anonymousApiLimit" label={zh ? "匿名 API 限额" : "Anonymous API limit"} value={settings.anonymousApiLimit} min={1} max={100000} step={1} />
          <NumberField name="userApiLimit" label={zh ? "登录用户 API 限额" : "Signed-in API limit"} value={settings.userApiLimit} min={1} max={100000} step={1} />
        </div>
      </section>

      {state.ok && <p className="form-success" role="status">{zh ? "系统设置已保存并生效。" : "System settings saved and applied."}</p>}
      {state.error && <p className="form-error" role="alert">{state.error === "forbidden" ? (zh ? "只有超级管理员可以修改系统设置。" : "Only a Super Admin can update system settings.") : (zh ? "请检查所有设置值。" : "Check all setting values.")}</p>}
      <div className="admin-form-actions"><button className="button button-primary" disabled={pending}><Save size={16} />{pending ? (zh ? "保存中…" : "Saving…") : zh ? "保存系统设置" : "Save system settings"}</button></div>
    </form>
  );
}

function Field({ name, label, value, wide, required, type = "text", maxLength }: { name: string; label: string; value: string; wide?: boolean; required?: boolean; type?: string; maxLength?: number }) {
  return <label className={`settings-field${wide ? " settings-field-wide" : ""}`}><span>{label}</span><input className="field-input" name={name} defaultValue={value} required={required} type={type} maxLength={maxLength} /></label>;
}
function Area({ name, label, value, maxLength }: { name: string; label: string; value: string; maxLength: number }) {
  return <label className="settings-field"><span>{label}</span><textarea className="field-input" name={name} defaultValue={value} required rows={3} maxLength={maxLength} /></label>;
}
function NumberField({ name, label, value, min, max, step }: { name: string; label: string; value: number; min: number; max: number; step: number }) {
  const precision = step < 1 ? Math.ceil(-Math.log10(step)) : 0;
  const displayValue = Number(value.toFixed(precision));
  return <label className="settings-field"><span>{label}</span><input className="field-input" name={name} type="number" defaultValue={displayValue} min={min} max={max} step={step} required /></label>;
}
function Toggle({ name, label, checked, danger = false }: { name: string; label: string; checked: boolean; danger?: boolean }) {
  return <label className={`settings-toggle${danger ? " is-danger" : ""}`}><input type="checkbox" name={name} defaultChecked={checked} /><span>{label}</span></label>;
}
