import type { HashAlgorithm, RegexResult } from "@/lib/tools/security";
import type { DecodedJwt } from "@/lib/tools/encoding";
import type { CaseMode, TextMetrics } from "@/lib/tools/text";
import type { SqlDialect, WebCodeLanguage } from "@/lib/tools/code-workbench";
import type { DiffLine } from "@/lib/tools/diff";
import type { LocalFileEntry } from "@/lib/tools/archive";
import type { FileHashAlgorithm } from "@/lib/tools/file";
import type { GenerateSshKeyOptions, GeneratedSshKey } from "@/lib/tools/ssh";
import type { JsonTreeResult } from "@/lib/tools/json-conversion";
import type {
  AsciiCodeBase,
  DecodedBase64File,
  Utf8Inspection,
} from "@/lib/tools/encoding-data";
import type { ToolLimitErrorCode } from "@/lib/tool-limits";

export type ToolWorkerRequest =
  | { operation: "json-format"; input: string; indent: number }
  | { operation: "json-minify"; input: string }
  | { operation: "json-validate"; input: string }
  | { operation: "json-to-yaml"; input: string }
  | { operation: "json-to-xml"; input: string }
  | { operation: "json-to-csv"; input: string }
  | { operation: "json-tree"; input: string }
  | { operation: "base64-encode"; input: string }
  | { operation: "base64-decode"; input: string }
  | { operation: "base64-auto"; input: string }
  | {
      operation: "file-base64-encode";
      data: Uint8Array;
      mimeType: string;
      dataUrl: boolean;
    }
  | { operation: "file-base64-decode"; input: string }
  | { operation: "url-encode"; input: string }
  | { operation: "url-decode"; input: string }
  | { operation: "url-parse"; input: string }
  | { operation: "query-parse"; input: string }
  | { operation: "unicode-encode"; input: string }
  | { operation: "unicode-decode"; input: string }
  | { operation: "ascii-encode"; input: string; base: AsciiCodeBase }
  | { operation: "ascii-decode"; input: string }
  | { operation: "utf8-inspect"; input: string }
  | { operation: "hash"; input: string; algorithm: HashAlgorithm }
  | { operation: "case-convert"; input: string; mode: CaseMode }
  | { operation: "text-count"; input: string }
  | { operation: "jwt-decode"; input: string }
  | {
      operation: "web-code";
      input: string;
      language: WebCodeLanguage;
      action: "format" | "minify";
    }
  | {
      operation: "sql-format";
      input: string;
      dialect: SqlDialect;
      keywordCase: "upper" | "lower" | "preserve";
    }
  | { operation: "regex-test"; pattern: string; flags: string; input: string }
  | {
      operation: "diff";
      before: string;
      after: string;
      mode: "lines" | "characters";
      ignoreWhitespace: boolean;
    }
  | {
      operation: "number-base";
      input: string;
      from: number;
      to: number;
      targets: number[];
    }
  | {
      operation: "archive-extract";
      data: Uint8Array;
      format: "zip" | "tar" | "tar-gzip" | "gzip";
      filename: string;
    }
  | { operation: "archive-create-zip"; files: LocalFileEntry[] }
  | {
      operation: "archive-gzip";
      data: Uint8Array;
      action: "compress" | "decompress";
    }
  | { operation: "file-hash"; data: Uint8Array; algorithm: FileHashAlgorithm }
  | { operation: "ssh-key"; options: GenerateSshKeyOptions };

export interface DiffWorkerResult {
  model: { left: DiffLine[]; right: DiffLine[] };
  text: string;
}

export interface NumberBaseWorkerResult {
  value: string;
  conversions: Array<{ base: number; value: string }>;
}

export type ToolWorkerResult =
  | string
  | TextMetrics
  | DecodedJwt
  | RegexResult
  | DiffWorkerResult
  | NumberBaseWorkerResult
  | LocalFileEntry[]
  | Uint8Array
  | GeneratedSshKey
  | JsonTreeResult
  | DecodedBase64File
  | Utf8Inspection;

export interface ToolWorkerEnvelope {
  request: ToolWorkerRequest;
  maxOutputSize: number;
}

export type ToolWorkerReply =
  | { ok: true; result: ToolWorkerResult }
  | {
      ok: false;
      error: { name: string; message: string; code?: ToolLimitErrorCode };
    };

export function collectTransferables(value: unknown): Transferable[] {
  const buffers = new Set<ArrayBuffer>();
  const seen = new Set<object>();
  const visit = (entry: unknown): void => {
    if (!entry || typeof entry !== "object" || seen.has(entry)) return;
    seen.add(entry);
    if (entry instanceof ArrayBuffer) {
      buffers.add(entry);
      return;
    }
    if (ArrayBuffer.isView(entry)) {
      if (entry.buffer instanceof ArrayBuffer) buffers.add(entry.buffer);
      return;
    }
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    Object.values(entry).forEach(visit);
  };
  visit(value);
  return [...buffers];
}
