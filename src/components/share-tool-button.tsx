"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { interpolate, type Messages } from "@/i18n";
import { useToast } from "@/components/providers/toast-provider";

export function ShareToolButton({
  name,
  messages,
}: {
  name: string;
  messages: Messages;
}) {
  const { toast } = useToast();
  const [shared, setShared] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        await copyToClipboard(url);
      }
      setShared(true);
      toast(messages.toolPage.shareSuccess);
      window.setTimeout(() => setShared(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast(messages.toolPage.shareError, "error");
    }
  };

  return (
    <button type="button" className="button button-sm" onClick={share}>
      {shared ? <Check size={16} /> : <Share2 size={16} />}
      {shared
        ? messages.toolPage.shared
        : interpolate(messages.toolPage.share, { name })}
    </button>
  );
}
