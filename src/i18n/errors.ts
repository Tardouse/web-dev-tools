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
    "Enter a valid HEX, RGB, HSL, HSV, or CMYK color value.":
      messages.errors.invalidColor,
    "Invalid color input.": messages.errors.invalidColor,
    "No QR code was found in this image.": messages.errors.qrScanNoCode,
    "Color hues must be between 0 and 360 degrees.":
      messages.errors.colorHueRange,
    "Color percentages must be between 0% and 100%.":
      messages.errors.colorPercentageRange,
    "This expression contains nested quantifiers that may cause excessive backtracking.":
      messages.errors.regexUnsafe,
    "Original JSON is required.": messages.errors.originalJsonRequired,
    "Changed JSON is required.": messages.errors.changedJsonRequired,
    "The cURL command contains an unclosed quote.": messages.errors.curlQuote,
    "The command must start with curl.": messages.errors.curlStart,
    "No request URL was found.": messages.errors.curlNoUrl,
    "cURL headers must use the Name: Value format.":
      messages.errors.curlHeaderFormat,
    "cURL field values cannot contain line breaks.":
      messages.errors.curlLineBreak,
    "HTTP methods can only contain letters, numbers, and hyphens.":
      messages.errors.curlMethod,
    "Put URL query values in the Query Parameters section.":
      messages.errors.curlQuerySection,
    "cURL entry names are required.": messages.errors.curlEntryName,
    "cURL header and cookie names may only contain valid HTTP token characters.":
      messages.errors.curlTokenName,
    "Basic Auth usernames cannot contain a colon.":
      messages.errors.curlBasicUsername,
    "The request URL is invalid.": messages.errors.invalidUrl,
    "Enter a request URL.": messages.errors.enterUrl,
    "Enter a valid absolute URL.": messages.errors.absoluteUrl,
    "Enter a timestamp or date.": messages.errors.timestampRequired,
    "Enter a valid Unix timestamp, ISO date, or local date.":
      messages.errors.timestampInvalid,
    "Enter a cron expression.": messages.errors.cronRequired,
    "This expression has no upcoming runs.": messages.errors.cronNoRuns,
    "Enter a non-negative finite data size.": messages.errors.dataSizeInvalid,
    "The data size is too large to convert.": messages.errors.dataSizeLarge,
    "The first line number must be a non-negative integer.":
      messages.errors.lineNumberStart,
    "The line number range is too large.": messages.errors.lineNumberRange,
    "Enter a custom delimiter before splitting text.":
      messages.errors.delimiterRequired,
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
      /^Regex replacements are limited to (\d+) characters\.$/,
      (m) =>
        interpolate(messages.errors.regexReplacementLength, { limit: m[1] }),
    ],
    [
      /^Regex replacements are limited to (\d+) matches\.$/,
      (m) =>
        interpolate(messages.errors.regexReplacementMatches, { limit: m[1] }),
    ],
    [
      /^Original JSON is invalid: (.+)$/s,
      (m) => interpolate(messages.errors.originalJsonInvalid, { detail: m[1] }),
    ],
    [
      /^Changed JSON is invalid: (.+)$/s,
      (m) => interpolate(messages.errors.changedJsonInvalid, { detail: m[1] }),
    ],
    [
      /^The (.+) option requires a value\.$/,
      (m) => interpolate(messages.errors.curlOptionValue, { option: m[1] }),
    ],
    [
      /^cURL requests are limited to (\d+) entries per section\.$/,
      (m) => interpolate(messages.errors.curlEntryLimit, { limit: m[1] }),
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
