"use client";

import { useCallback, useState } from "react";
import { formatJson, minifyJson, validateJson } from "@/lib/tools";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

const example =
  '{"project":"DevToolbox","private":true,"tools":["JSON","Base64","Regex"],"limits":{"local":true}}';

export function JsonFormatterTool({
  definition,
  messages,
}: ToolComponentProps) {
  const [indent, setIndent] = useState(2);
  const transform = useCallback(
    (input: string) => formatJson(input, indent),
    [indent],
  );
  return (
    <TextWorkbench
      messages={messages}
      transform={transform}
      initialInput={example}
      actionLabel={messages.tool.formatJson}
      filename="formatted.json"
      maxInputSize={definition?.maxInputSize}
      options={
        <label className="field-label">
          {messages.tool.indent}{" "}
          <select
            className="select"
            style={{ width: 70, height: 34 }}
            value={indent}
            onChange={(event) => setIndent(Number(event.target.value))}
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>
      }
    />
  );
}

export function JsonValidatorTool({
  definition,
  messages,
}: ToolComponentProps) {
  const transform = useCallback((input: string) => validateJson(input), []);
  return (
    <TextWorkbench
      messages={messages}
      transform={transform}
      initialInput={example}
      actionLabel={messages.tool.validate}
      outputLabel={messages.tool.validationResult}
      filename="validation.txt"
      maxInputSize={definition?.maxInputSize}
    />
  );
}

export function JsonMinifierTool({ definition, messages }: ToolComponentProps) {
  const transform = useCallback((input: string) => minifyJson(input), []);
  return (
    <TextWorkbench
      messages={messages}
      transform={transform}
      initialInput={JSON.stringify(JSON.parse(example), null, 2)}
      actionLabel={messages.tool.minifyJson}
      filename="minified.json"
      maxInputSize={definition?.maxInputSize}
    />
  );
}
