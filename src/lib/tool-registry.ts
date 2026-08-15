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
      "Count characters, words, lines, bytes, numbers, whitespace, and Han characters.",
    keywords: ["text", "word count", "character count", "bytes", "lines"],
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
      "Convert text to camelCase, PascalCase, snake_case, kebab-case, and more.",
    keywords: ["case", "camelcase", "pascal", "snake", "kebab", "constant"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Text Case Converter — camelCase, snake_case & More",
    seoDescription:
      "Convert identifiers and text between ten common naming conventions.",
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
    id: "text-diff",
    slug: "text-diff",
    name: "Text Diff",
    shortName: "Diff",
    category: "text",
    icon: "FileDiff",
    featured: true,
    sortOrder: 120,
    description:
      "Compare two texts by line or character and export a compact diff.",
    keywords: ["diff", "compare", "text", "changes", "unified"],
    maxInputSize: TOOL_LIMITS.diff,
    seoTitle: "Text Diff Online — Compare Text by Line or Character",
    seoDescription:
      "Compare text locally with clear additions and removals and downloadable results.",
    related: ["json-formatter", "text-counter", "regex-tester"],
    faq: [
      {
        question: "Can whitespace be ignored?",
        answer:
          "Yes, line comparison includes an option to ignore whitespace changes.",
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
      "Test JavaScript regular expressions with live highlighting, flags, and match counts.",
    keywords: ["regex", "regular expression", "javascript", "match", "pattern"],
    maxInputSize: TOOL_LIMITS.regex,
    seoTitle: "Regex Tester Online — JavaScript Regular Expressions",
    seoDescription:
      "Test JavaScript regex patterns locally with live matches and safety limits.",
    related: ["text-counter", "text-diff", "case-converter"],
    faq: [
      {
        question: "Which regex flavor is used?",
        answer:
          "The tester uses your browser's JavaScript RegExp implementation.",
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
    keywords: ["sql", "formatter", "beautifier", "postgresql", "mysql", "sqlite"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "SQL Formatter & Beautifier Online",
    seoDescription:
      "Format SQL with dialect-aware parsing and keyword case controls in your browser.",
    related: ["json-formatter", "text-diff", "api-request-builder"],
    faq: [
      { question: "Which SQL dialects are supported?", answer: "The formatter supports Standard SQL, PostgreSQL, MySQL, SQLite, and SQL Server syntax." },
      { question: "Are queries uploaded?", answer: "No. Parsing and formatting run entirely in your browser." },
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
    seoDescription: "Format and minify CSS locally with syntax-aware output and no uploads.",
    related: ["html-formatter", "javascript-formatter", "color-converter"],
    faq: [{ question: "Does minification change CSS behavior?", answer: "The minifier uses a CSS syntax tree and applies semantics-preserving optimizations." }],
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
    description: "Format or minify modern JavaScript locally with parser-backed validation.",
    keywords: ["javascript", "js", "formatter", "beautifier", "minifier", "terser"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "JavaScript Formatter & Minifier Online",
    seoDescription: "Beautify and minify JavaScript locally with modern syntax parsing and no uploads.",
    related: ["html-formatter", "css-formatter", "json-formatter"],
    faq: [{ question: "Which JavaScript syntax is supported?", answer: "The formatter accepts modern ECMAScript syntax and the minifier validates input before compression." }],
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
    description: "Build quoted clone, reset, rebase, and cherry-pick commands, branch names, and parse Git URLs.",
    keywords: ["git", "clone", "reset", "rebase", "cherry-pick", "branch", "github", "url"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "Git Command & Branch Name Generator Online",
    seoDescription: "Generate safely quoted Git commands and branch names or parse HTTPS and SSH repository URLs.",
    related: ["git-cheatsheet", "ssh-key-generator", "text-diff"],
    faq: [{ question: "Are commands executed?", answer: "No. The workbench only generates text for you to review and copy." }],
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
    description: "Inspect IPv4, IPv6, CIDR ranges, subnet masks, MAC formats, and URL components locally.",
    keywords: ["ipv4", "ipv6", "cidr", "subnet", "ip range", "mac", "url parser", "network"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "IP CIDR Subnet, MAC & URL Calculator",
    seoDescription: "Calculate IPv4 and IPv6 networks, subnet ranges, MAC formats, and URL components in your browser.",
    related: ["http-status-reference", "curl-parser", "api-request-builder"],
    faq: [{ question: "Does this query an IP database?", answer: "No. Address parsing and subnet calculations are mathematical and run locally." }],
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
    description: "Build cURL, Fetch, and Axios requests or send them directly from your browser with strict limits.",
    keywords: ["api", "rest", "http request", "tester", "curl", "fetch", "axios", "headers"],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: "API Request Builder & REST Tester Online",
    seoDescription: "Generate cURL, Fetch, and Axios code or test CORS-enabled APIs directly from your browser.",
    related: ["curl-generator", "curl-parser", "json-formatter"],
    faq: [
      { question: "Are requests proxied through this site?", answer: "No. Requests are sent by your browser and remain subject to the destination's CORS policy." },
      { question: "What safety limits apply?", answer: "Requests time out after 10 seconds and response bodies are limited to 1 MB." },
    ],
  },
  ...([
    ["linux-cheatsheet", "Linux Command Cheatsheet", "Linux Commands", "Terminal", 340, ["linux", "shell", "commands", "systemd", "files", "network"]],
    ["git-cheatsheet", "Git Command Cheatsheet", "Git Cheatsheet", "GitCommitHorizontal", 350, ["git", "commands", "branch", "diff", "reflog", "remote"]],
    ["docker-cheatsheet", "Docker Command Cheatsheet", "Docker Commands", "Container", 360, ["docker", "container", "image", "compose", "build", "logs"]],
    ["nginx-cheatsheet", "Nginx Configuration Cheatsheet", "Nginx Cheatsheet", "ServerCog", 370, ["nginx", "reverse proxy", "tls", "headers", "reload", "config"]],
  ] as const).map(([slug, name, shortName, icon, sortOrder, keywords]) => ({
    ...shared,
    id: slug,
    slug,
    name,
    shortName,
    category: "web" as const,
    icon,
    sortOrder,
    description: `Search practical ${name.replace(" Cheatsheet", "").replace(" Command", "")} commands and configuration snippets by task.`,
    keywords: [...keywords],
    maxInputSize: TOOL_LIMITS.text,
    seoTitle: `${name} — Searchable Reference`,
    seoDescription: `Search and copy practical ${shortName.toLowerCase()} by task with a fast local reference.`,
    related: slug === "git-cheatsheet" ? ["git-command-builder", "ssh-key-generator", "text-diff"] : ["git-cheatsheet", "network-calculator", "api-request-builder"],
    faq: [{ question: "Are commands executed automatically?", answer: "No. Entries are reference text that you can review and copy." }],
  })),
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
