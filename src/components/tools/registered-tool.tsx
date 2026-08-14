"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Locale, Messages } from "@/i18n";
import type { ToolComponentProps, ToolDefinition } from "@/lib/types";

const toolComponents: Record<string, ComponentType<ToolComponentProps>> = {
  "json-formatter": dynamic(() =>
    import("./json-tools").then((module) => module.JsonFormatterTool),
  ),
  "json-validator": dynamic(() =>
    import("./json-tools").then((module) => module.JsonValidatorTool),
  ),
  "json-minifier": dynamic(() =>
    import("./json-tools").then((module) => module.JsonMinifierTool),
  ),
  base64: dynamic(() =>
    import("./encoding-tools").then((module) => module.Base64Tool),
  ),
  "url-encoder": dynamic(() =>
    import("./encoding-tools").then((module) => module.UrlEncoderTool),
  ),
  "url-decoder": dynamic(() =>
    import("./encoding-tools").then((module) => module.UrlDecoderTool),
  ),
  "timestamp-converter": dynamic(() =>
    import("./timestamp-tool").then((module) => module.TimestampTool),
  ),
  "uuid-generator": dynamic(() =>
    import("./uuid-tool").then((module) => module.UuidTool),
  ),
  "hash-generator": dynamic(() =>
    import("./hash-tool").then((module) => module.HashTool),
  ),
  "text-counter": dynamic(() =>
    import("./text-tools").then((module) => module.TextCounterTool),
  ),
  "case-converter": dynamic(() =>
    import("./text-tools").then((module) => module.CaseConverterTool),
  ),
  "text-diff": dynamic(() =>
    import("./diff-tool").then((module) => module.DiffTool),
  ),
  "regex-tester": dynamic(() =>
    import("./regex-tool").then((module) => module.RegexTool),
  ),
  "number-base-converter": dynamic(() =>
    import("./number-tool").then((module) => module.NumberBaseTool),
  ),
  "color-converter": dynamic(() =>
    import("./color-tool").then((module) => module.ColorTool),
  ),
  "qr-code-generator": dynamic(() =>
    import("./qr-tool").then((module) => module.QrCodeTool),
  ),
  "curl-parser": dynamic(() =>
    import("./curl-tools").then((module) => module.CurlParserTool),
  ),
  "curl-generator": dynamic(() =>
    import("./curl-tools").then((module) => module.CurlGeneratorTool),
  ),
  "jwt-decoder": dynamic(() =>
    import("./jwt-tool").then((module) => module.JwtTool),
  ),
  "cron-generator": dynamic(() =>
    import("./cron-tool").then((module) => module.CronTool),
  ),
  "html-formatter": dynamic(() =>
    import("./text-tools").then((module) => module.HtmlFormatterTool),
  ),
};
export function RegisteredTool({
  definition,
  locale,
  messages,
}: {
  definition: ToolDefinition;
  locale: Locale;
  messages: Messages;
}) {
  const ToolComponent = toolComponents[definition.slug];
  if (!ToolComponent)
    return (
      <div className="empty-state card">
        <h3>{messages.toolPage.unavailable}</h3>
        <p>{messages.toolPage.unavailableText}</p>
      </div>
    );
  return (
    <ToolComponent
      definition={definition}
      locale={locale}
      messages={messages}
    />
  );
}
