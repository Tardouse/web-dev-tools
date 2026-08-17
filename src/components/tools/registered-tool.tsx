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
  "json-to-yaml": dynamic(() =>
    import("./json-data-tools").then((module) => module.JsonToYamlTool),
  ),
  "json-to-xml": dynamic(() =>
    import("./json-data-tools").then((module) => module.JsonToXmlTool),
  ),
  "json-to-csv": dynamic(() =>
    import("./json-data-tools").then((module) => module.JsonToCsvTool),
  ),
  "json-tree-viewer": dynamic(() =>
    import("./json-data-tools").then((module) => module.JsonTreeViewerTool),
  ),
  base64: dynamic(() =>
    import("./encoding-tools").then((module) => module.Base64Tool),
  ),
  "file-base64": dynamic(() =>
    import("./encoding-data-tools").then((module) => module.FileBase64Tool),
  ),
  "url-encoder": dynamic(() =>
    import("./encoding-tools").then((module) => module.UrlEncoderTool),
  ),
  "url-decoder": dynamic(() =>
    import("./encoding-tools").then((module) => module.UrlDecoderTool),
  ),
  "url-parser": dynamic(() =>
    import("./encoding-tools").then((module) => module.UrlParserTool),
  ),
  "query-string-parser": dynamic(() =>
    import("./encoding-tools").then((module) => module.QueryStringParserTool),
  ),
  "query-string-generator": dynamic(() =>
    import("./encoding-data-tools").then(
      (module) => module.QueryStringGeneratorTool,
    ),
  ),
  "unicode-converter": dynamic(() =>
    import("./encoding-tools").then((module) => module.UnicodeConverterTool),
  ),
  "ascii-converter": dynamic(() =>
    import("./encoding-tools").then((module) => module.AsciiConverterTool),
  ),
  "ascii-table": dynamic(() =>
    import("./encoding-data-tools").then((module) => module.AsciiTableTool),
  ),
  "utf8-inspector": dynamic(() =>
    import("./encoding-data-tools").then((module) => module.Utf8InspectorTool),
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
  "line-cleaner": dynamic(() =>
    import("./text-processing-tools").then((module) => module.LineCleanerTool),
  ),
  "line-sorter": dynamic(() =>
    import("./text-processing-tools").then((module) => module.LineSorterTool),
  ),
  "line-numberer": dynamic(() =>
    import("./text-processing-tools").then((module) => module.LineNumbererTool),
  ),
  "text-deduplicator": dynamic(() =>
    import("./text-processing-tools").then(
      (module) => module.TextDeduplicatorTool,
    ),
  ),
  "text-merger": dynamic(() =>
    import("./text-processing-tools").then((module) => module.TextMergerTool),
  ),
  "text-splitter": dynamic(() =>
    import("./text-processing-tools").then((module) => module.TextSplitterTool),
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
  "data-size-converter": dynamic(() =>
    import("./text-processing-tools").then(
      (module) => module.DataSizeConverterTool,
    ),
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
    import("./web-code-tool").then((module) => module.WebCodeTool),
  ),
  "image-workbench": dynamic(() =>
    import("./image-tool").then((module) => module.ImageWorkbenchTool),
  ),
  "archive-workbench": dynamic(() =>
    import("./archive-tool").then((module) => module.ArchiveWorkbenchTool),
  ),
  "file-inspector": dynamic(() =>
    import("./file-inspector-tool").then((module) => module.FileInspectorTool),
  ),
  "ssh-key-generator": dynamic(() =>
    import("./ssh-tool").then((module) => module.SshKeyGeneratorTool),
  ),
  "mime-type-lookup": dynamic(() =>
    import("./reference-tools").then((module) => module.MimeTypeLookupTool),
  ),
  "http-status-reference": dynamic(() =>
    import("./reference-tools").then(
      (module) => module.HttpStatusReferenceTool,
    ),
  ),
  "sql-formatter": dynamic(() =>
    import("./sql-tool").then((module) => module.SqlFormatterTool),
  ),
  "css-formatter": dynamic(() =>
    import("./web-code-tool").then((module) => module.WebCodeTool),
  ),
  "javascript-formatter": dynamic(() =>
    import("./web-code-tool").then((module) => module.WebCodeTool),
  ),
  "git-command-builder": dynamic(() =>
    import("./git-tool").then((module) => module.GitCommandBuilderTool),
  ),
  "network-calculator": dynamic(() =>
    import("./network-tool").then((module) => module.NetworkCalculatorTool),
  ),
  "api-request-builder": dynamic(() =>
    import("./api-tool").then((module) => module.ApiRequestBuilderTool),
  ),
  "http-header-builder": dynamic(() =>
    import("./header-builder-tool").then(
      (module) => module.HttpHeaderBuilderTool,
    ),
  ),
  "webhook-tester": dynamic(() =>
    import("./webhook-tool").then((module) => module.WebhookTesterTool),
  ),
  "random-string-generator": dynamic(() =>
    import("./random-generator-tool").then(
      (module) => module.RandomGeneratorTool,
    ),
  ),
  "password-generator": dynamic(() =>
    import("./random-generator-tool").then(
      (module) => module.RandomGeneratorTool,
    ),
  ),
  "username-generator": dynamic(() =>
    import("./random-generator-tool").then(
      (module) => module.RandomGeneratorTool,
    ),
  ),
  "lorem-ipsum-generator": dynamic(() =>
    import("./random-generator-tool").then(
      (module) => module.RandomGeneratorTool,
    ),
  ),
  "fake-json-generator": dynamic(() =>
    import("./random-generator-tool").then(
      (module) => module.RandomGeneratorTool,
    ),
  ),
  "mock-data-generator": dynamic(() =>
    import("./random-generator-tool").then(
      (module) => module.RandomGeneratorTool,
    ),
  ),
  "random-number-generator": dynamic(() =>
    import("./random-generator-tool").then(
      (module) => module.RandomGeneratorTool,
    ),
  ),
  "random-date-generator": dynamic(() =>
    import("./random-generator-tool").then(
      (module) => module.RandomGeneratorTool,
    ),
  ),
  "random-color-generator": dynamic(() =>
    import("./random-generator-tool").then(
      (module) => module.RandomGeneratorTool,
    ),
  ),
  "linux-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "git-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "docker-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "nginx-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "vim-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "regex-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "bash-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "sql-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "javascript-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "python-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "http-status-code-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
  ),
  "css-cheatsheet": dynamic(() =>
    import("./cheatsheet-tool").then(
      (module) => module.DeveloperCheatsheetTool,
    ),
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
  const ToolComponent =
    toolComponents[definition.implementation ?? definition.slug];
  if (!ToolComponent)
    return (
      <div className="empty-state card">
        <h3>{messages.toolPage.unavailable}</h3>
        <p>{messages.toolPage.unavailableText}</p>
      </div>
    );
  return (
    <ToolComponent
      key={definition.slug}
      definition={definition}
      locale={locale}
      messages={messages}
    />
  );
}
