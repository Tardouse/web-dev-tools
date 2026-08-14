"use client";

import { CircleAlert, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container not-found">
      <div>
        <CircleAlert size={42} className="subtle" />
        <h1 style={{ fontSize: "3rem", marginTop: 15 }}>
          出现错误 · Something went wrong
        </h1>
        <p>页面发生意外错误，但您的工具输入未发送到任何地方。</p>
        <button className="button button-primary" onClick={reset}>
          <RefreshCcw size={16} />
          重试
        </button>
      </div>
    </div>
  );
}
