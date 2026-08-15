"use client";

import { useCallback, useState } from "react";
import {
  decodeHtmlEntities,
  encodeHtmlEntities,
  formatWebCode,
  minifyWebCode,
  type WebCodeLanguage,
} from "@/lib/tools/code-workbench";
import type { ToolComponentProps } from "@/lib/types";
import { TextWorkbench } from "./text-workbench";

type Operation = "format" | "minify" | "encode" | "decode";

const examples: Record<WebCodeLanguage, string> = {
  html: '<main class="app"><h1>Hello</h1><p>Local web tools</p></main>',
  css: ".app{display:grid;gap:1rem}.app h1{color:#2563eb;margin:0}",
  javascript: "const tools=['sql','git'];tools.forEach((tool)=>console.log(tool));",
};

export function WebCodeTool({ definition, locale, messages }: ToolComponentProps) {
  const implementation = definition?.implementation ?? definition?.slug ?? "html-formatter";
  const language: WebCodeLanguage = implementation.startsWith("css")
    ? "css"
    : implementation.startsWith("javascript")
      ? "javascript"
      : "html";
  const [operation, setOperation] = useState<Operation>("format");
  const zh = locale === "zh";
  const operations: Operation[] =
    language === "html"
      ? ["format", "minify", "encode", "decode"]
      : ["format", "minify"];
  const labels: Record<Operation, string> = {
    format: zh ? "格式化" : "Format",
    minify: zh ? "压缩" : "Minify",
    encode: zh ? "Entity 编码" : "Entity encode",
    decode: zh ? "Entity 解码" : "Entity decode",
  };
  const transform = useCallback(
    async (input: string) => {
      if (operation === "format") return formatWebCode(input, language);
      if (operation === "minify") return minifyWebCode(input, language);
      return operation === "encode"
        ? encodeHtmlEntities(input)
        : decodeHtmlEntities(input);
    },
    [language, operation],
  );
  const title =
    language === "html"
      ? zh
        ? "HTML 工作台"
        : "HTML workbench"
      : language === "css"
        ? zh
          ? "CSS 工作台"
          : "CSS workbench"
        : zh
          ? "JavaScript 工作台"
          : "JavaScript workbench";
  return (
    <TextWorkbench
      messages={messages}
      title={title}
      initialInput={examples[language]}
      actionLabel={labels[operation]}
      filename={`result.${language === "javascript" ? "js" : language}`}
      maxInputSize={definition?.maxInputSize}
      transform={transform}
      options={
        <label className="field inline compact-tool-option">
          <span className="sr-only">{zh ? "操作" : "Operation"}</span>
          <select
            aria-label={zh ? "操作" : "Operation"}
            value={operation}
            onChange={(event) => setOperation(event.target.value as Operation)}
          >
            {operations.map((item) => (
              <option value={item} key={item}>{labels[item]}</option>
            ))}
          </select>
        </label>
      }
    />
  );
}
