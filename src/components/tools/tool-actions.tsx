"use client";

import { Check, Clipboard, Download, Eraser, Play } from "lucide-react";
import { useState } from "react";
import { copyToClipboard, downloadText } from "@/lib/clipboard";
import { useToast } from "@/components/providers/toast-provider";
import { interpolate, type Messages } from "@/i18n";

export function ActionButton({
  onClick,
  children,
  icon: Icon,
  primary = false,
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ComponentType<{ size?: number }>;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`button button-sm${primary ? " button-primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}
export function RunButton({
  onClick,
  label,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <ActionButton onClick={onClick} icon={Play} primary disabled={disabled}>
      {label}
    </ActionButton>
  );
}
export function ClearButton({
  onClick,
  messages,
}: {
  onClick: () => void;
  messages: Messages;
}) {
  return (
    <ActionButton onClick={onClick} icon={Eraser}>
      {messages.common.clear}
    </ActionButton>
  );
}
export function CopyButton({
  value,
  messages,
  label,
}: {
  value: string;
  messages: Messages;
  label?: string;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await copyToClipboard(value);
      setCopied(true);
      toast(messages.workbench.clipboardSuccess);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast(messages.workbench.clipboardError, "error");
    }
  };
  return (
    <ActionButton
      onClick={copy}
      icon={copied ? Check : Clipboard}
      disabled={!value}
    >
      {copied ? messages.common.copied : (label ?? messages.common.copy)}
    </ActionButton>
  );
}
export function DownloadButton({
  value,
  filename,
  messages,
  type,
}: {
  value: string;
  filename: string;
  messages: Messages;
  type?: string;
}) {
  const { toast } = useToast();
  return (
    <ActionButton
      onClick={() => {
        downloadText(value, filename, type);
        toast(interpolate(messages.workbench.downloaded, { filename }));
      }}
      icon={Download}
      disabled={!value}
    >
      {messages.common.download}
    </ActionButton>
  );
}
