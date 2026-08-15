import { minify as minifyCss } from "csso";
import { format as formatPrettier } from "prettier/standalone";
import * as babelPlugin from "prettier/plugins/babel";
import * as estreePlugin from "prettier/plugins/estree";
import * as htmlPlugin from "prettier/plugins/html";
import * as postcssPlugin from "prettier/plugins/postcss";
import { format as formatSql } from "sql-formatter";
import { minify as minifyJavaScript } from "terser";

export type WebCodeLanguage = "html" | "css" | "javascript";
export type SqlDialect =
  | "sql"
  | "postgresql"
  | "mysql"
  | "sqlite"
  | "transactsql";

const parsers = {
  html: { parser: "html", plugins: [htmlPlugin] },
  css: { parser: "css", plugins: [postcssPlugin] },
  javascript: {
    parser: "babel",
    plugins: [babelPlugin, estreePlugin],
  },
} as const;

function requireInput(input: string): string {
  if (!input.trim()) throw new Error("Input is empty.");
  return input;
}

function minifyHtmlDocument(input: string): string {
  const documentValue = new DOMParser().parseFromString(input, "text/html");
  const commentWalker = documentValue.createTreeWalker(
    documentValue,
    NodeFilter.SHOW_COMMENT,
  );
  const comments: Comment[] = [];
  for (let node = commentWalker.nextNode(); node; node = commentWalker.nextNode()) {
    comments.push(node as Comment);
  }
  comments.forEach((comment) => comment.remove());
  documentValue.normalize();
  const textWalker = documentValue.createTreeWalker(
    documentValue,
    NodeFilter.SHOW_TEXT,
  );
  for (let node = textWalker.nextNode(); node; node = textWalker.nextNode()) {
    const parent = node.parentElement?.tagName.toLowerCase();
    if (!parent || ["pre", "textarea", "script", "style"].includes(parent)) continue;
    node.textContent = node.textContent?.replace(/\s+/g, " ") ?? "";
  }
  const completeDocument = /<!doctype|<html[\s>]/i.test(input);
  return completeDocument
    ? `<!DOCTYPE html><html>${documentValue.documentElement.innerHTML}</html>`
    : documentValue.body.innerHTML.trim();
}

export async function formatWebCode(
  input: string,
  language: WebCodeLanguage,
): Promise<string> {
  const options = parsers[language];
  return formatPrettier(requireInput(input), {
    parser: options.parser,
    plugins: [...options.plugins],
    printWidth: 88,
    tabWidth: 2,
  });
}

export async function minifyWebCode(
  input: string,
  language: WebCodeLanguage,
): Promise<string> {
  const value = requireInput(input);
  if (language === "html") return minifyHtmlDocument(value);
  if (language === "css") return minifyCss(value).css;
  const result = await minifyJavaScript(value, {
    compress: true,
    mangle: true,
    format: { comments: false },
  });
  if (!result.code) throw new Error("JavaScript produced no output.");
  return result.code;
}

export function encodeHtmlEntities(input: string): string {
  return input.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export function decodeHtmlEntities(input: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: "\u00a0",
  };
  return input.replace(
    /&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi,
    (entity, value: string) => {
      if (value.startsWith("#")) {
        const hexadecimal = value[1]?.toLowerCase() === "x";
        const codePoint = Number.parseInt(value.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
        return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }
      return named[value.toLowerCase()] ?? entity;
    },
  );
}

export function formatSqlQuery(
  input: string,
  dialect: SqlDialect,
  keywordCase: "upper" | "lower" | "preserve" = "upper",
): string {
  try {
    return formatSql(requireInput(input), {
      language: dialect,
      keywordCase,
      tabWidth: 2,
      linesBetweenQueries: 1,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message.split("\n", 1)[0] : "Parsing failed.";
    throw new Error(`Invalid SQL: ${detail}`);
  }
}
