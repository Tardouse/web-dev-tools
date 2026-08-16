import { interpolate, type Messages } from "@/i18n";

export function localizeToolError(message: string, messages: Messages): string {
  const exact: Record<string, string> = {
    "Enter JSON to continue.": messages.errors.enterJson,
    "Enter a valid Base64 string.": messages.errors.validBase64,
    "This Base64 value does not contain valid UTF-8 text.":
      messages.errors.invalidUtf8,
    "Enter Base64 data to continue.": messages.errors.enterBase64Data,
    "The data URL must contain Base64 data.": messages.errors.dataUrlBase64,
    "Enter valid Base64 file data.": messages.errors.validFileBase64,
    "The value contains an invalid percent-encoded sequence.":
      messages.errors.invalidPercent,
    "Enter a query string to continue.": messages.errors.enterQuery,
    "Enter a valid URL or query string.": messages.errors.validUrlOrQuery,
    "Enter valid Unicode escape sequences.": messages.errors.unicodeEscapes,
    "Unicode input contains an unpaired surrogate.":
      messages.errors.unicodeSurrogate,
    "ASCII only supports code points from 0 to 127.":
      messages.errors.asciiRange,
    "Enter ASCII codes as decimal, 0x hex, or 0b binary values.":
      messages.errors.asciiCodes,
    "Query strings are limited to 100 parameter rows.":
      messages.errors.queryRows,
    "A JWT must contain three dot-separated parts.": messages.errors.jwtParts,
    "JWT header or payload is not valid Base64URL JSON.":
      messages.errors.jwtInvalid,
    "Bases must be whole numbers from 2 to 36.": messages.errors.basesRange,
    "RGB channels must be between 0 and 255.": messages.errors.rgbRange,
    "Enter a HEX color such as #2563eb or an RGB value such as 37, 99, 235.":
      messages.errors.invalidColor,
    "This expression contains nested quantifiers that may cause excessive backtracking.":
      messages.errors.regexUnsafe,
    "The cURL command contains an unclosed quote.": messages.errors.curlQuote,
    "The command must start with curl.": messages.errors.curlStart,
    "No request URL was found.": messages.errors.curlNoUrl,
    "The request URL is invalid.": messages.errors.invalidUrl,
    "Enter a request URL.": messages.errors.enterUrl,
    "Enter a valid absolute URL.": messages.errors.absoluteUrl,
    "Enter a timestamp or date.": messages.errors.timestampRequired,
    "Enter a valid Unix timestamp, ISO date, or local date.":
      messages.errors.timestampInvalid,
    "Enter a cron expression.": messages.errors.cronRequired,
    "This expression has no upcoming runs.": messages.errors.cronNoRuns,
  };
  if (exact[message]) return exact[message];
  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [
      /^Input is (.+)\. The limit for this tool is (.+)\.$/,
      (m) =>
        interpolate(messages.errors.inputTooLarge, { size: m[1], limit: m[2] }),
    ],
    [
      /^Output is (.+)\. The limit for this tool is (.+)\.$/,
      (m) =>
        interpolate(messages.errors.outputTooLarge, {
          size: m[1],
          limit: m[2],
        }),
    ],
    [
      /^Tool execution exceeded the (.+) limit\.$/,
      (m) => interpolate(messages.errors.executionTimeout, { limit: m[1] }),
    ],
    [
      /^No more than (\d+) tool operations can run at once\.$/,
      (m) => interpolate(messages.errors.executionConcurrency, { limit: m[1] }),
    ],
    [
      /^Invalid JSON: (.+)$/s,
      (m) => interpolate(messages.errors.invalidJson, { detail: m[1] }),
    ],
    [
      /^JSON nesting exceeds the maximum depth of (\d+)\.$/,
      (m) => interpolate(messages.errors.jsonDepth, { depth: m[1] }),
    ],
    [
      /^JSON contains characters that XML 1\.0 cannot represent\.$/,
      () => messages.errors.xmlCharacters,
    ],
    [
      /^The input is not a valid base-(\d+) integer\.$/,
      (m) => interpolate(messages.errors.invalidBase, { base: m[1] }),
    ],
    [
      /^Regular expressions are limited to (\d+) characters\.$/,
      (m) => interpolate(messages.errors.regexLength, { limit: m[1] }),
    ],
    [
      /^Invalid cron expression: (.+)$/s,
      (m) => interpolate(messages.errors.cronInvalid, { detail: m[1] }),
    ],
  ];
  for (const [pattern, render] of patterns) {
    const match = message.match(pattern);
    if (match) return render(match);
  }
  return message;
}
