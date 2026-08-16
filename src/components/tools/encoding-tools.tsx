"use client";

import { useCallback, useState } from "react";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

export function Base64Tool({ definition, messages }: ToolComponentProps) {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const workerTask = useCallback(
    (input: string) =>
      ({
        operation: mode === "encode" ? "base64-encode" : "base64-decode",
        input,
      }) as const,
    [mode],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput="Hello, developer! 👋"
      actionLabel={
        mode === "encode" ? messages.tool.encode : messages.tool.decode
      }
      filename="base64.txt"
      definition={definition}
      options={
        <div className="segmented">
          <button
            aria-pressed={mode === "encode"}
            onClick={() => setMode("encode")}
          >
            {messages.tool.encode}
          </button>
          <button
            aria-pressed={mode === "decode"}
            onClick={() => setMode("decode")}
          >
            {messages.tool.decode}
          </button>
        </div>
      }
    />
  );
}

export function UrlEncoderTool({ definition, messages }: ToolComponentProps) {
  const workerTask = useCallback(
    (input: string) => ({ operation: "url-encode", input }) as const,
    [],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput="https://example.com/search?q=developer tools&lang=en"
      actionLabel={messages.tool.encodeUrl}
      filename="encoded-url.txt"
      definition={definition}
    />
  );
}

export function UrlDecoderTool({ definition, messages }: ToolComponentProps) {
  const workerTask = useCallback(
    (input: string) => ({ operation: "url-decode", input }) as const,
    [],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput="https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Ddeveloper%20tools"
      actionLabel={messages.tool.decodeUrl}
      filename="decoded-url.txt"
      definition={definition}
    />
  );
}
