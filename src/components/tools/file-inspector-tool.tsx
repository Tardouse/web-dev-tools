"use client";

import { useMemo, useState } from "react";
import { CircleAlert, FileSearch, Hash } from "lucide-react";
import { formatBytes, TOOL_LIMITS } from "@/lib/config";
import {
  convertFileSize,
  createHexPreview,
  detectTextEncodings,
  hashFileBytes,
  resolveFileMime,
  type FileHashAlgorithm,
  type FileSizeUnit,
} from "@/lib/tools";
import type { ToolComponentProps } from "@/lib/types";

const hashAlgorithms: FileHashAlgorithm[] = [
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "SHA-1",
  "MD5",
];
const sizeUnits: FileSizeUnit[] = ["B", "KB", "MB", "GB", "KiB", "MiB", "GiB"];

export function FileInspectorTool({ locale }: ToolComponentProps) {
  const zh = locale === "zh";
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Uint8Array | null>(null);
  const [algorithm, setAlgorithm] = useState<FileHashAlgorithm>("SHA-256");
  const [digest, setDigest] = useState("");
  const [error, setError] = useState("");
  const [sizeValue, setSizeValue] = useState(1);
  const [sizeUnit, setSizeUnit] = useState<FileSizeUnit>("MiB");
  const convertedSizes = useMemo(
    () => convertFileSize(sizeValue, sizeUnit),
    [sizeValue, sizeUnit],
  );
  const details = useMemo(() => {
    if (!file || !data) return null;
    return {
      mime: resolveFileMime(file.name, data, file.type),
      encodings: detectTextEncodings(data),
      hex: createHexPreview(data),
    };
  }, [file, data]);

  const inspect = async (selected: File) => {
    setError("");
    setDigest("");
    if (selected.size > TOOL_LIMITS.file) {
      setError(
        zh
          ? `文件不能超过 ${formatBytes(TOOL_LIMITS.file)}。`
          : `Files cannot exceed ${formatBytes(TOOL_LIMITS.file)}.`,
      );
      return;
    }
    try {
      const next = new Uint8Array(await selected.arrayBuffer());
      setFile(selected);
      setData(next);
      setDigest(await hashFileBytes(next, algorithm));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "File inspection failed.",
      );
    }
  };

  const rehash = async (nextAlgorithm: FileHashAlgorithm) => {
    setAlgorithm(nextAlgorithm);
    if (data) setDigest(await hashFileBytes(data, nextAlgorithm));
  };

  return (
    <section className="tool-workspace card file-tool-shell">
      <div className="workspace-header">
        <h2>{zh ? "文件检查器" : "File inspector"}</h2>
        <span className="badge">{formatBytes(TOOL_LIMITS.file)}</span>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          {error}
        </div>
      )}
      <div className="file-tool-body">
        <label className="file-dropzone compact">
          <FileSearch size={27} />
          <strong>
            {file?.name ??
              (zh
                ? "选择文件进行本地分析"
                : "Choose a file for local analysis")}
          </strong>
          <span>
            {file
              ? `${formatBytes(file.size)} · ${new Date(file.lastModified).toLocaleString()}`
              : zh
                ? "不会上传文件"
                : "The file is never uploaded"}
          </span>
          <input
            type="file"
            aria-label={zh ? "选择要分析的文件" : "Choose file to inspect"}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) void inspect(selected);
            }}
          />
        </label>
        {details && file && data && (
          <>
            <div className="file-metadata-grid">
              <div>
                <span>{zh ? "文件名" : "Name"}</span>
                <strong title={file.name}>{file.name}</strong>
              </div>
              <div>
                <span>{zh ? "大小" : "Size"}</span>
                <strong>
                  {formatBytes(file.size)} ({file.size.toLocaleString()} B)
                </strong>
              </div>
              <div>
                <span>MIME</span>
                <strong>{details.mime.type}</strong>
                <small>{details.mime.source}</small>
              </div>
              <div>
                <span>{zh ? "可能编码" : "Likely encoding"}</span>
                <strong>
                  {details.encodings[0]?.name ?? (zh ? "未知" : "Unknown")}
                </strong>
                <small>
                  {details.encodings[0]
                    ? `${details.encodings[0].confidence}%`
                    : ""}
                </small>
              </div>
            </div>
            <div className="file-hash-row">
              <label className="field">
                <span>{zh ? "文件 Hash" : "File hash"}</span>
                <select
                  aria-label={zh ? "Hash 算法" : "Hash algorithm"}
                  value={algorithm}
                  onChange={(event) =>
                    void rehash(event.target.value as FileHashAlgorithm)
                  }
                >
                  {hashAlgorithms.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <div className="hash-output">
                <Hash size={16} />
                <code>{digest || (zh ? "计算中…" : "Calculating…")}</code>
              </div>
            </div>
            <div className="file-detail-grid">
              <div>
                <div className="panel-label">
                  <span>Hex</span>
                  <span>{zh ? "前 4096 字节" : "First 4096 bytes"}</span>
                </div>
                <pre className="hex-viewer">
                  {details.hex || (zh ? "空文件" : "Empty file")}
                </pre>
              </div>
              <div>
                <div className="panel-label">
                  <span>{zh ? "编码候选" : "Encoding candidates"}</span>
                </div>
                <div className="encoding-list">
                  {details.encodings.map((item) => (
                    <div key={`${item.name}-${item.language ?? ""}`}>
                      <strong>{item.name}</strong>
                      <span>
                        {item.confidence}%
                        {item.language ? ` · ${item.language}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        <div className="size-converter">
          <div>
            <strong>{zh ? "文件大小换算" : "File size converter"}</strong>
            <span>
              {zh ? "同时显示十进制与二进制单位" : "SI and IEC units together"}
            </span>
          </div>
          <label className="field">
            <span>{zh ? "数值" : "Value"}</span>
            <input
              type="number"
              min="0"
              step="any"
              value={sizeValue}
              onChange={(event) =>
                setSizeValue(Math.max(0, Number(event.target.value)))
              }
            />
          </label>
          <label className="field">
            <span>{zh ? "单位" : "Unit"}</span>
            <select
              value={sizeUnit}
              onChange={(event) =>
                setSizeUnit(event.target.value as FileSizeUnit)
              }
            >
              {sizeUnits.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </label>
          <div className="size-results">
            {sizeUnits.map((unit) => (
              <span key={unit}>
                <b>
                  {Number(convertedSizes[unit].toPrecision(8)).toLocaleString()}
                </b>{" "}
                {unit}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {zh
            ? "签名优先的 MIME 检测 · 浏览器本地 Hash 与编码分析"
            : "Signature-first MIME detection · local hashing and encoding analysis"}
        </span>
      </div>
    </section>
  );
}
