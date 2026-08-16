"use client";

import { useCallback } from "react";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

export function SimpleTransformTool({
  definition,
  messages,
  transform,
  initialInput,
  actionLabel,
  inputLabel,
  outputLabel,
  filename,
}: ToolComponentProps & {
  transform: (input: string) => string | Promise<string>;
  initialInput?: string;
  actionLabel?: string;
  inputLabel?: string;
  outputLabel?: string;
  filename?: string;
}) {
  const stableTransform = useCallback(
    (input: string) => transform(input),
    [transform],
  );
  return (
    <TextWorkbench
      messages={messages}
      transform={stableTransform}
      initialInput={initialInput}
      actionLabel={actionLabel}
      inputLabel={inputLabel}
      outputLabel={outputLabel}
      filename={filename}
      definition={definition}
    />
  );
}
