"use client";

import { useCallback, useState } from "react";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

const example =
  '{"project":"DevToolbox","private":true,"tools":["JSON","Base64","Regex"],"limits":{"local":true}}';

export function JsonFormatterTool({
  definition,
  messages,
}: ToolComponentProps) {
  const [indent, setIndent] = useState(2);
  const workerTask = useCallback(
    (input: string) => ({ operation: "json-format", input, indent }) as const,
    [indent],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput={example}
      actionLabel={messages.tool.formatJson}
      filename="formatted.json"
      definition={definition}
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
  const workerTask = useCallback(
    (input: string) => ({ operation: "json-validate", input }) as const,
    [],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput={example}
      actionLabel={messages.tool.validate}
      outputLabel={messages.tool.validationResult}
      filename="validation.txt"
      definition={definition}
    />
  );
}

export function JsonMinifierTool({ definition, messages }: ToolComponentProps) {
  const workerTask = useCallback(
    (input: string) => ({ operation: "json-minify", input }) as const,
    [],
  );
  return (
    <TextWorkbench
      messages={messages}
      workerTask={workerTask}
      initialInput={JSON.stringify(JSON.parse(example), null, 2)}
      actionLabel={messages.tool.minifyJson}
      filename="minified.json"
      definition={definition}
    />
  );
}
