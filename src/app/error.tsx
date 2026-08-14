"use client";

import { CircleAlert, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({
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
          Something went wrong
        </h1>
        <p>
          The page hit an unexpected error. Your tool input was not sent
          anywhere.
        </p>
        <button className="button button-primary" onClick={reset}>
          <RefreshCcw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}
