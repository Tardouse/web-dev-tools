"use client";

import { useCallback, useState } from "react";
import { interpolate } from "@/i18n";
import type { HashAlgorithm } from "@/lib/tools";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

const algorithms: HashAlgorithm[] = [
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "SHA-1",
  "MD5",
];
export function HashTool({ definition, messages }: ToolComponentProps) {
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const workerTask = useCallback(
    (input: string) => ({ operation: "hash", input, algorithm }) as const,
    [algorithm],
  );
  return (
    <>
      <TextWorkbench
        messages={messages}
        workerTask={workerTask}
        initialInput="developer-tools"
        actionLabel={`${messages.tool.generate} ${algorithm}`}
        outputLabel={interpolate(messages.tool.digest, { algorithm })}
        filename={`${algorithm.toLowerCase()}.txt`}
        definition={definition}
        options={
          <select
            className="select"
            style={{ width: 110, height: 34 }}
            value={algorithm}
            onChange={(event) =>
              setAlgorithm(event.target.value as HashAlgorithm)
            }
          >
            {algorithms.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        }
      />
      <p className="muted" style={{ fontSize: ".8rem", margin: "10px 2px" }}>
        {messages.tool.compatibilityWarning}
      </p>
    </>
  );
}
