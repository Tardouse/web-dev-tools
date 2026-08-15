"use client";

import { Clipboard, UserPlus, X } from "lucide-react";
import { useActionState, useState } from "react";
import { createUserAction, type UserActionState } from "@/app/[locale]/admin/(console)/users/actions";
import type { Locale } from "@/i18n";

const initial: UserActionState = {};
export function CreateUserButton({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createUserAction, initial);
  const zh = locale === "zh";
  return <><button className="button button-primary" onClick={() => setOpen(true)}><UserPlus size={16} />{zh ? "创建用户" : "Create user"}</button>{open && <div className="dialog-backdrop admin-dialog-backdrop" role="presentation"><div className="confirm-dialog card" role="dialog" aria-modal="true" aria-labelledby="create-user-title"><button className="icon-button confirm-close" onClick={() => setOpen(false)} aria-label={zh ? "关闭" : "Close"}><X size={18} /></button><h2 id="create-user-title">{zh ? "创建普通用户" : "Create a user"}</h2><p>{zh ? "系统将生成一次性临时密码，用户首次登录时必须修改。" : "A one-time password will be generated and must be changed at first sign-in."}</p>{state.temporaryPassword ? <div className="temporary-password"><span>{zh ? "临时密码（仅显示一次）" : "Temporary password (shown once)"}</span><code>{state.temporaryPassword}</code><button className="button button-sm" onClick={() => void navigator.clipboard.writeText(state.temporaryPassword ?? "")}><Clipboard size={14} />{zh ? "复制" : "Copy"}</button></div> : <form action={action}><input type="hidden" name="locale" value={locale} /><label className="field-label" htmlFor="managed-name">{zh ? "姓名" : "Name"}</label><input className="field-input" id="managed-name" name="name" required minLength={2} maxLength={80} /><label className="field-label" htmlFor="managed-email">{zh ? "邮箱" : "Email"}</label><input className="field-input" id="managed-email" name="email" type="email" required maxLength={254} />{state.error && <p className="form-error" role="alert">{zh ? "无法创建用户，请检查信息是否有效或邮箱是否已使用。" : "Could not create the user. Check the details and whether the email is in use."}</p>}<div className="confirm-actions"><button className="button" type="button" onClick={() => setOpen(false)}>{zh ? "取消" : "Cancel"}</button><button className="button button-primary" disabled={pending}>{pending ? (zh ? "正在创建…" : "Creating…") : zh ? "创建" : "Create"}</button></div></form>}</div></div>}</>;
}
