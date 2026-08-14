"use client";

import { useMemo, useState } from "react";
import { CircleAlert, ShieldCheck } from "lucide-react";
import { decodeJwt } from "@/lib/tools";
import { CopyButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";
import { localizeToolError } from "@/i18n/errors";

const demo =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRldmVsb3BlciIsImlhdCI6MTUxNjIzOTAyMn0.invalid-signature";
export function JwtTool({ messages }: ToolComponentProps) {
  const [input, setInput] = useState(demo);
  const result = useMemo(() => {
    try {
      return { value: decodeJwt(input), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Decode failed.",
      };
    }
  }, [input]);
  return (
    <section className="tool-workspace card">
      <div className="success-banner error-banner">
        <ShieldCheck size={17} />
        <span>{messages.tool.jwtSafety}</span>
      </div>
      {result.error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {localizeToolError(result.error, messages)}
        </div>
      )}
      <div className="workspace-grid">
        <div className="workspace-panel">
          <div className="panel-label">{messages.tool.encodedJwt}</div>
          <textarea
            className="editor"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <div className="workspace-panel">
          <div className="panel-label">
            <span>{messages.tool.decodedPayload}</span>
            <CopyButton
              messages={messages}
              value={
                result.value
                  ? JSON.stringify(result.value.payload, null, 2)
                  : ""
              }
            />
          </div>
          <pre className="editor editor-output">
            {result.value ? JSON.stringify(result.value.payload, null, 2) : ""}
          </pre>
        </div>
      </div>
      {result.value && (
        <div className="parse-grid">
          <div className="parse-key">{messages.parsed.header}</div>
          <pre className="mono" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(result.value.header, null, 2)}
          </pre>
          <div className="parse-key">{messages.tool.issued}</div>
          <div>{result.value.issuedAt ?? messages.common.notPresent}</div>
          <div className="parse-key">{messages.tool.expires}</div>
          <div>
            {result.value.expiresAt ?? messages.common.notPresent}{" "}
            {result.value.expired === true && (
              <span className="badge badge-warning">
                {messages.tool.expired}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
