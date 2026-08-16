import { XMLBuilder } from "fast-xml-parser";
import Papa from "papaparse";
import { stringify as stringifyYaml } from "yaml";
import { parseJson, type JsonValue } from "./json";

export interface JsonTreeStats {
  nodes: number;
  objects: number;
  arrays: number;
  primitives: number;
  maxDepth: number;
}

export interface JsonTreeResult {
  value: JsonValue;
  stats: JsonTreeStats;
}

type XmlNode = Record<string, unknown>;

const invalidXmlCharacter =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ud800-\udfff\ufffe\uffff]/u;

function assertXmlText(value: string): void {
  if (invalidXmlCharacter.test(value)) {
    throw new Error("JSON contains characters that XML 1.0 cannot represent.");
  }
}

function xmlNode(value: JsonValue): XmlNode {
  if (value === null) return { "@_type": "null" };
  if (Array.isArray(value)) {
    return {
      "@_type": "array",
      ...(value.length ? { item: value.map(xmlNode) } : {}),
    };
  }
  if (typeof value === "object") {
    const properties = Object.entries(value).map(([name, child]) => {
      assertXmlText(name);
      return { "@_name": name, ...xmlNode(child) };
    });
    return {
      "@_type": "object",
      ...(properties.length ? { property: properties } : {}),
    };
  }
  if (typeof value === "string") assertXmlText(value);
  return { "@_type": typeof value, "#text": String(value) };
}

export function jsonToYaml(input: string): string {
  return stringifyYaml(parseJson(input), {
    indent: 2,
    lineWidth: 0,
  });
}

export function jsonToXml(input: string): string {
  const builder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    indentBy: "  ",
    suppressEmptyNode: false,
  });
  const xml = builder.build({ json: xmlNode(parseJson(input)) });
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

function csvCell(value: JsonValue): string | number | boolean {
  if (value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function jsonToCsv(input: string): string {
  const value = parseJson(input);
  let fields: string[];
  let data: Array<Array<string | number | boolean>>;

  if (Array.isArray(value) && value.length > 0 && value.every(isJsonObject)) {
    fields = [...new Set(value.flatMap((row) => Object.keys(row)))];
    data = value.map((row) =>
      fields.map((field) => csvCell(row[field] ?? null)),
    );
  } else if (isJsonObject(value) && Object.keys(value).length > 0) {
    fields = Object.keys(value);
    data = [fields.map((field) => csvCell(value[field]))];
  } else if (Array.isArray(value)) {
    fields = ["value"];
    data = value.map((entry) => [csvCell(entry)]);
  } else {
    fields = ["value"];
    data = [[csvCell(value)]];
  }

  return Papa.unparse(
    { fields, data },
    {
      escapeFormulae: true,
      newline: "\n",
    },
  );
}

export function createJsonTree(input: string): JsonTreeResult {
  const value = parseJson(input);
  const stats: JsonTreeStats = {
    nodes: 0,
    objects: 0,
    arrays: 0,
    primitives: 0,
    maxDepth: 0,
  };
  const stack: Array<{ value: JsonValue; depth: number }> = [
    { value, depth: 0 },
  ];
  while (stack.length) {
    const current = stack.pop()!;
    stats.nodes += 1;
    stats.maxDepth = Math.max(stats.maxDepth, current.depth);
    if (Array.isArray(current.value)) {
      stats.arrays += 1;
      for (const child of current.value) {
        stack.push({ value: child, depth: current.depth + 1 });
      }
    } else if (current.value !== null && typeof current.value === "object") {
      stats.objects += 1;
      for (const child of Object.values(current.value)) {
        stack.push({ value: child, depth: current.depth + 1 });
      }
    } else {
      stats.primitives += 1;
    }
  }
  return { value, stats };
}
