import { TOOL_LIMITS, assertInputLimit } from "@/lib/config";

export interface CurlRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  data: string;
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
    } else if (character === "'" || character === '"') quote = character;
    else if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else current += character;
  }
  if (quote) throw new Error("The cURL command contains an unclosed quote.");
  if (current) tokens.push(current);
  return tokens;
}

export function parseCurl(command: string): CurlRequest {
  assertInputLimit(command, TOOL_LIMITS.text);
  const tokens = tokenize(command.trim());
  if (tokens[0] !== "curl")
    throw new Error("The command must start with curl.");
  let method = "GET";
  let url = "";
  let data = "";
  const headers: Record<string, string> = {};
  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "-X" || token === "--request")
      method = (tokens[++index] ?? "").toUpperCase();
    else if (token === "-H" || token === "--header") {
      const header = tokens[++index] ?? "";
      const separator = header.indexOf(":");
      if (separator > 0)
        headers[header.slice(0, separator).trim()] = header
          .slice(separator + 1)
          .trim();
    } else if (
      ["-d", "--data", "--data-raw", "--data-binary"].includes(token)
    ) {
      data = tokens[++index] ?? "";
      if (method === "GET") method = "POST";
    } else if (
      token === "-u" ||
      token === "--user" ||
      token === "-A" ||
      token === "--user-agent"
    )
      index += 1;
    else if (!token.startsWith("-") && !url) url = token;
  }
  if (!url) throw new Error("No request URL was found.");
  try {
    new URL(url);
  } catch {
    throw new Error("The request URL is invalid.");
  }
  return { method, url, headers, data };
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function generateCurl(request: CurlRequest): string {
  const url = request.url.trim();
  if (!url) throw new Error("Enter a request URL.");
  try {
    new URL(url);
  } catch {
    throw new Error("Enter a valid absolute URL.");
  }
  const lines = [
    `curl --request ${request.method.toUpperCase()} ${shellQuote(url)}`,
  ];
  for (const [name, value] of Object.entries(request.headers)) {
    if (name.trim())
      lines.push(`  --header ${shellQuote(`${name.trim()}: ${value}`)}`);
  }
  if (request.data) lines.push(`  --data-raw ${shellQuote(request.data)}`);
  return lines.join(" \\\n");
}

export function generateFetch(request: CurlRequest): string {
  const options: Record<string, unknown> = {
    method: request.method.toUpperCase(),
  };
  if (Object.keys(request.headers).length) options.headers = request.headers;
  if (request.data) options.body = request.data;
  return `const response = await fetch(${JSON.stringify(request.url)}, ${JSON.stringify(options, null, 2)});\nconst data = await response.json();`;
}
