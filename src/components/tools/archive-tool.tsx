"use client";

import { useState } from "react";
import {
  ArchiveRestore,
  CircleAlert,
  Download,
  FileArchive,
  PackagePlus,
} from "lucide-react";
import { downloadBytes } from "@/lib/clipboard";
import { formatBytes, TOOL_LIMITS } from "@/lib/config";
import type { LocalFileEntry } from "@/lib/tools";
import { runToolWorker } from "@/lib/tool-execution";
import { localizeToolError } from "@/i18n/errors";
import type { ToolComponentProps } from "@/lib/types";
import { ActionButton } from "./tool-actions";

type ArchiveMode = "extract" | "zip" | "gzip";

export function ArchiveWorkbenchTool({
  locale,
  definition,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const inputLimit = definition?.maxInputSize ?? TOOL_LIMITS.archive;
  const [mode, setMode] = useState<ArchiveMode>("extract");
  const [entries, setEntries] = useState<LocalFileEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [gzipFile, setGzipFile] = useState<File | null>(null);
  const [gzipAction, setGzipAction] = useState<"compress" | "decompress">(
    "compress",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const bytes = async (file: File) => {
    if (file.size > inputLimit) {
      throw new Error(
        zh
          ? `文件不能超过 ${formatBytes(inputLimit)}。`
          : `Files cannot exceed ${formatBytes(inputLimit)}.`,
      );
    }
    return new Uint8Array(await file.arrayBuffer());
  };

  const extract = async (file: File) => {
    setBusy(true);
    setError("");
    setEntries([]);
    try {
      const data = await bytes(file);
      const lower = file.name.toLowerCase();
      const format = lower.endsWith(".zip")
        ? "zip"
        : lower.endsWith(".tar")
          ? "tar"
          : lower.endsWith(".tar.gz") || lower.endsWith(".tgz")
            ? "tar-gzip"
            : lower.endsWith(".gz") || file.type === "application/gzip"
              ? "gzip"
              : null;
      if (!format) {
        throw new Error(
          zh
            ? "请选择 ZIP、TAR、TAR.GZ 或 GZIP 文件。"
            : "Choose a ZIP, TAR, TAR.GZ, or GZIP file.",
        );
      }
      const result = await runToolWorker<LocalFileEntry[]>(
        {
          operation: "archive-extract",
          data,
          format,
          filename: file.name,
        },
        definition,
      );
      setEntries(result);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? localizeToolError(caught.message, messages)
          : "Archive extraction failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const createZip = async () => {
    setBusy(true);
    setError("");
    try {
      const files = await Promise.all(
        selectedFiles.map(async (file) => ({
          name: file.name,
          data: await bytes(file),
        })),
      );
      const archive = await runToolWorker<Uint8Array>(
        { operation: "archive-create-zip", files },
        definition,
      );
      downloadBytes(archive, "devtoolbox-files.zip", "application/zip");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? localizeToolError(caught.message, messages)
          : "ZIP creation failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const runGzip = async () => {
    if (!gzipFile) return;
    setBusy(true);
    setError("");
    try {
      const data = await bytes(gzipFile);
      const output = await runToolWorker<Uint8Array>(
        { operation: "archive-gzip", data, action: gzipAction },
        definition,
      );
      if (gzipAction === "compress") {
        downloadBytes(output, `${gzipFile.name}.gz`, "application/gzip");
      } else {
        const filename =
          gzipFile.name.replace(/\.gz$/i, "") || "decompressed-file";
        downloadBytes(output, filename);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? localizeToolError(caught.message, messages)
          : "GZIP operation failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="tool-workspace card file-tool-shell">
      <div className="workspace-header">
        <h2>{zh ? "归档工作台" : "Archive workbench"}</h2>
        <div
          className="segmented"
          aria-label={zh ? "归档操作" : "Archive operation"}
        >
          {(
            [
              ["extract", zh ? "解包" : "Extract"],
              ["zip", zh ? "创建 ZIP" : "Create ZIP"],
              ["gzip", "GZIP"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          {error}
        </div>
      )}
      <div className="file-tool-body">
        {mode === "extract" && (
          <>
            <label className="file-dropzone">
              <ArchiveRestore size={28} />
              <strong>
                {busy
                  ? zh
                    ? "正在安全解包…"
                    : "Extracting safely…"
                  : zh
                    ? "选择归档文件"
                    : "Choose an archive"}
              </strong>
              <span>ZIP · TAR · TAR.GZ · GZIP</span>
              <input
                type="file"
                accept=".zip,.tar,.tar.gz,.tgz,.gz,application/zip,application/gzip"
                aria-label={
                  zh ? "选择要解包的归档文件" : "Choose archive to extract"
                }
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void extract(file);
                }}
              />
            </label>
            {entries.length > 0 && (
              <div
                className="file-result-list"
                aria-label={zh ? "已解包文件" : "Extracted files"}
              >
                <div className="panel-label">
                  <span>
                    {zh
                      ? `已安全解包 ${entries.length} 个文件`
                      : `${entries.length} files extracted safely`}
                  </span>
                  <span>
                    {formatBytes(
                      entries.reduce(
                        (sum, item) => sum + item.data.byteLength,
                        0,
                      ),
                    )}
                  </span>
                </div>
                {entries.map((entry) => (
                  <div className="file-result-row" key={entry.name}>
                    <FileArchive size={16} />
                    <code title={entry.name}>{entry.name}</code>
                    <span>{formatBytes(entry.data.byteLength)}</span>
                    <button
                      className="icon-button"
                      title={zh ? "下载文件" : "Download file"}
                      aria-label={`${zh ? "下载" : "Download"} ${entry.name}`}
                      onClick={() =>
                        downloadBytes(
                          entry.data,
                          entry.name.split("/").pop() ?? "file",
                        )
                      }
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {mode === "zip" && (
          <div className="file-operation-panel">
            <label className="file-dropzone">
              <PackagePlus size={28} />
              <strong>
                {zh ? "选择要压缩的文件" : "Choose files to compress"}
              </strong>
              <span>
                {selectedFiles.length
                  ? `${selectedFiles.length} ${zh ? "个文件" : "files"}`
                  : zh
                    ? "最多 500 个文件"
                    : "Up to 500 files"}
              </span>
              <input
                type="file"
                multiple
                aria-label={
                  zh ? "选择要创建 ZIP 的文件" : "Choose files for ZIP"
                }
                onChange={(event) =>
                  setSelectedFiles(Array.from(event.target.files ?? []))
                }
              />
            </label>
            <ActionButton
              icon={FileArchive}
              primary
              disabled={!selectedFiles.length || busy}
              onClick={() => void createZip()}
            >
              {busy
                ? zh
                  ? "正在创建…"
                  : "Creating…"
                : zh
                  ? "创建并下载 ZIP"
                  : "Create and download ZIP"}
            </ActionButton>
          </div>
        )}
        {mode === "gzip" && (
          <div className="file-operation-panel">
            <div className="segmented">
              <button
                aria-pressed={gzipAction === "compress"}
                onClick={() => setGzipAction("compress")}
              >
                {zh ? "压缩" : "Compress"}
              </button>
              <button
                aria-pressed={gzipAction === "decompress"}
                onClick={() => setGzipAction("decompress")}
              >
                {zh ? "解压" : "Decompress"}
              </button>
            </div>
            <label className="file-dropzone">
              <FileArchive size={28} />
              <strong>
                {gzipFile?.name ?? (zh ? "选择单个文件" : "Choose one file")}
              </strong>
              <span>
                {gzipAction === "compress"
                  ? zh
                    ? "输出 .gz 文件"
                    : "Outputs a .gz file"
                  : zh
                    ? "请选择 .gz 文件"
                    : "Choose a .gz file"}
              </span>
              <input
                type="file"
                accept={
                  gzipAction === "decompress"
                    ? ".gz,application/gzip"
                    : undefined
                }
                aria-label={zh ? "选择 GZIP 文件" : "Choose GZIP file"}
                onChange={(event) =>
                  setGzipFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <ActionButton
              icon={Download}
              primary
              disabled={!gzipFile || busy}
              onClick={() => void runGzip()}
            >
              {busy
                ? zh
                  ? "处理中…"
                  : "Working…"
                : gzipAction === "compress"
                  ? zh
                    ? "压缩并下载"
                    : "Compress and download"
                  : zh
                    ? "解压并下载"
                    : "Extract and download"}
            </ActionButton>
          </div>
        )}
      </div>
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          {zh
            ? `本地处理 · 输入 ${formatBytes(inputLimit)} · 解压后 ${formatBytes(TOOL_LIMITS.maxExtractedSize)} · 500 个条目`
            : `Local only · ${formatBytes(inputLimit)} input · ${formatBytes(TOOL_LIMITS.maxExtractedSize)} extracted · 500 entries`}
        </span>
      </div>
    </section>
  );
}
