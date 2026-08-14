"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Clipboard, KeyRound, Shield, Trash2, UserCheck, UserX, X } from "lucide-react";
import {
  deleteUserAction,
  resetPasswordAction,
  roleAction,
  statusAction,
  type UserActionState,
} from "@/app/[locale]/admin/users/actions";
import { useToast } from "@/components/providers/toast-provider";
import type { Locale } from "@/i18n";
import type { ManagedUser, SessionUser, UserRole } from "@/server/db/types";
import { canManageUser } from "@/lib/admin-permissions";
import { roleLabel } from "@/lib/admin-ui";

const initial: UserActionState = {};

type ActionKind = "status" | "role" | "reset" | "delete";

export function UserActions({
  locale,
  actor,
  user,
  compact = false,
}: {
  locale: Locale;
  actor: SessionUser;
  user: ManagedUser;
  compact?: boolean;
}) {
  const [dialog, setDialog] = useState<ActionKind | null>(null);
  const [role, setRole] = useState<UserRole>(user.role);
  const [statusState, statusFormAction, statusPending] = useActionState(statusAction, initial);
  const [roleState, roleFormAction, rolePending] = useActionState(roleAction, initial);
  const [resetState, resetFormAction, resetPending] = useActionState(resetPasswordAction, initial);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteUserAction, initial);
  const { toast } = useToast();
  const prior = useRef({ statusState, roleState, resetState, deleteState });
  const zh = locale === "zh";
  const manageable = canManageUser(actor, user);

  useEffect(() => {
    const states = [statusState, roleState, resetState, deleteState];
    const old = Object.values(prior.current);
    states.forEach((state, index) => {
      if (state !== old[index] && state.error) toast(errorText(state.error, locale), "error");
      if (state !== old[index] && state.ok && index !== 2) toast(zh ? "操作已完成" : "Action completed");
    });
    prior.current = { statusState, roleState, resetState, deleteState };
  }, [deleteState, locale, resetState, roleState, statusState, toast, zh]);

  if (!manageable) return <span className="subtle">{zh ? "无可用操作" : "No actions"}</span>;
  const common = <><input type="hidden" name="locale" value={locale} /><input type="hidden" name="userId" value={user.id} /></>;
  return (
    <>
      <div className={`user-action-buttons ${compact ? "is-compact" : ""}`}>
        <button className="button button-sm" onClick={() => setDialog("status")}>
          {user.status === "active" ? <UserX size={15} /> : <UserCheck size={15} />}
          {!compact && (user.status === "active" ? (zh ? "禁用" : "Disable") : zh ? "启用" : "Enable")}
        </button>
        {!compact && <button className="button button-sm" onClick={() => setDialog("role")}><Shield size={15} />{zh ? "修改角色" : "Change role"}</button>}
        {!compact && <button className="button button-sm" onClick={() => setDialog("reset")}><KeyRound size={15} />{zh ? "重置密码" : "Reset password"}</button>}
        <button className="button button-danger button-sm" onClick={() => setDialog("delete")}><Trash2 size={15} />{!compact && (zh ? "删除" : "Delete")}</button>
      </div>
      {dialog && (
        <div className="dialog-backdrop admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
          <div className="confirm-dialog card" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <button className="icon-button confirm-close" onClick={() => setDialog(null)} aria-label={zh ? "关闭" : "Close"}><X size={18} /></button>
            <h2 id="confirm-title">{dialogTitle(dialog, user, locale)}</h2>
            <p>{dialogDescription(dialog, user, locale)}</p>
            {dialog === "role" && <label className="field-label">{zh ? "新角色" : "New role"}<select className="field-select" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>{(["user", "admin", "super_admin"] as const).map((value) => <option value={value} key={value}>{roleLabel(value, locale)}</option>)}</select></label>}
            {dialog === "reset" && resetState.temporaryPassword && <div className="temporary-password"><span>{zh ? "临时密码（仅显示一次）" : "Temporary password (shown once)"}</span><code>{resetState.temporaryPassword}</code><button className="button button-sm" onClick={() => void navigator.clipboard.writeText(resetState.temporaryPassword ?? "")}><Clipboard size={14} />{zh ? "复制" : "Copy"}</button></div>}
            <div className="confirm-actions">
              <button className="button" onClick={() => setDialog(null)}>{zh ? "取消" : "Cancel"}</button>
              {dialog === "status" && <form action={statusFormAction}>{common}<input type="hidden" name="status" value={user.status === "active" ? "disabled" : "active"} /><button className="button button-primary" disabled={statusPending}>{statusPending ? (zh ? "处理中…" : "Working…") : zh ? "确认" : "Confirm"}</button></form>}
              {dialog === "role" && <form action={roleFormAction}>{common}<input type="hidden" name="role" value={role} /><button className="button button-primary" disabled={rolePending}>{rolePending ? (zh ? "处理中…" : "Working…") : zh ? "保存角色" : "Save role"}</button></form>}
              {dialog === "reset" && !resetState.temporaryPassword && <form action={resetFormAction}>{common}<button className="button button-primary" disabled={resetPending}>{resetPending ? (zh ? "处理中…" : "Working…") : zh ? "生成临时密码" : "Generate password"}</button></form>}
              {dialog === "delete" && <form action={deleteFormAction}>{common}<button className="button button-danger" disabled={deletePending}>{deletePending ? (zh ? "正在删除…" : "Deleting…") : zh ? "永久删除" : "Delete permanently"}</button></form>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function dialogTitle(kind: ActionKind, user: ManagedUser, locale: Locale): string {
  const zh = locale === "zh";
  if (kind === "status") return user.status === "active" ? (zh ? "禁用用户？" : "Disable user?") : zh ? "启用用户？" : "Enable user?";
  if (kind === "role") return zh ? "修改用户角色" : "Change user role";
  if (kind === "reset") return zh ? "重置用户密码" : "Reset user password";
  return zh ? "永久删除用户？" : "Delete user permanently?";
}
function dialogDescription(kind: ActionKind, user: ManagedUser, locale: Locale): string {
  const zh = locale === "zh";
  if (kind === "status") return user.status === "active" ? (zh ? `禁用 ${user.email} 后，其所有会话会立即失效。` : `Disabling ${user.email} immediately revokes all sessions.`) : zh ? `重新允许 ${user.email} 登录。` : `Allow ${user.email} to sign in again.`;
  if (kind === "role") return zh ? "角色变化会撤销该用户的全部现有会话。" : "Changing the role revokes all existing sessions.";
  if (kind === "reset") return zh ? "将生成一次性临时密码、撤销会话，并要求下次登录修改密码。" : "This creates a one-time temporary password, revokes sessions, and requires a password change.";
  return zh ? `此操作不可撤销。${user.email} 的账号、会话和关联数据将被删除。` : `This cannot be undone. ${user.email}, sessions, and associated data will be deleted.`;
}
function errorText(code: string, locale: Locale): string {
  const zh = locale === "zh";
  const values: Record<string, [string, string]> = { not_found: ["用户不存在。", "User not found."], forbidden: ["您无权执行此操作。", "You are not allowed to perform this action."], invalid: ["请求参数无效。", "The request is invalid."], last_super_admin: ["不能移除最后一名超级管理员。", "The last Super Admin cannot be removed."], unknown: ["操作失败，请重试。", "The action failed. Try again."] };
  return values[code]?.[zh ? 0 : 1] ?? values.unknown[zh ? 0 : 1];
}
