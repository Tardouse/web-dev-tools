import ipaddr from "ipaddr.js";

export type GitCommandKind = "clone" | "reset" | "rebase" | "cherry-pick";

function shellQuote(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("A required value is empty.");
  return `'${trimmed.replaceAll("'", `'"'"'`)}'`;
}

export function generateBranchName(type: string, description: string): string {
  const prefix = type.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "feature";
  const slug = description
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  if (!slug) throw new Error("Branch description must contain letters or numbers.");
  return `${prefix}/${slug}`;
}

export function generateGitCommand(input: {
  kind: GitCommandKind;
  repository: string;
  branch: string;
  reference: string;
}): string {
  if (input.kind === "clone") {
    const branch = input.branch.trim()
      ? ` --branch ${shellQuote(input.branch)}`
      : "";
    return `git clone${branch} ${shellQuote(input.repository)}`;
  }
  if (input.kind === "reset") {
    return `git reset --hard ${shellQuote(input.reference || "HEAD")}`;
  }
  if (input.kind === "rebase") {
    return `git rebase ${shellQuote(input.reference || "main")}`;
  }
  const commits = input.reference
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  if (!commits.length) throw new Error("Enter at least one commit reference.");
  return `git cherry-pick ${commits.map(shellQuote).join(" ")}`;
}

export function parseGitRemote(value: string) {
  const input = value.trim();
  const scp = input.match(/^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/);
  let host = "";
  let owner = "";
  let repository = "";
  let protocol = "";
  if (scp) {
    [, host, owner, repository] = scp;
    protocol = "ssh";
  } else {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      throw new Error("Enter a valid HTTPS or SSH Git remote URL.");
    }
    if (!["http:", "https:", "ssh:", "git:"].includes(url.protocol)) {
      throw new Error("Unsupported Git remote protocol.");
    }
    [owner, repository] = url.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    host = url.hostname;
    protocol = url.protocol.replace(":", "");
  }
  if (!host || !owner || !repository) throw new Error("Git remote must include an owner and repository.");
  return {
    protocol,
    host,
    owner,
    repository,
    webUrl: `https://${host}/${owner}/${repository}`,
    httpsCloneUrl: `https://${host}/${owner}/${repository}.git`,
    sshCloneUrl: `git@${host}:${owner}/${repository}.git`,
  };
}

function ipv4Number(bytes: number[]): number {
  return bytes.reduce((value, byte) => (value * 256 + byte) >>> 0, 0);
}

function ipv4String(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

function binaryAddress(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(2).padStart(8, "0")).join("");
}

export function analyzeNetworkValue(value: string): Record<string, string | number> {
  const input = value.trim();
  if (!input) throw new Error("Enter an IP address, CIDR, MAC address, or URL.");
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(input)) {
    const url = new URL(input);
    return {
      type: "URL",
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      port: url.port || "default",
      pathname: url.pathname,
      query: url.search || "—",
      fragment: url.hash || "—",
      origin: url.origin,
    };
  }
  const isMac =
    /^(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(input) ||
    /^(?:[0-9a-f]{4}\.){2}[0-9a-f]{4}$/i.test(input) ||
    /^[0-9a-f]{12}$/i.test(input);
  const compactMac = input.replace(/[^0-9a-f]/gi, "").toUpperCase();
  if (isMac) {
    const octets = compactMac.match(/.{2}/g) ?? [];
    const first = Number.parseInt(octets[0] ?? "00", 16);
    return {
      type: "MAC",
      colon: octets.join(":"),
      hyphen: octets.join("-"),
      cisco: `${octets.slice(0, 2).join("")}.${octets.slice(2, 4).join("")}.${octets.slice(4).join("")}`,
      locallyAdministered: (first & 2) !== 0 ? "yes" : "no",
      multicast: (first & 1) !== 0 ? "yes" : "no",
    };
  }
  const hasPrefix = input.includes("/");
  const [address, prefix] = hasPrefix
    ? ipaddr.parseCIDR(input)
    : [ipaddr.parse(input), ipaddr.parse(input).kind() === "ipv4" ? 32 : 128];
  const bytes = address.toByteArray();
  const base = {
    type: address.kind().toUpperCase(),
    address: address.toString(),
    normalized: address.kind() === "ipv6" ? address.toNormalizedString() : address.toString(),
    prefix,
    range: address.range(),
    binary: binaryAddress(bytes),
  };
  if (address.kind() === "ipv6") {
    const networkBytes = bytes.map((byte, index) => {
      const remaining = prefix - index * 8;
      if (remaining >= 8) return byte;
      if (remaining <= 0) return 0;
      return byte & (0xff << (8 - remaining));
    });
    return {
      ...base,
      network: `${ipaddr.fromByteArray(networkBytes).toNormalizedString()}/${prefix}`,
      addresses: `2^${128 - prefix}`,
    };
  }
  const numeric = ipv4Number(bytes);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (numeric & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  return {
    ...base,
    integer: numeric,
    hexadecimal: `0x${numeric.toString(16).padStart(8, "0").toUpperCase()}`,
    subnetMask: ipv4String(mask),
    network: `${ipv4String(network)}/${prefix}`,
    broadcast: ipv4String(broadcast),
    firstHost: ipv4String(prefix >= 31 ? network : network + 1),
    lastHost: ipv4String(prefix >= 31 ? broadcast : broadcast - 1),
    addresses: 2 ** (32 - prefix),
  };
}

export interface ApiRequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

export function parseHeaderLines(value: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of value.split("\n")) {
    if (!line.trim()) continue;
    const separator = line.indexOf(":");
    if (separator <= 0) throw new Error(`Invalid header line: ${line}`);
    const name = line.slice(0, separator).trim();
    const headerValue = line.slice(separator + 1).trim();
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) throw new Error(`Invalid header name: ${name}`);
    if (/[\r\n]/.test(headerValue)) throw new Error(`Invalid header value: ${name}`);
    headers[name] = headerValue;
  }
  return headers;
}

export function generateApiSnippet(
  input: ApiRequestConfig,
  format: "curl" | "fetch" | "axios",
): string {
  const url = new URL(input.url);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP(S) URLs are supported.");
  const method = input.method.toUpperCase();
  const hasBody = input.body.length > 0 && method !== "GET" && method !== "HEAD";
  if (format === "curl") {
    const lineBreak = " \\" + "\n  ";
    const headers = Object.entries(input.headers)
      .map(
        ([name, value]) =>
          `${lineBreak}-H ${shellQuote(`${name}: ${value}`)}`,
      )
      .join("");
    const body = hasBody
      ? `${lineBreak}--data-raw ${shellQuote(input.body)}`
      : "";
    return `curl -X ${method}${headers}${body}${lineBreak}${shellQuote(url.toString())}`;
  }
  const options = {
    method,
    headers: input.headers,
    ...(hasBody ? { body: input.body } : {}),
  };
  if (format === "fetch") {
    return `const response = await fetch(${JSON.stringify(url.toString())}, ${JSON.stringify(options, null, 2)});\nconst data = await response.text();`;
  }
  return `const response = await axios(${JSON.stringify(
    {
      url: url.toString(),
      method,
      headers: input.headers,
      ...(hasBody ? { data: input.body } : {}),
    },
    null,
    2,
  )});`;
}
