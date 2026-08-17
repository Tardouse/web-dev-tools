import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";
import { decodeBase64, encodeBase64 } from "./encoding";

export interface CurlEntry {
  name: string;
  value: string;
}

export interface CurlBodyField extends CurlEntry {
  kind: "text" | "file";
  contentType?: string;
}

export type CurlBodyType = "none" | "raw" | "form-urlencoded" | "multipart";

export interface CurlBody {
  type: CurlBodyType;
  text: string;
  fields: CurlBodyField[];
}

export interface CurlAuth {
  type: "none" | "basic" | "bearer";
  username: string;
  password: string;
  token: string;
}

export interface CurlRequest {
  method: string;
  url: string;
  headers: CurlEntry[];
  query: CurlEntry[];
  cookies: CurlEntry[];
  auth: CurlAuth;
  body: CurlBody;
}

export type CurlOutputFormat =
  | "curl"
  | "fetch"
  | "axios"
  | "python-requests"
  | "python-httpx"
  | "go"
  | "php"
  | "java"
  | "csharp"
  | "xhr";

export const CURL_OUTPUT_FORMATS: CurlOutputFormat[] = [
  "curl",
  "fetch",
  "axios",
  "python-requests",
  "python-httpx",
  "go",
  "php",
  "java",
  "csharp",
  "xhr",
];

const HTTP_TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const VALUE_OPTIONS = new Set([
  "--cacert",
  "--cert",
  "--connect-timeout",
  "--interface",
  "--key",
  "--max-time",
  "--output",
  "--proxy",
  "--proxy-user",
  "--resolve",
  "--retry",
  "--user-agent",
  "-A",
  "-e",
  "-o",
]);

function emptyAuth(): CurlAuth {
  return { type: "none", username: "", password: "", token: "" };
}

function emptyBody(): CurlBody {
  return { type: "none", text: "", fields: [] };
}

function tokenize(command: string): string[] {
  const normalized = command.replace(/\\\r?\n/g, " ");
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let escaped = false;
  for (const character of normalized) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      else current += character;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
    } else if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += character;
    }
  }
  if (quote) throw new Error("The cURL command contains an unclosed quote.");
  if (escaped) current += "\\";
  if (current) tokens.push(current);
  return tokens;
}

function optionValue(
  token: string,
  tokens: string[],
  index: number,
  short: string | null,
  long: string,
): { value: string; nextIndex: number } | null {
  if (token === long || (short && token === short)) {
    const value = tokens[index + 1];
    if (value === undefined)
      throw new Error(`The ${token} option requires a value.`);
    return { value, nextIndex: index + 1 };
  }
  if (token.startsWith(`${long}=`)) {
    return { value: token.slice(long.length + 1), nextIndex: index };
  }
  if (
    short &&
    !token.startsWith("--") &&
    token.startsWith(short) &&
    token.length > short.length
  ) {
    return { value: token.slice(short.length), nextIndex: index };
  }
  return null;
}

function addEntry<T>(entries: T[], entry: T): void {
  if (entries.length >= TOOL_LIMITS.maxCurlEntries) {
    throw new Error(
      `cURL requests are limited to ${TOOL_LIMITS.maxCurlEntries} entries per section.`,
    );
  }
  entries.push(entry);
}

function parseCookieHeader(value: string, cookies: CurlEntry[]): void {
  for (const part of value.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf("=");
    addEntry(cookies, {
      name: separator < 0 ? trimmed : trimmed.slice(0, separator).trim(),
      value: separator < 0 ? "" : trimmed.slice(separator + 1).trim(),
    });
  }
}

function parseAuthorization(value: string): CurlAuth | null {
  if (/^Bearer\s+/i.test(value)) {
    return {
      type: "bearer",
      username: "",
      password: "",
      token: value.replace(/^Bearer\s+/i, ""),
    };
  }
  if (/^Basic\s+/i.test(value)) {
    try {
      const decoded = decodeBase64(value.replace(/^Basic\s+/i, ""));
      const separator = decoded.indexOf(":");
      if (separator >= 0) {
        return {
          type: "basic",
          username: decoded.slice(0, separator),
          password: decoded.slice(separator + 1),
          token: "",
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}

function splitUrl(rawUrl: string): { url: string; query: CurlEntry[] } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("The request URL is invalid.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("The request URL is invalid.");
  }
  const query: CurlEntry[] = [];
  for (const [name, value] of parsed.searchParams) {
    addEntry(query, { name, value });
  }
  const hashless = rawUrl.split("#", 1)[0];
  const queryIndex = hashless.indexOf("?");
  return {
    url: queryIndex < 0 ? hashless : hashless.slice(0, queryIndex),
    query,
  };
}

function parseFormField(value: string, forceText = false): CurlBodyField {
  const separator = value.indexOf("=");
  const name = separator < 0 ? value : value.slice(0, separator);
  let fieldValue = separator < 0 ? "" : value.slice(separator + 1);
  if (
    !forceText &&
    (fieldValue.startsWith("@") || fieldValue.startsWith("<"))
  ) {
    fieldValue = fieldValue.slice(1);
    const segments = fieldValue.split(";");
    const path = segments.shift() ?? "";
    const type = segments
      .find((segment) => segment.startsWith("type="))
      ?.slice("type=".length);
    return { name, value: path, kind: "file", contentType: type };
  }
  return { name, value: fieldValue, kind: "text" };
}

function appendEncodedFields(value: string, fields: CurlBodyField[]): void {
  const parameters = new URLSearchParams(value);
  for (const [name, entryValue] of parameters) {
    addEntry(fields, { name, value: entryValue, kind: "text" });
  }
}

export function parseCurl(command: string): CurlRequest {
  assertInputLimit(command, TOOL_LIMITS.text);
  const tokens = tokenize(command.trim());
  if (tokens[0]?.toLowerCase() !== "curl") {
    throw new Error("The command must start with curl.");
  }

  let method = "GET";
  let explicitMethod = false;
  let rawUrl = "";
  let useGet = false;
  let auth = emptyAuth();
  const rawHeaders: CurlEntry[] = [];
  const cookies: CurlEntry[] = [];
  const extraQuery: CurlEntry[] = [];
  const dataOptions: Array<{ value: string; urlEncoded: boolean }> = [];
  const formFields: CurlBodyField[] = [];

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    let resolved = optionValue(token, tokens, index, "-X", "--request");
    if (resolved) {
      method = resolved.value.toUpperCase();
      explicitMethod = true;
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, "-H", "--header");
    if (resolved) {
      const separator = resolved.value.indexOf(":");
      if (separator <= 0) {
        throw new Error("cURL headers must use the Name: Value format.");
      }
      addEntry(rawHeaders, {
        name: resolved.value.slice(0, separator).trim(),
        value: resolved.value.slice(separator + 1).trim(),
      });
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, "-d", "--data");
    resolved ??= optionValue(token, tokens, index, null, "--data-raw");
    resolved ??= optionValue(token, tokens, index, null, "--data-binary");
    if (resolved) {
      dataOptions.push({ value: resolved.value, urlEncoded: false });
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, null, "--data-urlencode");
    if (resolved) {
      dataOptions.push({ value: resolved.value, urlEncoded: true });
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, "-F", "--form");
    if (resolved) {
      addEntry(formFields, parseFormField(resolved.value));
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, null, "--form-string");
    if (resolved) {
      addEntry(formFields, parseFormField(resolved.value, true));
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, "-u", "--user");
    if (resolved) {
      const separator = resolved.value.indexOf(":");
      auth = {
        type: "basic",
        username:
          separator < 0 ? resolved.value : resolved.value.slice(0, separator),
        password: separator < 0 ? "" : resolved.value.slice(separator + 1),
        token: "",
      };
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, null, "--oauth2-bearer");
    if (resolved) {
      auth = {
        type: "bearer",
        username: "",
        password: "",
        token: resolved.value,
      };
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, "-b", "--cookie");
    if (resolved) {
      parseCookieHeader(resolved.value, cookies);
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, null, "--url");
    if (resolved) {
      rawUrl = resolved.value;
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, null, "--url-query");
    if (resolved) {
      const field = parseFormField(resolved.value, true);
      addEntry(extraQuery, { name: field.name, value: field.value });
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, "-A", "--user-agent");
    if (resolved) {
      addEntry(rawHeaders, { name: "User-Agent", value: resolved.value });
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, "-e", "--referer");
    if (resolved) {
      addEntry(rawHeaders, { name: "Referer", value: resolved.value });
      index = resolved.nextIndex;
      continue;
    }
    resolved = optionValue(token, tokens, index, null, "--json");
    if (resolved) {
      dataOptions.push({ value: resolved.value, urlEncoded: false });
      if (
        !rawHeaders.some((entry) => entry.name.toLowerCase() === "content-type")
      ) {
        addEntry(rawHeaders, {
          name: "Content-Type",
          value: "application/json",
        });
      }
      if (!rawHeaders.some((entry) => entry.name.toLowerCase() === "accept")) {
        addEntry(rawHeaders, { name: "Accept", value: "application/json" });
      }
      index = resolved.nextIndex;
      continue;
    }
    if (token === "-G" || token === "--get") {
      useGet = true;
      method = "GET";
      continue;
    }
    if (token === "-I" || token === "--head") {
      method = "HEAD";
      explicitMethod = true;
      continue;
    }
    if (VALUE_OPTIONS.has(token)) {
      if (tokens[index + 1] === undefined) {
        throw new Error(`The ${token} option requires a value.`);
      }
      index += 1;
      continue;
    }
    if (
      Array.from(VALUE_OPTIONS).some((option) => token.startsWith(`${option}=`))
    ) {
      continue;
    }
    if (!token.startsWith("-") && !rawUrl) rawUrl = token;
  }

  if (!rawUrl) throw new Error("No request URL was found.");
  const split = splitUrl(rawUrl);
  const query = [...split.query, ...extraQuery];
  const headers: CurlEntry[] = [];
  for (const header of rawHeaders) {
    const lower = header.name.toLowerCase();
    if (lower === "cookie") {
      parseCookieHeader(header.value, cookies);
      continue;
    }
    if (lower === "authorization") {
      const parsedAuth = parseAuthorization(header.value);
      if (parsedAuth) {
        auth = parsedAuth;
        continue;
      }
    }
    addEntry(headers, header);
  }

  let body = emptyBody();
  if (formFields.length) {
    body = { type: "multipart", text: "", fields: formFields };
  } else if (dataOptions.length) {
    const combined = dataOptions.map((option) => option.value).join("&");
    if (useGet) {
      appendEncodedFields(combined, query as CurlBodyField[]);
    } else {
      const contentType = headers.find(
        (entry) => entry.name.toLowerCase() === "content-type",
      )?.value;
      const looksEncoded =
        dataOptions.every((option) => option.urlEncoded) ||
        /application\/x-www-form-urlencoded/i.test(contentType ?? "") ||
        (combined.includes("=") && !/^\s*[\[{]/.test(combined));
      if (looksEncoded) {
        const fields: CurlBodyField[] = [];
        appendEncodedFields(combined, fields);
        body = { type: "form-urlencoded", text: "", fields };
      } else {
        body = { type: "raw", text: combined, fields: [] };
      }
    }
  }
  if (!explicitMethod && !useGet && body.type !== "none") method = "POST";

  return normalizeCurlRequest({
    method,
    url: split.url,
    headers,
    query,
    cookies,
    auth,
    body,
  });
}

function safeLineValue(value: string): string {
  if (/[\r\n]/.test(value))
    throw new Error("cURL field values cannot contain line breaks.");
  return value;
}

function normalizeEntries(
  entries: CurlEntry[],
  kind: "header" | "query" | "cookie",
): CurlEntry[] {
  if (entries.length > TOOL_LIMITS.maxCurlEntries) {
    throw new Error(
      `cURL requests are limited to ${TOOL_LIMITS.maxCurlEntries} entries per section.`,
    );
  }
  return entries
    .filter((entry) => entry.name || entry.value)
    .map((entry) => {
      const name = kind === "query" ? entry.name : entry.name.trim();
      if (kind !== "query" && !name)
        throw new Error("cURL entry names are required.");
      if ((kind === "header" || kind === "cookie") && !HTTP_TOKEN.test(name)) {
        throw new Error(
          "cURL header and cookie names may only contain valid HTTP token characters.",
        );
      }
      return {
        name,
        value: kind === "query" ? entry.value : safeLineValue(entry.value),
      };
    });
}

export function normalizeCurlRequest(request: CurlRequest): CurlRequest {
  assertInputLimit(JSON.stringify(request), TOOL_LIMITS.text);
  const method = request.method.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9-]*$/.test(method)) {
    throw new Error(
      "HTTP methods can only contain letters, numbers, and hyphens.",
    );
  }
  const split = splitUrl(request.url.trim());
  if (split.query.length) {
    throw new Error("Put URL query values in the Query Parameters section.");
  }
  const auth: CurlAuth = {
    type: request.auth.type,
    username: safeLineValue(request.auth.username),
    password: safeLineValue(request.auth.password),
    token: safeLineValue(request.auth.token),
  };
  if (auth.type === "basic" && auth.username.includes(":")) {
    throw new Error("Basic Auth usernames cannot contain a colon.");
  }
  const fields = request.body.fields
    .filter((field) => field.name || field.value)
    .map((field) => ({
      name: safeLineValue(field.name.trim()),
      value: field.kind === "file" ? safeLineValue(field.value) : field.value,
      kind: field.kind,
      contentType: field.contentType
        ? safeLineValue(field.contentType)
        : undefined,
    }));
  if (fields.length > TOOL_LIMITS.maxCurlEntries) {
    throw new Error(
      `cURL requests are limited to ${TOOL_LIMITS.maxCurlEntries} entries per section.`,
    );
  }
  if (fields.some((field) => !field.name)) {
    throw new Error("cURL entry names are required.");
  }
  return {
    method,
    url: split.url,
    headers: normalizeEntries(request.headers, "header"),
    query: normalizeEntries(request.query, "query"),
    cookies: normalizeEntries(request.cookies, "cookie"),
    auth,
    body: {
      type: request.body.type,
      text: request.body.type === "raw" ? request.body.text : "",
      fields:
        request.body.type === "form-urlencoded" ||
        request.body.type === "multipart"
          ? fields
          : [],
    },
  };
}

function buildUrl(request: CurlRequest): string {
  const url = new URL(request.url);
  for (const entry of request.query)
    url.searchParams.append(entry.name, entry.value);
  return url.toString();
}

function setHeader(headers: CurlEntry[], name: string, value: string): void {
  const index = headers.findIndex(
    (entry) => entry.name.toLowerCase() === name.toLowerCase(),
  );
  if (index >= 0) headers[index] = { name, value };
  else headers.push({ name, value });
}

function hasHeader(headers: CurlEntry[], name: string): boolean {
  return headers.some(
    (entry) => entry.name.toLowerCase() === name.toLowerCase(),
  );
}

function codeHeaders(
  request: CurlRequest,
  multipartManaged = false,
): CurlEntry[] {
  const headers = request.headers.filter(
    (entry) => !multipartManaged || entry.name.toLowerCase() !== "content-type",
  );
  if (request.auth.type === "bearer") {
    setHeader(headers, "Authorization", `Bearer ${request.auth.token}`);
  } else if (request.auth.type === "basic") {
    setHeader(
      headers,
      "Authorization",
      `Basic ${encodeBase64(`${request.auth.username}:${request.auth.password}`)}`,
    );
  }
  if (request.cookies.length) {
    setHeader(
      headers,
      "Cookie",
      request.cookies.map((entry) => `${entry.name}=${entry.value}`).join("; "),
    );
  }
  if (
    request.body.type === "form-urlencoded" &&
    !hasHeader(headers, "Content-Type")
  ) {
    setHeader(headers, "Content-Type", "application/x-www-form-urlencoded");
  }
  return headers;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function renderCurl(request: CurlRequest): string {
  const lines = [
    `curl --request ${request.method} ${shellQuote(buildUrl(request))}`,
  ];
  const headers = request.headers.filter(
    (entry) =>
      request.body.type !== "multipart" ||
      entry.name.toLowerCase() !== "content-type",
  );
  for (const { name, value } of headers) {
    lines.push(`  --header ${shellQuote(`${name}: ${value}`)}`);
  }
  if (request.auth.type === "basic") {
    lines.push(
      `  --user ${shellQuote(`${request.auth.username}:${request.auth.password}`)}`,
    );
  } else if (request.auth.type === "bearer") {
    lines.push(`  --oauth2-bearer ${shellQuote(request.auth.token)}`);
  }
  if (request.cookies.length) {
    lines.push(
      `  --cookie ${shellQuote(
        request.cookies
          .map((entry) => `${entry.name}=${entry.value}`)
          .join("; "),
      )}`,
    );
  }
  if (request.body.type === "raw" && request.body.text) {
    lines.push(`  --data-raw ${shellQuote(request.body.text)}`);
  } else if (request.body.type === "form-urlencoded") {
    for (const field of request.body.fields) {
      lines.push(
        `  --data-urlencode ${shellQuote(`${field.name}=${field.value}`)}`,
      );
    }
  } else if (request.body.type === "multipart") {
    for (const field of request.body.fields) {
      const value =
        field.kind === "file"
          ? `${field.name}=@${field.value}${field.contentType ? `;type=${field.contentType}` : ""}`
          : `${field.name}=${field.value}`;
      lines.push(`  --form ${shellQuote(value)}`);
    }
  }
  return lines.join(" \\\n");
}

interface JavaScriptBody {
  imports: string[];
  setup: string[];
  expression: string | null;
}

function fileName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? "upload.bin";
}

function javascriptBody(request: CurlRequest): JavaScriptBody {
  if (request.body.type === "none") {
    return { imports: [], setup: [], expression: null };
  }
  if (request.body.type === "raw") {
    return {
      imports: [],
      setup: [],
      expression: JSON.stringify(request.body.text),
    };
  }
  if (request.body.type === "form-urlencoded") {
    return {
      imports: [],
      setup: [
        `const body = new URLSearchParams(${JSON.stringify(
          request.body.fields.map((field) => [field.name, field.value]),
          null,
          2,
        )});`,
      ],
      expression: "body",
    };
  }
  const setup = ["const formData = new FormData();"];
  const imports: string[] = [];
  let fileIndex = 0;
  for (const field of request.body.fields) {
    if (field.kind === "text") {
      setup.push(
        `formData.append(${JSON.stringify(field.name)}, ${JSON.stringify(field.value)});`,
      );
      continue;
    }
    fileIndex += 1;
    if (!imports.length)
      imports.push('import { readFile } from "node:fs/promises";');
    setup.push(
      `const file${fileIndex} = await readFile(${JSON.stringify(field.value)});`,
      `formData.append(${JSON.stringify(field.name)}, new Blob([file${fileIndex}], { type: ${JSON.stringify(field.contentType ?? "application/octet-stream")} }), ${JSON.stringify(fileName(field.value))});`,
    );
  }
  return { imports, setup, expression: "formData" };
}

function headerObject(headers: CurlEntry[]): Record<string, string> {
  return Object.fromEntries(headers.map((entry) => [entry.name, entry.value]));
}

function renderFetch(request: CurlRequest): string {
  const body = javascriptBody(request);
  const headers = codeHeaders(request, request.body.type === "multipart");
  const lines = [...body.imports];
  if (lines.length) lines.push("");
  lines.push(...body.setup);
  if (body.setup.length) lines.push("");
  lines.push(
    `const response = await fetch(${JSON.stringify(buildUrl(request))}, {`,
  );
  lines.push(`  method: ${JSON.stringify(request.method)},`);
  if (headers.length) {
    lines.push(
      `  headers: ${JSON.stringify(headerObject(headers), null, 2).replace(/\n/g, "\n  ")},`,
    );
  }
  if (body.expression) lines.push(`  body: ${body.expression},`);
  lines.push(
    "});",
    "response.ok || console.warn(response.status);",
    "const data = await response.text();",
    "console.log(data);",
  );
  return lines.join("\n");
}

function renderAxios(request: CurlRequest): string {
  const body = javascriptBody(request);
  const headers = codeHeaders(request, request.body.type === "multipart");
  const lines = ['import axios from "axios";', ...body.imports];
  lines.push("", ...body.setup);
  if (body.setup.length) lines.push("");
  lines.push("const response = await axios({");
  lines.push(`  method: ${JSON.stringify(request.method)},`);
  lines.push(`  url: ${JSON.stringify(buildUrl(request))},`);
  if (headers.length) {
    lines.push(
      `  headers: ${JSON.stringify(headerObject(headers), null, 2).replace(/\n/g, "\n  ")},`,
    );
  }
  if (body.expression) lines.push(`  data: ${body.expression},`);
  lines.push("});", "console.log(response.data);");
  return lines.join("\n");
}

function pythonString(value: string): string {
  return JSON.stringify(value).replace(/\\u2028|\\u2029/g, (match) =>
    match.toLowerCase(),
  );
}

function pythonPairs(entries: CurlEntry[]): string {
  return `[${entries
    .map(
      (entry) => `(${pythonString(entry.name)}, ${pythonString(entry.value)})`,
    )
    .join(", ")}]`;
}

function pythonHeaders(headers: CurlEntry[]): string {
  return `{${headers
    .map((entry) => `${pythonString(entry.name)}: ${pythonString(entry.value)}`)
    .join(", ")}}`;
}

function renderPython(
  request: CurlRequest,
  library: "requests" | "httpx",
): string {
  const headers = codeHeaders(request, request.body.type === "multipart");
  const lines = [`import ${library}`, ""];
  const argumentsList = [
    pythonString(request.method),
    pythonString(buildUrl(request)),
  ];
  if (headers.length) argumentsList.push(`headers=${pythonHeaders(headers)}`);
  const fileVariables: string[] = [];
  if (request.body.type === "raw") {
    argumentsList.push(
      `${library === "httpx" ? "content" : "data"}=${pythonString(request.body.text)}`,
    );
  } else if (request.body.type === "form-urlencoded") {
    argumentsList.push(`data=${pythonPairs(request.body.fields)}`);
  } else if (request.body.type === "multipart") {
    const parts: string[] = [];
    let fileIndex = 0;
    for (const field of request.body.fields) {
      if (field.kind === "text") {
        parts.push(
          `(${pythonString(field.name)}, (None, ${pythonString(field.value)}))`,
        );
      } else {
        fileIndex += 1;
        const variable = `file_${fileIndex}`;
        fileVariables.push(variable);
        lines.push(`${variable} = open(${pythonString(field.value)}, "rb")`);
        parts.push(
          `(${pythonString(field.name)}, (${pythonString(fileName(field.value))}, ${variable}, ${pythonString(field.contentType ?? "application/octet-stream")}))`,
        );
      }
    }
    argumentsList.push(`files=[${parts.join(", ")}]`);
  }
  if (fileVariables.length) lines.push("", "try:");
  const indent = fileVariables.length ? "    " : "";
  lines.push(
    `${indent}response = ${library}.request(${argumentsList.join(", ")})`,
    `${indent}response.raise_for_status()`,
    `${indent}print(response.text)`,
  );
  if (fileVariables.length) {
    lines.push("finally:");
    for (const variable of fileVariables) lines.push(`    ${variable}.close()`);
  }
  return lines.join("\n");
}

function goString(value: string): string {
  return JSON.stringify(value);
}

function formEncoded(fields: CurlBodyField[]): string {
  const parameters = new URLSearchParams();
  for (const field of fields) parameters.append(field.name, field.value);
  return parameters.toString();
}

function renderGo(request: CurlRequest): string {
  const multipart = request.body.type === "multipart";
  const imports = new Set(["fmt", "io", "net/http", "os"]);
  if (request.body.type === "raw" || request.body.type === "form-urlencoded") {
    imports.add("strings");
  }
  if (multipart) {
    imports.add("bytes");
    imports.add("mime/multipart");
    imports.add("path/filepath");
  }
  const lines = ["package main", "", "import ("];
  for (const name of Array.from(imports).sort())
    lines.push(`\t${goString(name)}`);
  lines.push(")", "", "func main() {");
  if (request.body.type === "raw") {
    lines.push(`\tbody := strings.NewReader(${goString(request.body.text)})`);
  } else if (request.body.type === "form-urlencoded") {
    lines.push(
      `\tbody := strings.NewReader(${goString(formEncoded(request.body.fields))})`,
    );
  } else if (multipart) {
    lines.push(
      "\tvar bodyBuffer bytes.Buffer",
      "\tmultipartWriter := multipart.NewWriter(&bodyBuffer)",
    );
    let fileIndex = 0;
    for (const field of request.body.fields) {
      if (field.kind === "text") {
        lines.push(
          `\tif err := multipartWriter.WriteField(${goString(field.name)}, ${goString(field.value)}); err != nil { panic(err) }`,
        );
      } else {
        fileIndex += 1;
        lines.push(
          `\tfile${fileIndex}, err := os.Open(${goString(field.value)})`,
          "\tif err != nil { panic(err) }",
          `\tdefer file${fileIndex}.Close()`,
          `\tpart${fileIndex}, err := multipartWriter.CreateFormFile(${goString(field.name)}, filepath.Base(${goString(field.value)}))`,
          "\tif err != nil { panic(err) }",
          `\tif _, err = io.Copy(part${fileIndex}, file${fileIndex}); err != nil { panic(err) }`,
        );
      }
    }
    lines.push(
      "\tif err := multipartWriter.Close(); err != nil { panic(err) }",
      "\tbody := &bodyBuffer",
    );
  } else {
    lines.push("\tvar body io.Reader");
  }
  lines.push(
    `\trequest, err := http.NewRequest(${goString(request.method)}, ${goString(buildUrl(request))}, body)`,
    "\tif err != nil { panic(err) }",
  );
  const headers = codeHeaders(request, multipart);
  for (const header of headers) {
    lines.push(
      `\trequest.Header.Add(${goString(header.name)}, ${goString(header.value)})`,
    );
  }
  if (multipart) {
    lines.push(
      '\trequest.Header.Set("Content-Type", multipartWriter.FormDataContentType())',
    );
  }
  lines.push(
    "\tresponse, err := http.DefaultClient.Do(request)",
    "\tif err != nil { panic(err) }",
    "\tdefer response.Body.Close()",
    "\tfmt.Println(response.Status)",
    "\tif _, err = io.Copy(os.Stdout, response.Body); err != nil { panic(err) }",
    "}",
  );
  return lines.join("\n");
}

function phpString(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function renderPhp(request: CurlRequest): string {
  const multipart = request.body.type === "multipart";
  const headers = codeHeaders(request, multipart);
  const lines = [
    "<?php",
    `$curl = curl_init(${phpString(buildUrl(request))});`,
  ];
  if (request.body.type === "raw") {
    lines.push(`$body = ${phpString(request.body.text)};`);
  } else if (request.body.type === "form-urlencoded") {
    lines.push(`$body = ${phpString(formEncoded(request.body.fields))};`);
  } else if (multipart) {
    lines.push("$body = [");
    for (const field of request.body.fields) {
      const value =
        field.kind === "file"
          ? `new CURLFile(${phpString(field.value)}, ${phpString(field.contentType ?? "application/octet-stream")}, ${phpString(fileName(field.value))})`
          : phpString(field.value);
      lines.push(`    ${phpString(field.name)} => ${value},`);
    }
    lines.push("];\n");
  }
  lines.push("curl_setopt_array($curl, [");
  lines.push(`    CURLOPT_CUSTOMREQUEST => ${phpString(request.method)},`);
  lines.push("    CURLOPT_RETURNTRANSFER => true,");
  if (headers.length) {
    lines.push("    CURLOPT_HTTPHEADER => [");
    for (const header of headers) {
      lines.push(`        ${phpString(`${header.name}: ${header.value}`)},`);
    }
    lines.push("    ],");
  }
  if (request.body.type !== "none")
    lines.push("    CURLOPT_POSTFIELDS => $body,");
  lines.push(
    "]);",
    "$response = curl_exec($curl);",
    "if ($response === false) {",
    "    throw new RuntimeException(curl_error($curl));",
    "}",
    "curl_close($curl);",
    "echo $response;",
  );
  return lines.join("\n");
}

function javaString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")}"`;
}

function renderJava(request: CurlRequest): string {
  const multipart = request.body.type === "multipart";
  const imports = [
    "java.net.URI",
    "java.net.http.HttpClient",
    "java.net.http.HttpRequest",
    "java.net.http.HttpResponse",
    "java.nio.charset.StandardCharsets",
  ];
  if (multipart) {
    imports.push(
      "java.nio.file.Files",
      "java.nio.file.Path",
      "java.util.ArrayList",
      "java.util.List",
      "java.util.UUID",
    );
  }
  const lines = imports.map((name) => `import ${name};`);
  lines.push(
    "",
    "public class Main {",
    "  public static void main(String[] args) throws Exception {",
  );
  if (request.body.type === "raw") {
    lines.push(
      `    HttpRequest.BodyPublisher body = HttpRequest.BodyPublishers.ofString(${javaString(request.body.text)});`,
    );
  } else if (request.body.type === "form-urlencoded") {
    lines.push(
      `    HttpRequest.BodyPublisher body = HttpRequest.BodyPublishers.ofString(${javaString(formEncoded(request.body.fields))});`,
    );
  } else if (multipart) {
    lines.push(
      '    String boundary = "----DevToolbox" + UUID.randomUUID();',
      "    List<byte[]> parts = new ArrayList<>();",
    );
    for (const field of request.body.fields) {
      if (field.kind === "text") {
        const part = `--${"${boundary}"}\\r\\nContent-Disposition: form-data; name=\\"${field.name}\\"\\r\\n\\r\\n${field.value}\\r\\n`;
        lines.push(
          `    parts.add(${javaString(part).replace(`"--\${boundary}`, `"--" + boundary + "`)}.getBytes(StandardCharsets.UTF_8));`,
        );
      } else {
        const header = `--${"${boundary}"}\\r\\nContent-Disposition: form-data; name=\\"${field.name}\\"; filename=\\"${fileName(field.value)}\\"\\r\\nContent-Type: ${field.contentType ?? "application/octet-stream"}\\r\\n\\r\\n`;
        lines.push(
          `    parts.add(${javaString(header).replace(`"--\${boundary}`, `"--" + boundary + "`)}.getBytes(StandardCharsets.UTF_8));`,
          `    parts.add(Files.readAllBytes(Path.of(${javaString(field.value)})));`,
          '    parts.add("\\r\\n".getBytes(StandardCharsets.UTF_8));',
        );
      }
    }
    lines.push(
      '    parts.add(("--" + boundary + "--\\r\\n").getBytes(StandardCharsets.UTF_8));',
      "    HttpRequest.BodyPublisher body = HttpRequest.BodyPublishers.ofByteArrays(parts);",
    );
  } else {
    lines.push(
      "    HttpRequest.BodyPublisher body = HttpRequest.BodyPublishers.noBody();",
    );
  }
  lines.push(
    `    HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(${javaString(buildUrl(request))}))`,
    `        .method(${javaString(request.method)}, body);`,
  );
  const headers = codeHeaders(request, multipart);
  for (const header of headers) {
    lines.push(
      `    builder.header(${javaString(header.name)}, ${javaString(header.value)});`,
    );
  }
  if (multipart) {
    lines.push(
      '    builder.header("Content-Type", "multipart/form-data; boundary=" + boundary);',
    );
  }
  lines.push(
    "    HttpClient client = HttpClient.newHttpClient();",
    "    HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());",
    "    System.out.println(response.statusCode());",
    "    System.out.println(response.body());",
    "  }",
    "}",
  );
  return lines.join("\n");
}

function csharpString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")}"`;
}

function renderCsharp(request: CurlRequest): string {
  const multipart = request.body.type === "multipart";
  const lines = [
    "using System;",
    "using System.Collections.Generic;",
    "using System.IO;",
    "using System.Net.Http;",
    "using System.Text;",
    "",
    "using var client = new HttpClient();",
    `using var request = new HttpRequestMessage(new HttpMethod(${csharpString(request.method)}), ${csharpString(buildUrl(request))});`,
  ];
  if (request.body.type === "raw") {
    lines.push(
      `request.Content = new StringContent(${csharpString(request.body.text)}, Encoding.UTF8);`,
    );
  } else if (request.body.type === "form-urlencoded") {
    lines.push("request.Content = new FormUrlEncodedContent(new[]", "{");
    for (const field of request.body.fields) {
      lines.push(
        `    new KeyValuePair<string, string>(${csharpString(field.name)}, ${csharpString(field.value)}),`,
      );
    }
    lines.push("});");
  } else if (multipart) {
    lines.push("var multipart = new MultipartFormDataContent();");
    let fileIndex = 0;
    for (const field of request.body.fields) {
      if (field.kind === "text") {
        lines.push(
          `multipart.Add(new StringContent(${csharpString(field.value)}), ${csharpString(field.name)});`,
        );
      } else {
        fileIndex += 1;
        lines.push(
          `using var file${fileIndex} = File.OpenRead(${csharpString(field.value)});`,
          `var fileContent${fileIndex} = new StreamContent(file${fileIndex});`,
        );
        if (field.contentType) {
          lines.push(
            `fileContent${fileIndex}.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(${csharpString(field.contentType)});`,
          );
        }
        lines.push(
          `multipart.Add(fileContent${fileIndex}, ${csharpString(field.name)}, ${csharpString(fileName(field.value))});`,
        );
      }
    }
    lines.push("request.Content = multipart;");
  }
  const headers = codeHeaders(request, multipart);
  for (const header of headers) {
    lines.push(
      `if (!request.Headers.TryAddWithoutValidation(${csharpString(header.name)}, ${csharpString(header.value)}))`,
      `    request.Content?.Headers.TryAddWithoutValidation(${csharpString(header.name)}, ${csharpString(header.value)});`,
    );
  }
  lines.push(
    "using var response = await client.SendAsync(request);",
    "response.EnsureSuccessStatusCode();",
    "Console.WriteLine(await response.Content.ReadAsStringAsync());",
  );
  return lines.join("\n");
}

function renderXhr(request: CurlRequest): string {
  const lines: string[] = [];
  let bodyExpression = "null";
  if (request.body.type === "raw") {
    bodyExpression = JSON.stringify(request.body.text);
  } else if (request.body.type === "form-urlencoded") {
    lines.push(
      `const body = new URLSearchParams(${JSON.stringify(
        request.body.fields.map((field) => [field.name, field.value]),
        null,
        2,
      )});`,
      "",
    );
    bodyExpression = "body";
  } else if (request.body.type === "multipart") {
    lines.push("const formData = new FormData();");
    let fileIndex = 0;
    for (const field of request.body.fields) {
      if (field.kind === "text") {
        lines.push(
          `formData.append(${JSON.stringify(field.name)}, ${JSON.stringify(field.value)});`,
        );
      } else {
        fileIndex += 1;
        lines.push(
          `const fileInput${fileIndex} = document.querySelector(${JSON.stringify(`#file-${fileIndex}`)});`,
          `if (!fileInput${fileIndex}?.files?.[0]) throw new Error(${JSON.stringify(`Select ${fileName(field.value)} first.`)});`,
          `formData.append(${JSON.stringify(field.name)}, fileInput${fileIndex}.files[0], ${JSON.stringify(fileName(field.value))});`,
        );
      }
    }
    lines.push("");
    bodyExpression = "formData";
  }
  const headers = codeHeaders(
    request,
    request.body.type === "multipart",
  ).filter((header) => header.name.toLowerCase() !== "cookie");
  lines.push(
    "const data = await new Promise((resolve, reject) => {",
    "  const xhr = new XMLHttpRequest();",
    `  xhr.open(${JSON.stringify(request.method)}, ${JSON.stringify(buildUrl(request))});`,
  );
  for (const header of headers) {
    lines.push(
      `  xhr.setRequestHeader(${JSON.stringify(header.name)}, ${JSON.stringify(header.value)});`,
    );
  }
  if (request.cookies.length) {
    lines.push(
      "  xhr.withCredentials = true;",
      "  // Browsers use cookies already stored for the target origin.",
    );
  }
  lines.push(
    "  xhr.onload = () =>",
    "    xhr.status >= 200 && xhr.status < 300",
    "      ? resolve(xhr.responseText)",
    "      : reject(new Error(`HTTP ${xhr.status}`));",
    '  xhr.onerror = () => reject(new Error("Network request failed"));',
    `  xhr.send(${bodyExpression});`,
    "});",
    "console.log(data);",
  );
  return lines.join("\n");
}

export function generateRequestCode(
  request: CurlRequest,
  format: CurlOutputFormat,
): string {
  const normalized = normalizeCurlRequest(request);
  switch (format) {
    case "curl":
      return renderCurl(normalized);
    case "fetch":
      return renderFetch(normalized);
    case "axios":
      return renderAxios(normalized);
    case "python-requests":
      return renderPython(normalized, "requests");
    case "python-httpx":
      return renderPython(normalized, "httpx");
    case "go":
      return renderGo(normalized);
    case "php":
      return renderPhp(normalized);
    case "java":
      return renderJava(normalized);
    case "csharp":
      return renderCsharp(normalized);
    case "xhr":
      return renderXhr(normalized);
  }
}

export function generateCurl(request: CurlRequest): string {
  return generateRequestCode(request, "curl");
}

export function generateFetch(request: CurlRequest): string {
  return generateRequestCode(request, "fetch");
}
