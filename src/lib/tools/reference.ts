import mimeDb from "mime-db";

export interface MimeReference {
  type: string;
  extensions: string[];
  charset?: string;
  compressible?: boolean;
  source?: string;
}

const mimeReferences: MimeReference[] = Object.entries(mimeDb).map(
  ([type, entry]) => ({
    type,
    extensions: [...(entry.extensions ?? [])],
    ...(entry.charset ? { charset: entry.charset } : {}),
    ...(entry.compressible !== undefined
      ? { compressible: entry.compressible }
      : {}),
    ...(entry.source ? { source: entry.source } : {}),
  }),
);

export function lookupMimeTypes(query: string, limit = 50): MimeReference[] {
  const normalized = query.trim().toLowerCase().replace(/^\./, "");
  if (!normalized) return mimeReferences.slice(0, limit);
  return mimeReferences
    .map((item) => {
      const exactType = item.type === normalized;
      const exactExtension = item.extensions.includes(normalized);
      const typeStarts = item.type.startsWith(normalized);
      const extensionStarts = item.extensions.some((extension) =>
        extension.startsWith(normalized),
      );
      const includes =
        item.type.includes(normalized) ||
        item.extensions.some((extension) => extension.includes(normalized));
      const score = exactType
        ? 10
        : exactExtension
          ? 9
          : typeStarts
            ? 6
            : extensionStarts
              ? 5
              : includes
                ? 2
                : 0;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.type.localeCompare(b.item.type))
    .slice(0, limit)
    .map(({ item }) => item);
}

export interface HttpStatusReference {
  code: number;
  name: string;
  description: string;
}

export const HTTP_STATUS_CODES: HttpStatusReference[] = [
  {
    code: 100,
    name: "Continue",
    description: "The client may continue the request.",
  },
  {
    code: 101,
    name: "Switching Protocols",
    description: "The server is switching protocols as requested.",
  },
  {
    code: 102,
    name: "Processing",
    description:
      "The server has accepted the request and is still processing it.",
  },
  {
    code: 103,
    name: "Early Hints",
    description:
      "Preliminary response headers are available before the final response.",
  },
  { code: 200, name: "OK", description: "The request succeeded." },
  {
    code: 201,
    name: "Created",
    description: "The request succeeded and created a resource.",
  },
  {
    code: 202,
    name: "Accepted",
    description: "The request was accepted for asynchronous processing.",
  },
  {
    code: 203,
    name: "Non-Authoritative Information",
    description: "Returned metadata was modified by a transforming proxy.",
  },
  {
    code: 204,
    name: "No Content",
    description: "The request succeeded with no response body.",
  },
  {
    code: 205,
    name: "Reset Content",
    description: "The client should reset the document view.",
  },
  {
    code: 206,
    name: "Partial Content",
    description: "The response contains the requested byte range.",
  },
  {
    code: 207,
    name: "Multi-Status",
    description:
      "The response contains status information for multiple resources.",
  },
  {
    code: 208,
    name: "Already Reported",
    description:
      "Members were already reported earlier in this WebDAV response.",
  },
  {
    code: 226,
    name: "IM Used",
    description: "The response represents one or more instance manipulations.",
  },
  {
    code: 300,
    name: "Multiple Choices",
    description: "Multiple representations or destinations are available.",
  },
  {
    code: 301,
    name: "Moved Permanently",
    description: "The resource has a new permanent URL.",
  },
  {
    code: 302,
    name: "Found",
    description: "The resource is temporarily available at another URL.",
  },
  {
    code: 303,
    name: "See Other",
    description: "Retrieve the result using GET at another URL.",
  },
  {
    code: 304,
    name: "Not Modified",
    description: "The cached representation is still valid.",
  },
  {
    code: 307,
    name: "Temporary Redirect",
    description:
      "Repeat the request at another URL without changing the method.",
  },
  {
    code: 308,
    name: "Permanent Redirect",
    description:
      "Permanently repeat the request at another URL without changing the method.",
  },
  {
    code: 400,
    name: "Bad Request",
    description: "The server cannot process malformed request syntax or data.",
  },
  {
    code: 401,
    name: "Unauthorized",
    description: "Authentication is required or has failed.",
  },
  {
    code: 402,
    name: "Payment Required",
    description: "Reserved for payment-related use.",
  },
  {
    code: 403,
    name: "Forbidden",
    description: "The server understood the request but refuses it.",
  },
  {
    code: 404,
    name: "Not Found",
    description: "The requested resource was not found.",
  },
  {
    code: 405,
    name: "Method Not Allowed",
    description: "The HTTP method is not allowed for this resource.",
  },
  {
    code: 406,
    name: "Not Acceptable",
    description: "No available representation satisfies content negotiation.",
  },
  {
    code: 407,
    name: "Proxy Authentication Required",
    description: "Authentication with the proxy is required.",
  },
  {
    code: 408,
    name: "Request Timeout",
    description: "The server timed out waiting for the request.",
  },
  {
    code: 409,
    name: "Conflict",
    description: "The request conflicts with the current resource state.",
  },
  {
    code: 410,
    name: "Gone",
    description: "The resource is permanently unavailable.",
  },
  {
    code: 411,
    name: "Length Required",
    description: "A Content-Length header is required.",
  },
  {
    code: 412,
    name: "Precondition Failed",
    description: "A request precondition evaluated to false.",
  },
  {
    code: 413,
    name: "Content Too Large",
    description: "The request body exceeds the server limit.",
  },
  {
    code: 414,
    name: "URI Too Long",
    description: "The request target is longer than the server accepts.",
  },
  {
    code: 415,
    name: "Unsupported Media Type",
    description: "The request media type is not supported.",
  },
  {
    code: 416,
    name: "Range Not Satisfiable",
    description: "The requested byte range cannot be served.",
  },
  {
    code: 417,
    name: "Expectation Failed",
    description: "The server cannot meet the Expect header requirements.",
  },
  {
    code: 418,
    name: "I'm a Teapot",
    description: "The server refuses to brew coffee because it is a teapot.",
  },
  {
    code: 421,
    name: "Misdirected Request",
    description:
      "The request was sent to a server unable to answer for this authority.",
  },
  {
    code: 422,
    name: "Unprocessable Content",
    description:
      "The syntax is valid but the instructions cannot be processed.",
  },
  { code: 423, name: "Locked", description: "The target resource is locked." },
  {
    code: 424,
    name: "Failed Dependency",
    description: "The request failed because a dependent action failed.",
  },
  {
    code: 425,
    name: "Too Early",
    description: "The server will not risk processing a replayable request.",
  },
  {
    code: 426,
    name: "Upgrade Required",
    description: "The client must switch to a different protocol.",
  },
  {
    code: 428,
    name: "Precondition Required",
    description: "The server requires the request to be conditional.",
  },
  {
    code: 429,
    name: "Too Many Requests",
    description: "The client exceeded a request rate limit.",
  },
  {
    code: 431,
    name: "Request Header Fields Too Large",
    description: "Request headers exceed the server limit.",
  },
  {
    code: 451,
    name: "Unavailable For Legal Reasons",
    description: "Legal restrictions prevent access to the resource.",
  },
  {
    code: 500,
    name: "Internal Server Error",
    description: "An unexpected server condition prevented completion.",
  },
  {
    code: 501,
    name: "Not Implemented",
    description: "The server does not support the required functionality.",
  },
  {
    code: 502,
    name: "Bad Gateway",
    description: "An upstream server returned an invalid response.",
  },
  {
    code: 503,
    name: "Service Unavailable",
    description: "The server is temporarily unable to handle the request.",
  },
  {
    code: 504,
    name: "Gateway Timeout",
    description: "An upstream server did not respond in time.",
  },
  {
    code: 505,
    name: "HTTP Version Not Supported",
    description: "The request HTTP version is not supported.",
  },
  {
    code: 506,
    name: "Variant Also Negotiates",
    description:
      "Content negotiation configuration created a circular reference.",
  },
  {
    code: 507,
    name: "Insufficient Storage",
    description:
      "The server cannot store the representation needed for the request.",
  },
  {
    code: 508,
    name: "Loop Detected",
    description:
      "The server detected an infinite loop while processing the request.",
  },
  {
    code: 510,
    name: "Not Extended",
    description: "Additional extensions are required to fulfill the request.",
  },
  {
    code: 511,
    name: "Network Authentication Required",
    description: "Network access authentication is required.",
  },
];

export function statusClass(code: number): string {
  if (code < 200) return "Informational";
  if (code < 300) return "Success";
  if (code < 400) return "Redirection";
  if (code < 500) return "Client error";
  return "Server error";
}

export function lookupHttpStatuses(
  query: string,
  statusGroup: "all" | "1xx" | "2xx" | "3xx" | "4xx" | "5xx" = "all",
): HttpStatusReference[] {
  const normalized = query.trim().toLowerCase();
  return HTTP_STATUS_CODES.filter((status) => {
    const groupMatches =
      statusGroup === "all" ||
      Math.floor(status.code / 100) === Number(statusGroup[0]);
    const queryMatches =
      !normalized ||
      String(status.code).includes(normalized) ||
      status.name.toLowerCase().includes(normalized) ||
      status.description.toLowerCase().includes(normalized) ||
      statusClass(status.code).toLowerCase().includes(normalized);
    return groupMatches && queryMatches;
  });
}
