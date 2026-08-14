"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CircleAlert, Download } from "lucide-react";
import type { ToolComponentProps } from "@/lib/types";

export function QrCodeTool({ messages }: ToolComponentProps) {
  const [input, setInput] = useState("https://example.com");
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!input) {
        setUrl("");
        return;
      }
      try {
        const result = await QRCode.toDataURL(input, {
          width: size,
          margin: 2,
          errorCorrectionLevel: level,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!cancelled) {
          setUrl(result);
          setError("");
        }
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "QR generation failed.",
          );
      }
    }, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input, size, level]);
  const download = () => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "qr-code.png";
    anchor.click();
  };
  return (
    <section className="tool-workspace card">
      <div className="workspace-header">
        <h2>{messages.tool.qrGenerator}</h2>
        <div className="workspace-actions">
          <label className="field-label">
            {messages.tool.size}{" "}
            <select
              className="select"
              style={{ width: 90, height: 34 }}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            >
              {[192, 256, 384, 512].map((item) => (
                <option key={item}>{item}px</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            {messages.tool.correction}{" "}
            <select
              className="select"
              style={{ width: 70, height: 34 }}
              value={level}
              onChange={(event) => setLevel(event.target.value as typeof level)}
            >
              {["L", "M", "Q", "H"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button
            className="button button-sm"
            onClick={download}
            disabled={!url}
          >
            <Download size={15} />
            {messages.tool.downloadPng}
          </button>
        </div>
      </div>
      {error && (
        <div className="error-banner">
          <CircleAlert size={17} />
          {error}
        </div>
      )}
      <div className="workspace-grid">
        <div className="workspace-panel">
          <div className="panel-label">{messages.tool.textOrUrl}</div>
          <textarea
            className="editor"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <div className="workspace-panel">
          <div className="panel-label">{messages.tool.preview}</div>
          <div className="qr-output">
            {url ? (
              <Image
                src={url}
                alt={messages.tool.qrGenerator}
                width={size}
                height={size}
                unoptimized
              />
            ) : (
              <span className="muted">{messages.tool.qrEmpty}</span>
            )}
          </div>
        </div>
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">{messages.tool.qrLocal}</span>
      </div>
    </section>
  );
}
