"use client";

import { useCallback, useState } from "react";
import { decodeBase64, decodeUrl, encodeBase64, encodeUrl } from "@/lib/tools";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

export function Base64Tool({ definition, messages }: ToolComponentProps) {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const transform = useCallback(
    (input: string) =>
      mode === "encode" ? encodeBase64(input) : decodeBase64(input),
    [mode],
  );
  return (
    <TextWorkbench
      messages={messages}
      transform={transform}
      initialInput="Hello, developer! 👋"
      actionLabel={
        mode === "encode" ? messages.tool.encode : messages.tool.decode
      }
      filename="base64.txt"
      maxInputSize={definition?.maxInputSize}
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
  const transform = useCallback((input: string) => encodeUrl(input), []);
  return (
    <TextWorkbench
      messages={messages}
      transform={transform}
      initialInput="https://example.com/search?q=developer tools&lang=en"
      actionLabel={messages.tool.encodeUrl}
      filename="encoded-url.txt"
      maxInputSize={definition?.maxInputSize}
    />
  );
}

export function UrlDecoderTool({ definition, messages }: ToolComponentProps) {
  const transform = useCallback((input: string) => decodeUrl(input), []);
  return (
    <TextWorkbench
      messages={messages}
      transform={transform}
      initialInput="https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Ddeveloper%20tools"
      actionLabel={messages.tool.decodeUrl}
      filename="decoded-url.txt"
      maxInputSize={definition?.maxInputSize}
    />
  );
}
