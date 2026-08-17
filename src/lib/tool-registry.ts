import type { Locale } from "@/i18n";
import { localizeCategory, localizeTool } from "@/i18n/tool-metadata";
import type { ToolCategory, ToolDefinition } from "@/lib/types";
import { TOOL_LIMITS } from "@/lib/config";

export const categories: ToolCategory[] = [
  {
    id: "json-data",
    name: "JSON & Data",
    description: "Format, validate, and transform structured data",
    icon: "Braces",
    color: "#2563eb",
  },
  {
    id: "encoding",
    name: "Encoding & URLs",
    description: "Encode and decode text and web values",
    icon: "Binary",
    color: "#7c3aed",
  },
  {
    id: "text",
    name: "Text Utilities",
    description: "Count, compare, and reshape text",
    icon: "TextCursorInput",
    color: "#0891b2",
  },
  {
    id: "regex",
    name: "Regex & Testing",
    description: "Test expressions and inspect matches",
    icon: "Regex",
    color: "#c2410c",
  },
  {
    id: "time-number",
    name: "Time & Numbers",
    description: "Convert timestamps, bases, and schedules",
    icon: "Clock3",
    color: "#0f766e",
  },
  {
    id: "crypto",
    name: "Hash & Identity",
    description: "Generate digests, UUIDs, and decode tokens",
    icon: "ShieldCheck",
    color: "#b45309",
  },
  {
    id: "files",
    name: "Files & Images",
    description: "Inspect, transform, and archive local files",
    icon: "Files",
    color: "#047857",
  },
  {
    id: "web",
    name: "Web Development",
    description: "Build requests, colors, QR codes, and markup",
    icon: "Code2",
    color: "#be123c",
  },
];

const shared = {
  requiresLogin: false,
  processingMode: "client" as const,
  enabled: true,
  maxOutputSize: TOOL_LIMITS.maxOutput,
  maxExecutionTime: TOOL_LIMITS.maxExecutionTime,
  maxConcurrency: TOOL_LIMITS.maxConcurrentExecutions,
};

export const tools: ToolDefinition[] = [
  {
    ...shared,
    id: "json-formatter",
    slug: "json-formatter",
    name: "JSON Formatter",
    shortName: "JSON Format",
    category: "json-data",
    icon: "Braces",
    featured: true,
    sortOrder: 10,
    description:
      "Format and beautify JSON with configurable indentation and clear syntax errors.",
    keywords: ["json", "beautify", "pretty print", "format", "data"],
    maxInputSize: TOOL_LIMITS.json,
    seoTitle: "JSON Formatter Online — Format & Beautify JSON",
    seoDescription:
      "Format JSON instantly in your browser with validation, indentation controls, and no uploads.",
    related: ["json-validator", "json-minifier", "text-diff"],
    faq: [
      {
        question: "Is my JSON uploaded?",
        answer:
          "No. Formatting happens entirely in your browser, so your input never leaves your device.",
      },
      {
        question: "How large can the input be?",
        answer:
          "The default JSON input limit is 5 MB, with a nesting depth guard to keep your browser responsive.",
      },
    ],
  },
  {
    ...shared,
    id: "json-validator",
    slug: "json-validator",
    name: "JSON Validator",
    shortName: "JSON Validate",
    category: "json-data",
    icon: "BadgeCheck",
    featured: true,
    sortOrder: 20,
    description:
      "Check JSON syntax and get a precise error when a document is invalid.",
    keywords: ["json", "validate", "syntax", "lint"],
    maxInputSize: TOOL_LIMITS.json,
    seoTitle: "JSON Validator Online — Check JSON Syntax",
    seoDescription:
      "Validate JSON locally and identify syntax errors without sending data to a server.",
    related: ["json-formatter", "json-minifier", "text-diff"],
    faq: [
      {
        question: "What does validation check?",
        answer:
          "The validator checks JSON syntax, input size, and excessive nesting depth.",
      },
    ],
  },
  {
    ...shared,
    id: "json-minifier",
    slug: "json-minifier",
    name: "JSON Minifier",
    shortName: "JSON Minify",
    category: "json-data",
    icon: "Minimize2",
    sortOrder: 30,
    description:
      "Remove whitespace from valid JSON for smaller payloads and fixtures.",
    keywords: ["json", "minify", "compress", "compact"],
    maxInputSize: TOOL_LIMITS.json,
    seoTitle: "JSON Minifier Online — Compact JSON",
    seoDescription:
      "Minify valid JSON securely in your browser and download the result.",
    related: ["json-formatter", "json-validator", "text-counter"],
    faq: [
      {
        question: "Does minifying change values?",
        answer:
          "No. It removes insignificant whitespace while preserving the parsed JSON data.",
      },
    ],
  },
  {
    ...shared,
    id: "json-to-yaml",
    slug: "json-to-yaml",
    name: "JSON to YAML Converter",
    shortName: "JSON to YAML",
    category: "json-data",
    icon: "FileJson2",
    sortOrder: 31,
    description:
      "Convert JSON objects and arrays to readable YAML while preserving scalar types.",
    keywords: ["json", "yaml", "convert", "serialize", "configuration"],
    aliases: ["json yaml converter", "json2yaml"],
    maxInputSize: TOOL_LIMITS.json,
    seoTitle: "JSON to YAML Converter Online",
    seoDescription:
      "Convert JSON to readable YAML locally in your browser with type preservation and strict input limits.",
    related: ["json-formatter", "json-to-xml", "json-tree-viewer"],
    faq: [
      {
        question: "Are strings, booleans, and numbers preserved?",
        answer:
          "Yes. The converter parses JSON first and serializes the resulting values with YAML's corresponding scalar types.",
      },
      {
        question: "Is conversion performed on the server?",
        answer:
          "No. Conversion runs inside a time-limited Web Worker in your browser.",
      },
    ],
  },
  {
    ...shared,
    id: "json-to-xml",
    slug: "json-to-xml",
    name: "JSON to XML Converter",
    shortName: "JSON to XML",
    category: "json-data",
    icon: "FileCode2",
    sortOrder: 32,
    description:
      "Convert JSON to valid XML with explicit value types and lossless property names.",
    keywords: ["json", "xml", "convert", "serialize", "data"],
    aliases: ["json xml converter", "json2xml"],
    maxInputSize: TOOL_LIMITS.json,
    seoTitle: "JSON to XML Converter Online",
    seoDescription:
      "Convert JSON to escaped, typed XML locally while preserving arrays, null values, and arbitrary property names.",
    related: ["json-to-yaml", "json-to-csv", "json-tree-viewer"],
    faq: [
      {
        question: "How are JSON property names represented?",
        answer:
          "Each property becomes a property element with a name attribute, so spaces and other keys remain lossless and valid XML.",
      },
      {
        question: "How are arrays and null values represented?",
        answer:
          "Arrays use repeated item elements, while every value includes an explicit type attribute, including null.",
      },
    ],
  },
  {
    ...shared,
    id: "json-to-csv",
    slug: "json-to-csv",
    name: "JSON to CSV Converter",
    shortName: "JSON to CSV",
    category: "json-data",
    icon: "Table2",
    sortOrder: 33,
    description:
      "Convert JSON arrays or objects to RFC-style CSV with safe spreadsheet values.",
    keywords: ["json", "csv", "spreadsheet", "table", "convert"],
    aliases: ["json csv converter", "json2csv"],
    maxInputSize: TOOL_LIMITS.json,
    seoTitle: "JSON to CSV Converter Online",
    seoDescription:
      "Convert JSON rows to CSV locally with union headers, nested value preservation, and formula injection protection.",
    related: ["json-to-yaml", "json-to-xml", "fake-json-generator"],
    faq: [
      {
        question: "What JSON shape works best?",
        answer:
          "An array of objects creates one row per object. A single object creates one row, and scalar arrays use a value column.",
      },
      {
        question: "What happens to nested objects and arrays?",
        answer:
          "Nested values are preserved as JSON text inside a CSV cell, and spreadsheet formula prefixes are escaped.",
      },
    ],
  },
  {
    ...shared,
    id: "json-tree-viewer",
    slug: "json-tree-viewer",
    name: "JSON Tree Viewer",
    shortName: "JSON Tree",
    category: "json-data",
    icon: "ListTree",
    sortOrder: 34,
    description:
      "Explore JSON as an expandable tree with types, counts, depth statistics, and copyable JSONPath values.",
    keywords: ["json", "tree", "viewer", "inspect", "jsonpath", "structure"],
    aliases: ["json explorer", "json inspector"],
    maxInputSize: TOOL_LIMITS.json,
    seoTitle: "JSON Tree Viewer Online — Explore JSON Structure",
    seoDescription:
      "Inspect JSON in an expandable local tree with value types, node statistics, paged children, and copyable JSONPath values.",
    related: ["json-formatter", "json-validator", "json-to-yaml"],
    faq: [
      {
        question: "Can the viewer handle large arrays?",
        answer:
          "Yes. Parsing is limited and runs in a Web Worker, while child nodes render in pages of 100 to keep the interface responsive.",
      },
      {
        question: "Can I copy a node path?",
        answer:
          "Yes. Every row has a copy action for its JSONPath, including quoted keys and array indexes.",
      },
    ],
  },
  {
    ...shared,
    id: "base64",
    slug: "base64",
    name: "Base64 Encoder / Decoder",
    shortName: "Base64",
    category: "encoding",
    icon: "Binary",
    featured: true,
    sortOrder: 40,
    description:
      "Encode UTF-8 text to Base64 or decode Base64 back to readable text.",
    keywords: ["base64", "encode", "decode", "utf8"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Base64 Encoder & Decoder Online",
    seoDescription:
      "Encode and decode UTF-8 Base64 text privately in your browser.",
    related: ["url-encoder", "url-decoder", "jwt-decoder"],
    faq: [
      {
        question: "Does this support Unicode?",
        answer:
          "Yes. Text is converted through UTF-8, so emoji and non-Latin scripts are supported.",
      },
    ],
  },
  {
    ...shared,
    id: "file-base64",
    slug: "file-base64",
    name: "File Base64 Converter",
    shortName: "File Base64",
    category: "encoding",
    icon: "FileDigit",
    sortOrder: 41,
    description:
      "Encode local files as raw Base64 or data URLs, and decode Base64 back into downloadable files.",
    keywords: ["base64", "file", "data url", "binary", "encode", "decode"],
    aliases: ["file to base64", "base64 to file"],
    maxInputSize: TOOL_LIMITS.maxBase64Output,
    maxOutputSize: TOOL_LIMITS.maxBase64Output,
    seoTitle: "File to Base64 Converter Online — Encode or Decode Files",
    seoDescription:
      "Convert files to Base64 and decode Base64 data URLs locally with MIME detection, downloads, and strict file limits.",
    related: ["base64", "image-workbench", "file-inspector"],
    faq: [
      {
        question: "Is the selected file uploaded?",
        answer:
          "No. The browser reads the file locally and a time-limited Web Worker performs the Base64 conversion.",
      },
      {
        question: "What is the difference between raw Base64 and a data URL?",
        answer:
          "A data URL includes the MIME type and Base64 marker, while raw Base64 contains only the encoded bytes.",
      },
    ],
  },
  {
    ...shared,
    id: "url-encoder",
    slug: "url-encoder",
    name: "URL Encoder",
    shortName: "URL Encode",
    category: "encoding",
    icon: "Link2",
    featured: true,
    sortOrder: 50,
    description:
      "Percent-encode text safely for use in URL components and query parameters.",
    keywords: ["url", "uri", "percent", "encode", "query"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "URL Encoder Online — Percent Encode Text",
    seoDescription:
      "Encode URL components and query values instantly in your browser.",
    related: ["url-decoder", "base64", "curl-generator"],
    faq: [
      {
        question: "Does it encode an entire URL?",
        answer:
          "This tool uses component encoding, which is ideal for individual path or query values.",
      },
    ],
  },
  {
    ...shared,
    id: "url-decoder",
    slug: "url-decoder",
    name: "URL Decoder",
    shortName: "URL Decode",
    category: "encoding",
    icon: "Unlink2",
    sortOrder: 60,
    description:
      "Decode percent-encoded URL components and plus-separated query text.",
    keywords: ["url", "uri", "percent", "decode", "query"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "URL Decoder Online — Decode Percent Encoding",
    seoDescription:
      "Decode URL-encoded text locally with clear malformed-sequence errors.",
    related: ["url-encoder", "base64", "curl-parser"],
    faq: [
      {
        question: "Are plus signs treated as spaces?",
        answer:
          "Yes, matching common application/x-www-form-urlencoded query values.",
      },
    ],
  },
  {
    ...shared,
    id: "url-parser",
    slug: "url-parser",
    name: "URL Parser",
    shortName: "URL Parser",
    category: "encoding",
    icon: "ScanText",
    sortOrder: 61,
    description:
      "Break an absolute URL into protocol, credentials, host, port, path, query values, and fragment.",
    keywords: ["url", "parse", "host", "path", "query", "fragment", "port"],
    aliases: ["url analyzer", "uri parser"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "URL Parser Online — Inspect URL Components",
    seoDescription:
      "Parse absolute URLs locally and inspect normalized protocol, host, path segments, repeated query values, and fragments.",
    related: ["url-encoder", "url-decoder", "network-calculator"],
    faq: [
      {
        question: "Are duplicate query parameters preserved?",
        answer:
          "Yes. Repeated parameter names are represented as arrays in the parsed JSON output.",
      },
      {
        question: "Does the parser make a network request?",
        answer:
          "No. It uses the browser URL parser locally and never connects to the entered host.",
      },
    ],
  },
  {
    ...shared,
    id: "query-string-parser",
    slug: "query-string-parser",
    name: "Query String Parser",
    shortName: "Query Parser",
    category: "encoding",
    icon: "ListFilter",
    sortOrder: 62,
    description:
      "Parse a query string or complete URL into decoded JSON while preserving repeated keys and empty values.",
    keywords: [
      "query string",
      "url params",
      "parse",
      "search params",
      "decode",
    ],
    aliases: ["query parameter parser", "url params parser"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Query String Parser Online — URL Parameters to JSON",
    seoDescription:
      "Parse URL query parameters into readable JSON locally, including repeated keys, plus spaces, and blank values.",
    related: ["query-string-generator", "url-parser", "url-decoder"],
    faq: [
      {
        question: "Can I paste a complete URL?",
        answer:
          "Yes. The parser accepts either an absolute URL or a query string beginning with an optional question mark.",
      },
      {
        question: "How are repeated parameter names handled?",
        answer:
          "The first value remains a string and repeated values are returned together as an ordered array.",
      },
    ],
  },
  {
    ...shared,
    id: "query-string-generator",
    slug: "query-string-generator",
    name: "Query String Generator",
    shortName: "Query Generator",
    category: "encoding",
    icon: "ListPlus",
    sortOrder: 63,
    description:
      "Build an encoded query string from ordered key/value rows with duplicate-key support.",
    keywords: [
      "query string",
      "url params",
      "generate",
      "encode",
      "search params",
    ],
    aliases: ["query parameter builder", "url params generator"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Query String Generator Online — Build URL Parameters",
    seoDescription:
      "Generate standards-based URL query strings from editable key/value rows, including repeated keys and optional leading question marks.",
    related: ["query-string-parser", "url-encoder", "api-request-builder"],
    faq: [
      {
        question: "Can the same key appear more than once?",
        answer:
          "Yes. Each row is appended in order, which supports array-style and repeated query parameters.",
      },
      {
        question: "How are spaces encoded?",
        answer:
          "The generator follows URLSearchParams rules and encodes spaces as plus signs in form-style query strings.",
      },
    ],
  },
  {
    ...shared,
    id: "unicode-converter",
    slug: "unicode-converter",
    name: "Unicode Escape Converter",
    shortName: "Unicode Converter",
    category: "encoding",
    icon: "Languages",
    sortOrder: 64,
    description:
      "Encode text as Unicode escape sequences or decode fixed and code-point escape notation.",
    keywords: ["unicode", "escape", "code point", "encode", "decode", "emoji"],
    aliases: ["unicode encoder", "unicode decoder"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Unicode Encoder & Decoder Online — Convert Escape Sequences",
    seoDescription:
      "Convert text and Unicode escape sequences locally with support for non-BMP code points, emoji, and surrogate validation.",
    related: ["utf8-inspector", "ascii-converter", "base64"],
    faq: [
      {
        question: "How are emoji encoded?",
        answer:
          "Characters above the BMP use code-point notation such as \\u{1F680}; standard surrogate-pair input can also be decoded.",
      },
      {
        question: "Are invalid surrogate values accepted?",
        answer:
          "No. Lone surrogate code units and values above U+10FFFF are rejected with a clear error.",
      },
    ],
  },
  {
    ...shared,
    id: "ascii-converter",
    slug: "ascii-converter",
    name: "ASCII Converter",
    shortName: "ASCII Converter",
    category: "encoding",
    icon: "Binary",
    sortOrder: 65,
    description:
      "Convert ASCII text to decimal, hexadecimal, or binary codes and decode mixed code notation.",
    keywords: [
      "ascii",
      "decimal",
      "hex",
      "binary",
      "character code",
      "convert",
    ],
    aliases: ["text to ascii", "ascii to text"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "ASCII Converter Online — Text, Decimal, Hex & Binary",
    seoDescription:
      "Convert ASCII text and character codes locally between text, decimal, hexadecimal, and binary notation.",
    related: ["ascii-table", "unicode-converter", "number-base-converter"],
    faq: [
      {
        question: "Which code formats can be decoded?",
        answer:
          "Use plain decimal values, 0x-prefixed hexadecimal values, or 0b-prefixed binary values, separated by spaces or commas.",
      },
      {
        question: "Why are values above 127 rejected?",
        answer:
          "This page targets the original 7-bit ASCII standard; use the Unicode tools for other characters.",
      },
    ],
  },
  {
    ...shared,
    id: "ascii-table",
    slug: "ascii-table",
    name: "ASCII Character Table",
    shortName: "ASCII Table",
    category: "encoding",
    icon: "Table2",
    sortOrder: 66,
    description:
      "Search all 128 ASCII control and printable characters with decimal, hex, and binary codes.",
    keywords: ["ascii", "table", "character", "control code", "hex", "binary"],
    aliases: ["ascii chart", "ascii reference"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "ASCII Table Online — Character Code Reference",
    seoDescription:
      "Search the complete 7-bit ASCII table with control names, printable characters, decimal, hexadecimal, and binary values.",
    related: ["ascii-converter", "utf8-inspector", "http-status-reference"],
    faq: [
      {
        question: "Does the table include control characters?",
        answer:
          "Yes. Values 0 through 31 and 127 include their standard abbreviations and names.",
      },
      {
        question: "Can I filter printable characters only?",
        answer:
          "Yes. Use the segmented filter or search by character, name, decimal, hex, or binary code.",
      },
    ],
  },
  {
    ...shared,
    id: "utf8-inspector",
    slug: "utf8-inspector",
    name: "UTF-8 Encoding Inspector",
    shortName: "UTF-8 Inspector",
    category: "encoding",
    icon: "TextSearch",
    sortOrder: 67,
    description:
      "Inspect Unicode code points, UTF-8 bytes, byte counts, and UTF-16 code units for text.",
    keywords: ["utf-8", "unicode", "bytes", "hex", "code point", "encoding"],
    aliases: ["utf8 viewer", "utf-8 byte viewer"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "UTF-8 Encoding Inspector Online — View Bytes & Code Points",
    seoDescription:
      "Inspect text as UTF-8 bytes locally with per-character hex, Unicode code points, byte totals, and bounded rendering.",
    related: ["unicode-converter", "ascii-table", "file-inspector"],
    faq: [
      {
        question: "Why can one character use multiple bytes?",
        answer:
          "ASCII code points use one UTF-8 byte, while other Unicode code points use two to four bytes.",
      },
      {
        question: "Can large text freeze the table?",
        answer:
          "Analysis runs in a terminable Worker and the page lists at most 1,000 code points while retaining totals for the complete input.",
      },
    ],
  },
  {
    ...shared,
    id: "timestamp-converter",
    slug: "timestamp-converter",
    name: "Timestamp Converter",
    shortName: "Timestamp",
    category: "time-number",
    icon: "Clock3",
    featured: true,
    sortOrder: 70,
    description:
      "Convert Unix seconds, milliseconds, ISO dates, UTC, and local time.",
    keywords: ["unix", "timestamp", "epoch", "date", "time", "utc"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Unix Timestamp Converter — Epoch to Date",
    seoDescription:
      "Convert Unix timestamps and dates across ISO, UTC, and your local timezone.",
    related: ["cron-generator", "number-base-converter", "uuid-generator"],
    faq: [
      {
        question: "How are seconds and milliseconds detected?",
        answer:
          "Numeric values below 100 billion in magnitude are treated as seconds; larger values are treated as milliseconds.",
      },
    ],
  },
  {
    ...shared,
    id: "uuid-generator",
    slug: "uuid-generator",
    name: "UUID Generator",
    shortName: "UUID",
    category: "crypto",
    icon: "Fingerprint",
    featured: true,
    sortOrder: 80,
    description:
      "Generate cryptographically random UUID v4 values in batches of up to 100.",
    keywords: ["uuid", "guid", "random", "identifier", "v4"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "UUID v4 Generator Online — Bulk Random UUIDs",
    seoDescription:
      "Generate secure UUID v4 identifiers locally with copy and download support.",
    related: ["hash-generator", "timestamp-converter", "jwt-decoder"],
    faq: [
      {
        question: "How are UUIDs generated?",
        answer:
          "The tool uses crypto.randomUUID from your browser's Web Crypto API.",
      },
    ],
  },
  {
    ...shared,
    id: "hash-generator",
    slug: "hash-generator",
    name: "Hash Generator",
    shortName: "Hash",
    category: "crypto",
    icon: "Hash",
    featured: true,
    sortOrder: 90,
    description:
      "Generate SHA-256, SHA-384, SHA-512, SHA-1, or MD5 text digests.",
    keywords: ["hash", "sha256", "sha512", "sha1", "md5", "digest"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Hash Generator Online — SHA-256, SHA-512 & MD5",
    seoDescription:
      "Calculate common text hashes locally with modern Web Crypto algorithms.",
    related: ["uuid-generator", "base64", "jwt-decoder"],
    faq: [
      {
        question: "Can I hash passwords with this?",
        answer:
          "No. Password storage needs a purpose-built slow algorithm such as Argon2 or scrypt with a unique salt.",
      },
    ],
  },
  {
    ...shared,
    id: "text-counter",
    slug: "text-counter",
    name: "Text Counter",
    shortName: "Text Count",
    category: "text",
    icon: "WholeWord",
    featured: true,
    sortOrder: 100,
    description:
      "Count characters, English letters, Han characters, words, lines, bytes, numbers, and whitespace.",
    keywords: [
      "text",
      "word count",
      "character count",
      "english letters",
      "bytes",
      "lines",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Text Counter Online — Words, Characters, Lines & Bytes",
    seoDescription:
      "Analyze text counts instantly in your browser with Unicode-aware metrics.",
    related: ["case-converter", "text-diff", "regex-tester"],
    faq: [
      {
        question: "Are emoji counted correctly?",
        answer:
          "The character metric is Unicode code-point aware. Some multi-code-point grapheme clusters may count as more than one.",
      },
    ],
  },
  {
    ...shared,
    id: "case-converter",
    slug: "case-converter",
    name: "Text Case Converter",
    shortName: "Case Convert",
    category: "text",
    icon: "CaseSensitive",
    sortOrder: 110,
    description:
      "Capitalize text or convert it to camelCase, PascalCase, snake_case, kebab-case, and more.",
    keywords: [
      "case",
      "capitalize",
      "camelcase",
      "pascal",
      "snake",
      "kebab",
      "constant",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Text Case Converter — camelCase, snake_case & More",
    seoDescription:
      "Capitalize text or convert identifiers between eleven common naming conventions.",
    related: ["text-counter", "regex-tester", "html-formatter"],
    faq: [
      {
        question: "Which separators are recognized?",
        answer:
          "Spaces, hyphens, underscores, dots, slashes, backslashes, and camel-case boundaries are recognized.",
      },
    ],
  },
  {
    ...shared,
    id: "line-cleaner",
    slug: "line-cleaner",
    name: "Line Cleaner",
    shortName: "Clean Lines",
    category: "text",
    icon: "ListX",
    sortOrder: 111,
    description:
      "Remove blank lines, duplicate lines, and surrounding whitespace with case controls.",
    keywords: ["lines", "blank lines", "duplicate lines", "clean", "trim"],
    aliases: ["remove empty lines", "unique lines"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Remove Blank and Duplicate Lines Online",
    seoDescription:
      "Clean text locally by removing empty or duplicate lines, trimming whitespace, and choosing case sensitivity.",
    related: ["line-sorter", "line-numberer", "text-deduplicator"],
    faq: [
      {
        question: "Can duplicate matching ignore letter case?",
        answer:
          "Yes. Turn off case-sensitive matching to treat values such as Alpha and alpha as the same line while preserving the first occurrence.",
      },
      {
        question: "Are whitespace-only lines considered blank?",
        answer:
          "Yes. Blank-line removal also removes lines containing only whitespace.",
      },
    ],
  },
  {
    ...shared,
    id: "line-sorter",
    slug: "line-sorter",
    name: "Line Sorter and Reverser",
    shortName: "Sort Lines",
    category: "text",
    icon: "ArrowUpDown",
    sortOrder: 112,
    description:
      "Sort lines alphabetically, naturally, or by length, or reverse their existing order.",
    keywords: ["line sort", "natural sort", "reverse lines", "alphabetical"],
    aliases: ["sort text lines", "reverse line order"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Sort or Reverse Text Lines Online",
    seoDescription:
      "Sort text lines alphabetically, naturally, or by length, and reverse line order entirely in your browser.",
    related: ["line-cleaner", "line-numberer", "text-deduplicator"],
    faq: [
      {
        question: "What is natural sorting?",
        answer:
          "Natural sorting compares embedded numbers numerically, so item2 appears before item10.",
      },
      {
        question: "Does reverse mode reverse characters?",
        answer:
          "No. It reverses the order of complete lines and preserves the content of each line.",
      },
    ],
  },
  {
    ...shared,
    id: "line-numberer",
    slug: "line-numberer",
    name: "Line Numberer",
    shortName: "Line Numbers",
    category: "text",
    icon: "ListOrdered",
    sortOrder: 113,
    description:
      "Add configurable line numbers or remove common numeric prefixes from text.",
    keywords: ["line numbers", "number lines", "remove numbering", "prefix"],
    aliases: ["add line numbers", "strip line numbers"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Add or Remove Line Numbers Online",
    seoDescription:
      "Add line numbers with configurable starts, separators, and zero padding, or remove common line-number prefixes locally.",
    related: ["line-cleaner", "line-sorter", "text-splitter"],
    faq: [
      {
        question: "Which line-number formats can be added?",
        answer:
          "Use a period, colon, or tab separator, choose the starting number, and optionally zero-pad the sequence.",
      },
      {
        question: "Which prefixes can be removed?",
        answer:
          "The remover recognizes numeric prefixes followed by whitespace or common punctuation such as periods, colons, parentheses, brackets, and hyphens.",
      },
    ],
  },
  {
    ...shared,
    id: "text-deduplicator",
    slug: "text-deduplicator",
    name: "Text Deduplicator",
    shortName: "Deduplicate Text",
    category: "text",
    icon: "ListMinus",
    sortOrder: 114,
    description:
      "Keep the first unique line, word, or Unicode character with optional case-insensitive matching.",
    keywords: [
      "deduplicate",
      "unique text",
      "unique words",
      "unique characters",
    ],
    aliases: ["remove duplicate text", "text unique"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Text Deduplicator — Unique Lines, Words or Characters",
    seoDescription:
      "Remove repeated lines, words, or Unicode characters while preserving first-seen order and processing text locally.",
    related: ["line-cleaner", "text-counter", "text-splitter"],
    faq: [
      {
        question: "Is the original order preserved?",
        answer:
          "Yes. The first occurrence is retained and later matching values are removed without sorting the result.",
      },
    ],
  },
  {
    ...shared,
    id: "text-merger",
    slug: "text-merger",
    name: "Text Merger",
    shortName: "Merge Text",
    category: "text",
    icon: "Combine",
    sortOrder: 115,
    description:
      "Combine two texts with a selected separator or interleave their lines.",
    keywords: ["merge text", "combine text", "interleave lines", "concatenate"],
    aliases: ["text joiner", "combine lines"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Merge Two Texts or Interleave Lines Online",
    seoDescription:
      "Combine two text blocks with a line, blank line, space, or custom separator, or interleave their lines locally.",
    related: ["text-splitter", "line-sorter", "text-deduplicator"],
    faq: [
      {
        question: "How does line interleaving work?",
        answer:
          "The result alternates one line from Text A and one from Text B, then includes any remaining lines from the longer input.",
      },
    ],
  },
  {
    ...shared,
    id: "text-splitter",
    slug: "text-splitter",
    name: "Text Splitter",
    shortName: "Split Text",
    category: "text",
    icon: "Split",
    sortOrder: 116,
    description:
      "Split text by line breaks, whitespace, commas, or a literal custom delimiter.",
    keywords: [
      "split text",
      "delimiter",
      "separate text",
      "tokenize",
      "json array",
    ],
    aliases: ["text separator", "string split"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Split Text by Delimiter Online",
    seoDescription:
      "Split text by line breaks, whitespace, commas, or a custom literal delimiter and export lines or JSON locally.",
    related: ["text-merger", "line-numberer", "text-deduplicator"],
    faq: [
      {
        question: "Is the custom delimiter a regular expression?",
        answer:
          "No. It is matched as literal text, so regex punctuation has no special behavior.",
      },
      {
        question: "Can empty parts be retained?",
        answer:
          "Yes. Turn off the empty-part filter, and choose either one item per line or a JSON array for output.",
      },
    ],
  },
  {
    ...shared,
    id: "text-diff",
    slug: "text-diff",
    name: "Text Diff",
    shortName: "Diff",
    category: "text",
    icon: "FileDiff",
    featured: true,
    sortOrder: 120,
    description:
      "Compare text or normalized JSON by line or character, with whitespace and case controls.",
    keywords: [
      "diff",
      "compare",
      "text",
      "json diff",
      "ignore case",
      "changes",
      "unified",
    ],
    maxInputSize: TOOL_LIMITS.diff,
    seoTitle: "Text & JSON Diff Online — Compare Lines and Characters",
    seoDescription:
      "Compare text or normalized JSON locally, ignore whitespace or case, and download the resulting diff.",
    related: ["json-formatter", "text-counter", "regex-tester"],
    faq: [
      {
        question: "Can whitespace be ignored?",
        answer:
          "Yes, line comparison includes an option to ignore whitespace changes.",
      },
      {
        question: "Does JSON key order affect the result?",
        answer:
          "No. JSON objects are normalized with sorted keys before comparison, while array order is preserved.",
      },
    ],
  },
  {
    ...shared,
    id: "regex-tester",
    slug: "regex-tester",
    name: "Regex Tester",
    shortName: "Regex",
    category: "regex",
    icon: "Regex",
    featured: true,
    sortOrder: 130,
    description:
      "Test and replace with JavaScript regular expressions using captures, templates, and syntax explanations.",
    keywords: [
      "regex",
      "regular expression",
      "javascript",
      "pcre",
      "capture group",
      "replace",
      "template",
      "match",
      "pattern",
    ],
    maxInputSize: TOOL_LIMITS.regex,
    seoTitle: "Regex Tester & Replacer — Explain JavaScript Patterns",
    seoDescription:
      "Test, explain, and replace with JavaScript regex patterns locally using capture groups and common templates.",
    related: ["text-counter", "text-diff", "case-converter"],
    faq: [
      {
        question: "Which regex flavor is used?",
        answer:
          "The tester uses your browser's JavaScript RegExp implementation and lists important PCRE differences in the workspace.",
      },
      {
        question: "Can replacements use capture groups?",
        answer:
          "Yes. Use $1 for numbered groups or $<name> for JavaScript named groups.",
      },
      {
        question: "How is ReDoS handled?",
        answer:
          "Input and pattern sizes are limited, matches are capped, and common nested-quantifier patterns are rejected.",
      },
    ],
  },
  {
    ...shared,
    id: "number-base-converter",
    slug: "number-base-converter",
    name: "Number Base Converter",
    shortName: "Base Convert",
    category: "time-number",
    icon: "Binary",
    sortOrder: 140,
    description:
      "Convert arbitrary-precision integers between bases 2 through 36.",
    keywords: ["binary", "decimal", "hex", "octal", "base", "radix"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Number Base Converter — Binary, Decimal & Hex",
    seoDescription:
      "Convert large integers between any bases from 2 to 36 without precision loss.",
    related: ["timestamp-converter", "color-converter", "hash-generator"],
    faq: [
      {
        question: "Are large integers supported?",
        answer:
          "Yes. Conversion uses JavaScript BigInt, avoiding normal floating-point precision loss.",
      },
    ],
  },
  {
    ...shared,
    id: "data-size-converter",
    slug: "data-size-converter",
    name: "Data Size Converter",
    shortName: "Data Size",
    category: "time-number",
    icon: "Scaling",
    sortOrder: 145,
    featured: true,
    description:
      "Convert bits, bytes, decimal KB/MB/GB, and binary KiB/MiB/GiB units side by side.",
    keywords: ["bit byte", "kb mb gb", "kib mib gib", "file size", "data unit"],
    aliases: ["bit byte converter", "kb mb gb converter"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Bit, Byte, KB, MB and GB Converter Online",
    seoDescription:
      "Convert bits and bytes across decimal SI and binary IEC data-size units with clear 1000 and 1024 conventions.",
    related: ["number-base-converter", "file-inspector", "text-counter"],
    faq: [
      {
        question: "What is the difference between MB and MiB?",
        answer:
          "One MB is 1,000,000 bytes under SI, while one MiB is 1,048,576 bytes under the IEC binary convention.",
      },
      {
        question: "How many bits are in one byte?",
        answer: "One byte contains exactly eight bits.",
      },
    ],
  },
  {
    ...shared,
    id: "color-converter",
    slug: "color-converter",
    name: "Color Converter",
    shortName: "Color",
    category: "web",
    icon: "Palette",
    featured: true,
    sortOrder: 150,
    description:
      "Convert and preview HEX, RGB, and HSL colors with CSS-ready values.",
    keywords: ["color", "hex", "rgb", "hsl", "css", "picker"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Color Converter Online — HEX, RGB & HSL",
    seoDescription:
      "Convert HEX and RGB colors, inspect HSL values, preview, and copy CSS locally.",
    related: ["qr-code-generator", "html-formatter", "number-base-converter"],
    faq: [
      {
        question: "Which inputs are accepted?",
        answer:
          "Use 3- or 6-digit HEX, rgb(r,g,b), or a comma-separated RGB triplet.",
      },
    ],
  },
  {
    ...shared,
    id: "qr-code-generator",
    slug: "qr-code-generator",
    name: "QR Code Generator",
    shortName: "QR Code",
    category: "web",
    icon: "QrCode",
    featured: true,
    sortOrder: 160,
    description:
      "Create downloadable PNG QR codes with size and correction controls.",
    keywords: ["qr", "qrcode", "barcode", "url", "png"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "QR Code Generator Online — Download PNG",
    seoDescription:
      "Create customizable QR codes locally and download high-resolution PNG images.",
    related: ["url-encoder", "color-converter", "base64"],
    faq: [
      {
        question: "Is QR content sent anywhere?",
        answer: "No. The QR image is rendered in your browser.",
      },
    ],
  },
  {
    ...shared,
    id: "curl-parser",
    slug: "curl-parser",
    name: "cURL Parser",
    shortName: "cURL Parse",
    category: "web",
    icon: "TerminalSquare",
    sortOrder: 170,
    description:
      "Inspect the method, URL, headers, and body in a common cURL command.",
    keywords: ["curl", "parse", "http", "api", "request"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "cURL Parser Online — Inspect HTTP Requests",
    seoDescription:
      "Parse common cURL commands locally into method, URL, headers, and body.",
    related: ["curl-generator", "url-decoder", "json-formatter"],
    faq: [
      {
        question: "Does it execute the request?",
        answer:
          "No. It only parses the command locally and never sends a network request.",
      },
    ],
  },
  {
    ...shared,
    id: "curl-generator",
    slug: "curl-generator",
    name: "cURL Generator",
    shortName: "cURL Build",
    category: "web",
    icon: "SquareCode",
    sortOrder: 180,
    description:
      "Build cURL or JavaScript fetch code from a simple HTTP request form.",
    keywords: ["curl", "generate", "fetch", "http", "api", "request"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "cURL Generator Online — Build HTTP Requests",
    seoDescription:
      "Generate cURL and fetch request code without sending your API data anywhere.",
    related: ["curl-parser", "json-formatter", "url-encoder"],
    faq: [
      {
        question: "Are requests executed?",
        answer:
          "No. The tool only generates source code for you to review and run yourself.",
      },
    ],
  },
  {
    ...shared,
    id: "jwt-decoder",
    slug: "jwt-decoder",
    name: "JWT Decoder",
    shortName: "JWT",
    category: "crypto",
    icon: "KeyRound",
    sortOrder: 190,
    description:
      "Decode JWT headers, payloads, and time claims without verifying or uploading tokens.",
    keywords: ["jwt", "token", "decode", "header", "payload", "claims"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "JWT Decoder Online — Inspect Header & Payload",
    seoDescription:
      "Decode JWT claims privately in your browser and inspect issue and expiry times.",
    related: ["base64", "timestamp-converter", "hash-generator"],
    faq: [
      {
        question: "Does decoding prove a JWT is valid?",
        answer:
          "No. A token must be cryptographically verified against a trusted key before it can be considered authentic.",
      },
    ],
  },
  {
    ...shared,
    id: "cron-generator",
    slug: "cron-generator",
    name: "Cron Expression Tool",
    shortName: "Cron",
    category: "time-number",
    icon: "CalendarClock",
    sortOrder: 200,
    description:
      "Validate cron expressions, apply useful presets, and preview upcoming run times.",
    keywords: ["cron", "schedule", "crontab", "next run", "generator"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Cron Expression Generator & Next Run Preview",
    seoDescription:
      "Build and validate cron schedules with presets and five upcoming local run times.",
    related: ["timestamp-converter", "curl-generator", "number-base-converter"],
    faq: [
      {
        question: "Which cron syntax is supported?",
        answer:
          "Standard five-field expressions and optional seconds are supported by the local parser.",
      },
    ],
  },
  {
    ...shared,
    id: "html-formatter",
    slug: "html-formatter",
    name: "HTML Formatter",
    shortName: "HTML Format",
    category: "web",
    icon: "CodeXml",
    sortOrder: 210,
    description:
      "Beautify HTML with a readable structure and consistent indentation.",
    keywords: ["html", "format", "beautify", "prettier", "markup"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "HTML Formatter Online — Beautify Markup",
    seoDescription:
      "Format HTML locally with readable indentation and copy or download the result.",
    related: ["json-formatter", "color-converter", "case-converter"],
    faq: [
      {
        question: "Is markup rendered?",
        answer:
          "No. The input is treated as source text, formatted, and displayed without executing it.",
      },
    ],
  },
  {
    ...shared,
    id: "image-workbench",
    slug: "image-workbench",
    name: "Image Workbench",
    shortName: "Images",
    category: "files",
    icon: "Image",
    featured: true,
    sortOrder: 220,
    description:
      "Compress, resize, crop, convert, inspect, and encode images without uploading them.",
    keywords: [
      "image",
      "compress",
      "resize",
      "crop",
      "png",
      "jpg",
      "webp",
      "base64",
      "exif",
      "favicon",
    ],
    maxInputSize: TOOL_LIMITS.image,
    seoTitle: "Image Compressor, Resizer & Converter Online",
    seoDescription:
      "Compress, resize, crop, convert PNG, JPG, and WebP images, inspect EXIF and colors, or convert Base64 locally.",
    related: ["file-inspector", "archive-workbench", "color-converter"],
    faq: [
      {
        question: "Are images uploaded?",
        answer:
          "No. Decoding, Canvas transformations, EXIF parsing, and downloads all stay in your browser.",
      },
      {
        question: "Which output formats are supported?",
        answer:
          "Modern browsers can export PNG, JPEG, and WebP, plus a 32×32 PNG favicon.",
      },
    ],
  },
  {
    ...shared,
    id: "archive-workbench",
    slug: "archive-workbench",
    name: "ZIP, TAR & GZIP Workbench",
    shortName: "Archives",
    category: "files",
    icon: "FileArchive",
    featured: true,
    sortOrder: 230,
    description:
      "Extract ZIP, TAR, and GZIP archives or create ZIP and GZIP files with strict safety limits.",
    keywords: ["zip", "unzip", "tar", "gzip", "archive", "compress", "extract"],
    maxInputSize: TOOL_LIMITS.archive,
    maxOutputSize: TOOL_LIMITS.maxExtractedSize,
    seoTitle: "ZIP, TAR & GZIP Extractor and Compressor Online",
    seoDescription:
      "Extract ZIP, TAR, TAR.GZ, and GZIP archives or create ZIP and GZIP files locally with Zip Slip and Zip Bomb protection.",
    related: ["file-inspector", "image-workbench", "mime-type-lookup"],
    faq: [
      {
        question: "How are unsafe archives blocked?",
        answer:
          "The extractor rejects traversal paths, absolute paths, deep trees, too many entries, excessive output, and suspicious compression ratios.",
      },
      {
        question: "Does extraction upload the archive?",
        answer:
          "No. Archive data is parsed and decompressed locally in your browser.",
      },
    ],
  },
  {
    ...shared,
    id: "file-inspector",
    slug: "file-inspector",
    name: "File Inspector",
    shortName: "File Info",
    category: "files",
    icon: "FileSearch",
    sortOrder: 240,
    description:
      "Inspect file metadata, MIME signatures, hashes, hexadecimal bytes, encoding, and file sizes.",
    keywords: ["file", "mime", "hash", "hex", "encoding", "size", "metadata"],
    maxInputSize: TOOL_LIMITS.file,
    seoTitle: "File Inspector Online — MIME, Hash, Hex & Encoding",
    seoDescription:
      "Inspect a local file's MIME type, SHA and MD5 hashes, hex bytes, text encoding, and exact size without uploading it.",
    related: ["archive-workbench", "mime-type-lookup", "hash-generator"],
    faq: [
      {
        question: "How is the MIME type selected?",
        answer:
          "Known binary signatures take priority, followed by the filename extension and browser-provided type.",
      },
    ],
  },
  {
    ...shared,
    id: "ssh-key-generator",
    slug: "ssh-key-generator",
    name: "SSH Key Generator",
    shortName: "SSH Keys",
    category: "crypto",
    icon: "KeyRound",
    featured: true,
    sortOrder: 250,
    description:
      "Generate RSA, Ed25519, or ECDSA SSH key pairs locally with downloadable key files.",
    keywords: [
      "ssh",
      "rsa",
      "ed25519",
      "ecdsa",
      "public key",
      "private key",
      "openssh",
      "pkcs8",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "SSH Key Generator Online — RSA, Ed25519 & ECDSA",
    seoDescription:
      "Generate SSH keys privately in your browser, including OpenSSH public keys and downloadable protected private keys.",
    related: ["hash-generator", "uuid-generator", "file-inspector"],
    faq: [
      {
        question: "Does the private key leave my browser?",
        answer:
          "No. Key generation and private-key export use local cryptographic APIs only.",
      },
      {
        question: "Which private-key formats are produced?",
        answer:
          "Ed25519 uses OpenSSH private-key format. RSA and ECDSA use interoperable PKCS#8, optionally encrypted with a passphrase.",
      },
    ],
  },
  {
    ...shared,
    id: "mime-type-lookup",
    slug: "mime-type-lookup",
    name: "MIME Type Lookup",
    shortName: "MIME Types",
    category: "web",
    icon: "FileType2",
    sortOrder: 260,
    description:
      "Find media types, filename extensions, charsets, and compression hints.",
    keywords: ["mime", "media type", "content-type", "extension", "charset"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "MIME Type Lookup — Extensions & Content Types",
    seoDescription:
      "Search MIME types by extension or media type and inspect charsets and compression metadata.",
    related: ["file-inspector", "http-status-reference", "curl-generator"],
    faq: [
      {
        question: "Can I search by extension?",
        answer:
          "Yes. Search with values such as json, .png, wasm, or a complete media type.",
      },
    ],
  },
  {
    ...shared,
    id: "http-status-reference",
    slug: "http-status-reference",
    name: "HTTP Status Code Reference",
    shortName: "HTTP Status",
    category: "web",
    icon: "CircleGauge",
    sortOrder: 270,
    description:
      "Search standard HTTP response codes by number, name, class, or meaning.",
    keywords: [
      "http",
      "status",
      "response",
      "404",
      "500",
      "redirect",
      "error code",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "HTTP Status Code Reference — Search 1xx to 5xx",
    seoDescription:
      "Look up standard HTTP status codes with concise meanings and filters for informational, success, redirect, and error responses.",
    related: ["mime-type-lookup", "curl-parser", "curl-generator"],
    faq: [
      {
        question: "Which status codes are included?",
        answer:
          "The reference covers standard registered HTTP status codes across the 1xx through 5xx classes.",
      },
    ],
  },
  {
    ...shared,
    id: "sql-formatter",
    slug: "sql-formatter",
    name: "SQL Formatter & Beautifier",
    shortName: "SQL Formatter",
    category: "json-data",
    icon: "Database",
    featured: true,
    sortOrder: 280,
    description:
      "Format Standard SQL, PostgreSQL, MySQL, SQLite, and SQL Server queries locally.",
    keywords: [
      "sql",
      "formatter",
      "beautifier",
      "postgresql",
      "mysql",
      "sqlite",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "SQL Formatter & Beautifier Online",
    seoDescription:
      "Format SQL with dialect-aware parsing and keyword case controls in your browser.",
    related: ["json-formatter", "text-diff", "api-request-builder"],
    faq: [
      {
        question: "Which SQL dialects are supported?",
        answer:
          "The formatter supports Standard SQL, PostgreSQL, MySQL, SQLite, and SQL Server syntax.",
      },
      {
        question: "Are queries uploaded?",
        answer: "No. Parsing and formatting run entirely in your browser.",
      },
    ],
  },
  {
    ...shared,
    id: "css-formatter",
    slug: "css-formatter",
    name: "CSS Formatter & Minifier",
    shortName: "CSS Tools",
    category: "web",
    icon: "Braces",
    featured: true,
    sortOrder: 290,
    description: "Format or minify CSS locally with parser-backed validation.",
    keywords: ["css", "formatter", "beautifier", "minifier", "stylesheet"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "CSS Formatter & Minifier Online",
    seoDescription:
      "Format and minify CSS locally with syntax-aware output and no uploads.",
    related: ["html-formatter", "javascript-formatter", "color-converter"],
    faq: [
      {
        question: "Does minification change CSS behavior?",
        answer:
          "The minifier uses a CSS syntax tree and applies semantics-preserving optimizations.",
      },
    ],
  },
  {
    ...shared,
    id: "javascript-formatter",
    slug: "javascript-formatter",
    name: "JavaScript Formatter & Minifier",
    shortName: "JavaScript Tools",
    category: "web",
    icon: "FileJson2",
    featured: true,
    sortOrder: 300,
    description:
      "Format or minify modern JavaScript locally with parser-backed validation.",
    keywords: [
      "javascript",
      "js",
      "formatter",
      "beautifier",
      "minifier",
      "terser",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "JavaScript Formatter & Minifier Online",
    seoDescription:
      "Beautify and minify JavaScript locally with modern syntax parsing and no uploads.",
    related: ["html-formatter", "css-formatter", "json-formatter"],
    faq: [
      {
        question: "Which JavaScript syntax is supported?",
        answer:
          "The formatter accepts modern ECMAScript syntax and the minifier validates input before compression.",
      },
    ],
  },
  {
    ...shared,
    id: "git-command-builder",
    slug: "git-command-builder",
    name: "Git Command Builder",
    shortName: "Git Builder",
    category: "web",
    icon: "GitBranch",
    featured: true,
    sortOrder: 310,
    description:
      "Build quoted clone, reset, rebase, and cherry-pick commands, branch names, and parse Git URLs.",
    keywords: [
      "git",
      "clone",
      "reset",
      "rebase",
      "cherry-pick",
      "branch",
      "github",
      "url",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Git Command & Branch Name Generator Online",
    seoDescription:
      "Generate safely quoted Git commands and branch names or parse HTTPS and SSH repository URLs.",
    related: ["git-cheatsheet", "ssh-key-generator", "text-diff"],
    faq: [
      {
        question: "Are commands executed?",
        answer:
          "No. The workbench only generates text for you to review and copy.",
      },
    ],
  },
  {
    ...shared,
    id: "network-calculator",
    slug: "network-calculator",
    name: "IP, CIDR, MAC & URL Calculator",
    shortName: "Network Calculator",
    category: "web",
    icon: "Network",
    featured: true,
    sortOrder: 320,
    description:
      "Inspect IPv4, IPv6, CIDR ranges, subnet masks, MAC formats, and URL components locally.",
    keywords: [
      "ipv4",
      "ipv6",
      "cidr",
      "subnet",
      "ip range",
      "mac",
      "url parser",
      "network",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "IP CIDR Subnet, MAC & URL Calculator",
    seoDescription:
      "Calculate IPv4 and IPv6 networks, subnet ranges, MAC formats, and URL components in your browser.",
    related: ["http-status-reference", "curl-parser", "api-request-builder"],
    faq: [
      {
        question: "Does this query an IP database?",
        answer:
          "No. Address parsing and subnet calculations are mathematical and run locally.",
      },
    ],
  },
  {
    ...shared,
    id: "api-request-builder",
    slug: "api-request-builder",
    name: "API Request Builder & Tester",
    shortName: "API Tester",
    category: "web",
    icon: "Send",
    featured: true,
    sortOrder: 330,
    description:
      "Build cURL, Fetch, and Axios requests or send them directly from your browser with strict limits.",
    keywords: [
      "api",
      "rest",
      "http request",
      "tester",
      "curl",
      "fetch",
      "axios",
      "headers",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "API Request Builder & REST Tester Online",
    seoDescription:
      "Generate cURL, Fetch, and Axios code or test CORS-enabled APIs directly from your browser.",
    related: ["curl-generator", "curl-parser", "json-formatter"],
    faq: [
      {
        question: "Are requests proxied through this site?",
        answer:
          "No. Requests are sent by your browser and remain subject to the destination's CORS policy.",
      },
      {
        question: "What safety limits apply?",
        answer:
          "Requests time out after 10 seconds and response bodies are limited to 1 MB.",
      },
    ],
  },
  {
    ...shared,
    id: "http-header-builder",
    slug: "http-header-builder",
    name: "HTTP Header & Auth Builder",
    shortName: "Header Builder",
    category: "web",
    icon: "PanelTop",
    featured: true,
    sortOrder: 380,
    description:
      "Generate HTTP headers for Bearer, Basic, and API key authentication with raw, JSON, or Fetch output.",
    keywords: [
      "http",
      "headers",
      "authorization",
      "bearer",
      "basic auth",
      "api key",
      "fetch",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "HTTP Header, Bearer & Basic Auth Generator",
    seoDescription:
      "Build HTTP request headers and Authorization values for Bearer tokens, Basic Auth, and API keys locally.",
    related: ["api-request-builder", "webhook-tester", "curl-generator"],
    faq: [
      {
        question: "Are credentials sent anywhere?",
        answer:
          "No. Header generation happens locally in your browser and does not make a network request.",
      },
      {
        question: "Does Basic Auth encrypt a password?",
        answer:
          "No. Basic Auth is Base64 encoding, not encryption. Only use it over HTTPS.",
      },
    ],
  },
  {
    ...shared,
    id: "webhook-tester",
    slug: "webhook-tester",
    name: "Webhook Tester & Payload Formatter",
    shortName: "Webhook Tester",
    category: "web",
    icon: "Webhook",
    featured: true,
    sortOrder: 390,
    description:
      "Format JSON payloads, generate request code, and send outbound webhooks directly from your browser.",
    keywords: [
      "webhook",
      "payload",
      "json",
      "http post",
      "tester",
      "curl",
      "callback",
    ],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Webhook Tester & JSON Payload Formatter Online",
    seoDescription:
      "Format webhook JSON, generate cURL, Fetch, or Axios code, and test CORS-enabled endpoints from your browser.",
    related: ["api-request-builder", "http-header-builder", "json-formatter"],
    faq: [
      {
        question: "Does the request pass through this site's server?",
        answer:
          "No. The browser sends the webhook directly, subject to the destination's CORS policy.",
      },
      {
        question: "What limits apply?",
        answer:
          "Payloads use the configured tool limit, requests time out after 10 seconds, and response bodies are limited to 1 MB.",
      },
    ],
  },
  ...(
    [
      {
        slug: "random-string-generator",
        name: "Random String Generator",
        shortName: "Random String",
        category: "crypto",
        icon: "Dices",
        sortOrder: 400,
        featured: false,
        description:
          "Generate cryptographically random strings from configurable character sets and lengths.",
        keywords: [
          "random string",
          "token",
          "characters",
          "secure",
          "web crypto",
        ],
        seoTitle: "Secure Random String Generator Online",
        seoDescription:
          "Generate random strings locally with Web Crypto, custom length, character sets, and ambiguous-character filtering.",
        related: ["password-generator", "uuid-generator", "hash-generator"],
        faq: {
          question: "What randomness source is used?",
          answer: "The generator uses Web Crypto rather than Math.random().",
        },
      },
      {
        slug: "password-generator",
        name: "Secure Password Generator",
        shortName: "Password Generator",
        category: "crypto",
        icon: "KeyRound",
        sortOrder: 410,
        featured: true,
        description:
          "Create strong local passwords with required character classes and an entropy estimate.",
        keywords: ["password", "secure", "entropy", "random", "web crypto"],
        seoTitle: "Secure Password Generator with Entropy Estimate",
        seoDescription:
          "Generate strong passwords locally with Web Crypto, configurable character classes, and estimated entropy.",
        related: [
          "random-string-generator",
          "uuid-generator",
          "hash-generator",
        ],
        faq: {
          question: "Are generated passwords transmitted?",
          answer:
            "No. Passwords are generated locally and are never uploaded or stored.",
        },
      },
      {
        slug: "username-generator",
        name: "Username Generator",
        shortName: "Username Generator",
        category: "text",
        icon: "UserRoundPlus",
        sortOrder: 420,
        featured: false,
        description:
          "Generate unique adjective-and-noun usernames with separator and numeric suffix controls.",
        keywords: ["username", "handle", "nickname", "random name"],
        seoTitle: "Random Username Generator Online",
        seoDescription:
          "Create readable random usernames locally with separators and optional numeric suffixes.",
        related: [
          "random-string-generator",
          "mock-data-generator",
          "case-converter",
        ],
        faq: {
          question: "Are usernames guaranteed to be globally unique?",
          answer: "No. Results are unique within the generated batch only.",
        },
      },
      {
        slug: "lorem-ipsum-generator",
        name: "Lorem Ipsum Generator",
        shortName: "Lorem Ipsum",
        category: "text",
        icon: "Pilcrow",
        sortOrder: 430,
        featured: false,
        description:
          "Generate placeholder words, sentences, or paragraphs with bounded output sizes.",
        keywords: ["lorem ipsum", "placeholder", "dummy text", "paragraphs"],
        seoTitle: "Lorem Ipsum Text Generator Online",
        seoDescription:
          "Generate placeholder words, sentences, and paragraphs instantly in your browser.",
        related: ["text-counter", "case-converter", "random-string-generator"],
        faq: {
          question: "How much text can be generated?",
          answer:
            "A single run is capped at 1,000 words, 100 sentences, or 20 paragraphs.",
        },
      },
      {
        slug: "fake-json-generator",
        name: "Fake JSON Generator",
        shortName: "Fake JSON",
        category: "json-data",
        icon: "FileJson",
        sortOrder: 440,
        featured: true,
        description:
          "Generate bounded JSON user records with IDs, emails, roles, dates, flags, and scores.",
        keywords: [
          "fake json",
          "sample data",
          "fixture",
          "mock json",
          "records",
        ],
        seoTitle: "Fake JSON Data Generator Online",
        seoDescription:
          "Generate realistic sample JSON records locally for prototypes, tests, and fixtures.",
        related: ["mock-data-generator", "json-formatter", "json-validator"],
        faq: {
          question: "Does the data represent real people?",
          answer: "No. Every record is synthetic and generated locally.",
        },
      },
      {
        slug: "mock-data-generator",
        name: "Mock CSV Data Generator",
        shortName: "Mock Data",
        category: "json-data",
        icon: "TableProperties",
        sortOrder: 450,
        featured: false,
        description:
          "Generate synthetic profile records as CSV for local tests, fixtures, and spreadsheets.",
        keywords: [
          "mock data",
          "csv",
          "fixture",
          "sample records",
          "test data",
        ],
        seoTitle: "Mock CSV Data Generator Online",
        seoDescription:
          "Create synthetic CSV profile data locally with IDs, emails, roles, countries, and flags.",
        related: ["fake-json-generator", "json-formatter", "text-diff"],
        faq: {
          question: "How many rows can one run create?",
          answer:
            "Each batch is limited to 100 rows to keep browser output responsive.",
        },
      },
      {
        slug: "random-number-generator",
        name: "Random Number Generator",
        shortName: "Random Numbers",
        category: "time-number",
        icon: "Sigma",
        sortOrder: 460,
        featured: false,
        description:
          "Generate bounded whole or decimal numbers with precision and uniqueness controls.",
        keywords: ["random number", "integer", "decimal", "range", "unique"],
        seoTitle: "Random Number Generator with Range & Precision",
        seoDescription:
          "Generate random whole or decimal numbers locally with range, count, precision, and uniqueness controls.",
        related: [
          "number-base-converter",
          "random-date-generator",
          "random-string-generator",
        ],
        faq: {
          question: "Can duplicate numbers be prevented?",
          answer:
            "Yes. Enable unique output when the selected range and precision can satisfy the requested count.",
        },
      },
      {
        slug: "random-date-generator",
        name: "Random Date Generator",
        shortName: "Random Dates",
        category: "time-number",
        icon: "CalendarDays",
        sortOrder: 470,
        featured: false,
        description:
          "Generate sorted random dates inside a selected range as ISO, calendar, or Unix values.",
        keywords: ["random date", "date range", "iso 8601", "unix timestamp"],
        seoTitle: "Random Date Generator for ISO & Unix Values",
        seoDescription:
          "Generate random dates within a chosen range and export ISO 8601, YYYY-MM-DD, or Unix values.",
        related: [
          "timestamp-converter",
          "random-number-generator",
          "cron-generator",
        ],
        faq: {
          question: "Which date formats are supported?",
          answer: "Output can use ISO 8601, YYYY-MM-DD, or Unix seconds.",
        },
      },
      {
        slug: "random-color-generator",
        name: "Random Color Generator",
        shortName: "Random Colors",
        category: "web",
        icon: "Palette",
        sortOrder: 480,
        featured: false,
        description:
          "Generate inspectable color swatches and copy HEX, RGB, or HSL CSS values.",
        keywords: ["random color", "hex", "rgb", "hsl", "css", "swatch"],
        seoTitle: "Random HEX, RGB & HSL Color Generator",
        seoDescription:
          "Generate random color swatches locally and copy valid HEX, RGB, or HSL CSS values.",
        related: [
          "color-converter",
          "css-formatter",
          "random-number-generator",
        ],
        faq: {
          question: "Can colors be copied as CSS?",
          answer:
            "Yes. Switch between HEX, RGB, and HSL, then copy any generated value.",
        },
      },
    ] as const
  ).map((tool) => ({
    ...shared,
    id: tool.slug,
    slug: tool.slug,
    name: tool.name,
    shortName: tool.shortName,
    category: tool.category,
    icon: tool.icon,
    featured: tool.featured,
    sortOrder: tool.sortOrder,
    description: tool.description,
    keywords: [...tool.keywords],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: tool.seoTitle,
    seoDescription: tool.seoDescription,
    related: [...tool.related],
    faq: [tool.faq],
  })),
  ...(
    [
      [
        "linux-cheatsheet",
        "Linux Command Cheatsheet",
        "Linux Commands",
        "Terminal",
        340,
        ["linux", "shell", "commands", "systemd", "files", "network"],
        "Linux commands and configuration snippets",
        ["git-cheatsheet", "network-calculator", "api-request-builder"],
      ],
      [
        "git-cheatsheet",
        "Git Command Cheatsheet",
        "Git Cheatsheet",
        "GitCommitHorizontal",
        350,
        ["git", "commands", "branch", "diff", "reflog", "remote"],
        "Git commands and recovery references",
        ["git-command-builder", "ssh-key-generator", "text-diff"],
      ],
      [
        "docker-cheatsheet",
        "Docker Command Cheatsheet",
        "Docker Commands",
        "Container",
        360,
        ["docker", "container", "image", "compose", "build", "logs"],
        "Docker and Compose commands",
        ["linux-cheatsheet", "nginx-cheatsheet", "network-calculator"],
      ],
      [
        "nginx-cheatsheet",
        "Nginx Configuration Cheatsheet",
        "Nginx Cheatsheet",
        "ServerCog",
        370,
        ["nginx", "reverse proxy", "tls", "headers", "reload", "config"],
        "Nginx commands and configuration snippets",
        ["docker-cheatsheet", "network-calculator", "http-header-builder"],
      ],
      [
        "vim-cheatsheet",
        "Vim Cheatsheet",
        "Vim Reference",
        "SquareTerminal",
        490,
        ["vim", "editor", "motions", "navigation", "replace", "commands"],
        "Vim motions and editing commands",
        ["linux-cheatsheet", "bash-cheatsheet", "git-cheatsheet"],
      ],
      [
        "regex-cheatsheet",
        "Regex Cheatsheet",
        "Regex Reference",
        "Regex",
        500,
        [
          "regex",
          "regular expression",
          "pattern",
          "groups",
          "lookaround",
          "quantifier",
        ],
        "regular expression patterns and syntax",
        ["regex-tester", "text-counter", "javascript-cheatsheet"],
      ],
      [
        "bash-cheatsheet",
        "Bash Cheatsheet",
        "Bash Reference",
        "Shell",
        510,
        ["bash", "shell", "script", "pipefail", "loop", "trap"],
        "Bash commands and scripting patterns",
        ["linux-cheatsheet", "vim-cheatsheet", "git-cheatsheet"],
      ],
      [
        "sql-cheatsheet",
        "SQL Cheatsheet",
        "SQL Reference",
        "Database",
        520,
        ["sql", "select", "join", "group by", "transaction", "cte", "explain"],
        "SQL queries and statements",
        ["sql-formatter", "fake-json-generator", "api-request-builder"],
      ],
      [
        "javascript-cheatsheet",
        "JavaScript Cheatsheet",
        "JavaScript Reference",
        "FileJson2",
        530,
        ["javascript", "js", "async", "array", "object", "modules"],
        "JavaScript language patterns",
        ["javascript-formatter", "regex-cheatsheet", "json-formatter"],
      ],
      [
        "python-cheatsheet",
        "Python Cheatsheet",
        "Python Reference",
        "CodeXml",
        540,
        ["python", "venv", "pip", "comprehension", "pathlib", "json"],
        "Python commands and code patterns",
        ["bash-cheatsheet", "json-formatter", "regex-cheatsheet"],
      ],
      [
        "http-status-code-cheatsheet",
        "HTTP Status Code Cheatsheet",
        "HTTP Status Codes",
        "CircleGauge",
        550,
        ["http", "status code", "200", "404", "429", "500", "response"],
        "HTTP response status codes",
        ["http-status-reference", "http-header-builder", "api-request-builder"],
      ],
      [
        "css-cheatsheet",
        "CSS Cheatsheet",
        "CSS Reference",
        "Braces",
        560,
        ["css", "flexbox", "grid", "clamp", "media query", "layout"],
        "CSS layout and styling snippets",
        ["css-formatter", "color-converter", "html-formatter"],
      ],
    ] as const
  ).map(
    ([slug, name, shortName, icon, sortOrder, keywords, subject, related]) => ({
      ...shared,
      id: slug,
      slug,
      name,
      shortName,
      category: "web" as const,
      icon,
      sortOrder,
      description: `Search practical ${subject} by task.`,
      keywords: [...keywords],
      maxInputSize: TOOL_LIMITS.text,
      seoTitle: `${name} — Searchable Reference`,
      seoDescription: `Search and copy practical ${shortName.toLowerCase()} by task with a fast local reference.`,
      related: [...related],
      faq: [
        {
          question: "Are entries executed automatically?",
          answer:
            "No. Entries are reference text that you can review and copy.",
        },
      ],
    }),
  ),
];

export function getTool(
  slug: string,
  locale: Locale = "en",
): ToolDefinition | undefined {
  const tool = tools.find((item) => item.slug === slug && item.enabled);
  return tool ? localizeTool(tool, locale) : undefined;
}

export function getCategory(
  id: ToolDefinition["category"],
  locale: Locale = "en",
): ToolCategory | undefined {
  const category = categories.find((item) => item.id === id);
  return category ? localizeCategory(category, locale) : undefined;
}

export function getCategories(locale: Locale = "en"): ToolCategory[] {
  return categories.map((category) => localizeCategory(category, locale));
}

export function getTools(locale: Locale = "en"): ToolDefinition[] {
  return tools
    .filter((tool) => tool.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((tool) => localizeTool(tool, locale));
}

export function getToolsByCategory(
  category: ToolDefinition["category"],
  locale: Locale = "en",
): ToolDefinition[] {
  return getTools(locale).filter((tool) => tool.category === category);
}

export function searchTools(
  query: string,
  locale: Locale = "en",
): ToolDefinition[] {
  const normalized = query.trim().toLowerCase();
  const localizedTools = getTools(locale);
  if (!normalized) return localizedTools;
  const terms = normalized.split(/\s+/);
  return localizedTools
    .map((tool) => {
      const english = localizeTool(
        tools.find((item) => item.id === tool.id)!,
        "en",
      );
      const chinese = localizeTool(
        tools.find((item) => item.id === tool.id)!,
        "zh",
      );
      const category = `${getCategory(tool.category, "en")?.name ?? ""} ${getCategory(tool.category, "zh")?.name ?? ""}`;
      const title =
        `${tool.name} ${tool.shortName} ${english.name} ${english.shortName} ${chinese.name} ${chinese.shortName} ${(tool.aliases ?? []).join(" ")}`.toLowerCase();
      const rest =
        `${tool.description} ${tool.keywords.join(" ")} ${english.description} ${english.keywords.join(" ")} ${chinese.description} ${chinese.keywords.join(" ")} ${category}`.toLowerCase();
      const score = terms.reduce(
        (total, term) =>
          total +
          (title.startsWith(term)
            ? 8
            : title.includes(term)
              ? 5
              : rest.includes(term)
                ? 2
                : 0),
        0,
      );
      return { tool, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.tool.sortOrder - b.tool.sortOrder)
    .map(({ tool }) => tool);
}
