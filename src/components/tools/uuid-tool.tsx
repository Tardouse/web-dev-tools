"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { createUuidList } from "@/lib/tools";
import { ActionButton, CopyButton, DownloadButton } from "./tool-actions";
import type { ToolComponentProps } from "@/lib/types";

export function UuidTool({ messages }: ToolComponentProps) {
  const [count, setCount] = useState(5);
  const [values, setValues] = useState<string[]>([]);
  const generate = () => setValues(createUuidList(count));
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <h2>{messages.tool.uuidGenerator}</h2>
        <div className="workspace-actions">
          <label className="field-label">
            {messages.common.count}{" "}
            <input
              className="input"
              style={{ width: 74, height: 34 }}
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </label>
          <ActionButton onClick={generate} icon={RefreshCw} primary>
            Generate
          </ActionButton>
          <CopyButton
            messages={messages}
            value={values.join("\n")}
            label={messages.common.copyAll}
          />
          <DownloadButton
            messages={messages}
            value={values.join("\n")}
            filename="uuids.txt"
          />
        </div>
      </div>
      {values.length ? (
        <div className="uuid-list">
          {values.map((value) => (
            <div className="uuid-row" key={value}>
              <code>{value}</code>
              <CopyButton
                messages={messages}
                value={value}
                label={messages.common.copy}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>{messages.tool.uuidReadyTitle}</h3>
          <p>{messages.tool.uuidReadyText}</p>
          <ActionButton onClick={generate} icon={RefreshCw} primary>
            {messages.tool.generateUuids}
          </ActionButton>
        </div>
      )}
      <div className="workspace-footer">
        <span className="workspace-footer-meta">{messages.tool.webCrypto}</span>
      </div>
    </section>
  );
}
