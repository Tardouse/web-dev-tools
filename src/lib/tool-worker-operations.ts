import {
  createGzipArchive,
  createZipArchive,
  extractGzipArchive,
  extractTarArchive,
  extractZipArchive,
  type LocalFileEntry,
} from "@/lib/tools/archive";
import {
  formatSqlQuery,
  formatWebCode,
  minifyWebCode,
} from "@/lib/tools/code-workbench";
import {
  decodeBase64,
  decodeJwt,
  decodeUrl,
  encodeBase64,
  encodeUrl,
} from "@/lib/tools/encoding";
import {
  compareText,
  createSideBySideDiff,
  prepareDiffInputs,
  toUnifiedLikeDiff,
} from "@/lib/tools/diff";
import { formatJson, minifyJson, validateJson } from "@/lib/tools/json";
import {
  createJsonTree,
  jsonToCsv,
  jsonToXml,
  jsonToYaml,
} from "@/lib/tools/json-conversion";
import {
  decodeAscii,
  decodeFileBase64,
  decodeUnicodeEscapes,
  encodeAscii,
  encodeFileBase64,
  encodeUnicodeEscapes,
  inspectUtf8,
  parseQueryString,
  parseUrl,
  transformBase64,
} from "@/lib/tools/encoding-data";
import { convertBase } from "@/lib/tools/number-color";
import { hashText, testRegex } from "@/lib/tools/security";
import { hashFileBytes } from "@/lib/tools/file";
import { generateSshKey } from "@/lib/tools/ssh";
import { convertCase, countText } from "@/lib/tools/text";
import {
  cleanLines,
  convertDataSize,
  deduplicateText,
  mergeText,
  sortLines,
  splitText,
  transformLineNumbers,
} from "@/lib/tools/text-processing";
import type {
  DiffWorkerResult,
  NumberBaseWorkerResult,
  ToolWorkerRequest,
  ToolWorkerResult,
} from "@/lib/tool-worker-protocol";

export async function executeToolWorkerRequest(
  request: ToolWorkerRequest,
): Promise<ToolWorkerResult> {
  switch (request.operation) {
    case "json-format":
      return formatJson(request.input, request.indent);
    case "json-minify":
      return minifyJson(request.input);
    case "json-validate":
      return validateJson(request.input);
    case "json-to-yaml":
      return jsonToYaml(request.input);
    case "json-to-xml":
      return jsonToXml(request.input);
    case "json-to-csv":
      return jsonToCsv(request.input);
    case "json-tree":
      return createJsonTree(request.input);
    case "base64-encode":
      return encodeBase64(request.input);
    case "base64-decode":
      return decodeBase64(request.input);
    case "base64-auto":
      return transformBase64(request.input, "auto");
    case "file-base64-encode":
      return encodeFileBase64(request.data, request.mimeType, request.dataUrl);
    case "file-base64-decode":
      return decodeFileBase64(request.input);
    case "url-encode":
      return encodeUrl(request.input);
    case "url-decode":
      return decodeUrl(request.input);
    case "url-parse":
      return parseUrl(request.input);
    case "query-parse":
      return parseQueryString(request.input);
    case "unicode-encode":
      return encodeUnicodeEscapes(request.input);
    case "unicode-decode":
      return decodeUnicodeEscapes(request.input);
    case "ascii-encode":
      return encodeAscii(request.input, request.base);
    case "ascii-decode":
      return decodeAscii(request.input);
    case "utf8-inspect":
      return inspectUtf8(request.input);
    case "hash":
      return hashText(request.input, request.algorithm);
    case "case-convert":
      return convertCase(request.input, request.mode);
    case "text-count":
      return countText(request.input);
    case "data-size-convert":
      return convertDataSize(request.input, request.unit);
    case "line-clean":
      return cleanLines(request.input, request.options);
    case "line-sort":
      return sortLines(request.input, request.options);
    case "line-number":
      return transformLineNumbers(request.input, request.options);
    case "text-deduplicate":
      return deduplicateText(request.input, request.options);
    case "text-merge":
      return mergeText(request.first, request.second, request.options);
    case "text-split":
      return splitText(request.input, request.options);
    case "jwt-decode":
      return decodeJwt(request.input);
    case "web-code":
      if (request.action === "format") {
        return formatWebCode(request.input, request.language);
      }
      if (request.language === "html") {
        throw new Error("HTML minification requires a document context.");
      }
      return minifyWebCode(request.input, request.language);
    case "sql-format":
      return formatSqlQuery(
        request.input,
        request.dialect,
        request.keywordCase,
      );
    case "regex-test":
      return testRegex(
        request.pattern,
        request.flags,
        request.input,
        request.replacement,
      );
    case "diff": {
      const prepared = prepareDiffInputs(
        request.before,
        request.after,
        request.mode,
      );
      const parts = compareText(
        prepared.before,
        prepared.after,
        request.mode === "json" ? "lines" : request.mode,
        request.ignoreWhitespace,
        request.ignoreCase ?? false,
      );
      const result: DiffWorkerResult = {
        model: createSideBySideDiff(
          prepared.before,
          prepared.after,
          request.ignoreWhitespace,
          request.ignoreCase ?? false,
        ),
        text: toUnifiedLikeDiff(parts),
        displayBefore: prepared.before,
        displayAfter: prepared.after,
      };
      return result;
    }
    case "number-base":
      return {
        value: convertBase(request.input, request.from, request.to),
        conversions: request.targets.map((base) => ({
          base,
          value: convertBase(request.input, request.from, base),
        })),
      } satisfies NumberBaseWorkerResult;
    case "archive-extract": {
      if (request.format === "zip") return extractZipArchive(request.data);
      if (request.format === "tar") return extractTarArchive(request.data);
      if (request.format === "tar-gzip") {
        return extractTarArchive(extractGzipArchive(request.data));
      }
      const entry: LocalFileEntry = {
        name: request.filename.replace(/\.gz$/i, "") || "decompressed-file",
        data: extractGzipArchive(request.data),
      };
      return [entry];
    }
    case "archive-create-zip":
      return createZipArchive(request.files);
    case "archive-gzip":
      return request.action === "compress"
        ? createGzipArchive(request.data)
        : extractGzipArchive(request.data);
    case "file-hash":
      return hashFileBytes(request.data, request.algorithm);
    case "ssh-key":
      return generateSshKey(request.options);
  }
}
