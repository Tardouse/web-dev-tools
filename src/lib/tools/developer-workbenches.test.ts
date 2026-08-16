import { describe, expect, it } from "vitest";
import {
  decodeHtmlEntities,
  encodeHtmlEntities,
  formatSqlQuery,
  formatWebCode,
  minifyWebCode,
} from "./code-workbench";
import { cheatsheets, searchCheatsheet } from "./cheatsheets";
import {
  analyzeNetworkValue,
  generateApiSnippet,
  generateBranchName,
  generateGitCommand,
  parseGitRemote,
  parseHeaderLines,
} from "./developer-tools";

describe("web and SQL workbenches", () => {
  it("formats and minifies parser-backed web languages", async () => {
    await expect(
      formatWebCode("<main><h1>Hello</h1></main>", "html"),
    ).resolves.toContain("<h1>Hello</h1>");
    await expect(
      formatWebCode(".app{display:grid;color:red}", "css"),
    ).resolves.toContain("display: grid");
    await expect(
      formatWebCode("const answer=40+2", "javascript"),
    ).resolves.toContain("const answer = 40 + 2;");
    await expect(
      minifyWebCode("const answer = 40 + 2;", "javascript"),
    ).resolves.toBe("const answer=42;");
    await expect(minifyWebCode(".app { color: red; }", "css")).resolves.toBe(
      ".app{color:red}",
    );
    await expect(
      minifyWebCode("<main>  <!-- note --> <h1>Hello</h1> </main>", "html"),
    ).resolves.toBe("<main> <h1>Hello</h1> </main>");
  });

  it("round-trips HTML entities and formats SQL dialects", () => {
    const html = '<p title="x">Tom & Jerry</p>';
    expect(decodeHtmlEntities(encodeHtmlEntities(html))).toBe(html);
    expect(decodeHtmlEntities("&#x4F60;&#22909;&nbsp;")).toBe("你好\u00a0");
    expect(
      formatSqlQuery(
        "select id,name from users where active=true",
        "postgresql",
      ),
    ).toContain("SELECT\n  id,");
    expect(() => formatSqlQuery("select (", "postgresql")).toThrow(
      /^Invalid SQL: Parse error/,
    );
  });
});

describe("Git and network workbenches", () => {
  it("generates quoted Git commands, branch names, and remote details", () => {
    expect(generateBranchName("feature", "Sprint 9 Developer Tools")).toBe(
      "feature/sprint-9-developer-tools",
    );
    expect(
      generateGitCommand({
        kind: "clone",
        repository: "https://github.com/acme/platform.git",
        branch: "release/next",
        reference: "",
      }),
    ).toBe(
      "git clone --branch 'release/next' 'https://github.com/acme/platform.git'",
    );
    expect(
      generateGitCommand({
        kind: "reset",
        repository: "",
        branch: "",
        reference: "origin/main",
      }),
    ).toBe("git reset --hard 'origin/main'");
    expect(
      generateGitCommand({
        kind: "rebase",
        repository: "",
        branch: "",
        reference: "main",
      }),
    ).toBe("git rebase 'main'");
    expect(
      generateGitCommand({
        kind: "cherry-pick",
        repository: "",
        branch: "",
        reference: "abc123, def456",
      }),
    ).toBe("git cherry-pick 'abc123' 'def456'");
    expect(parseGitRemote("git@github.com:acme/platform.git")).toMatchObject({
      protocol: "ssh",
      owner: "acme",
      repository: "platform",
      webUrl: "https://github.com/acme/platform",
    });
  });

  it("calculates IP networks and normalizes MAC and URL values", () => {
    expect(analyzeNetworkValue("192.168.10.42/24")).toMatchObject({
      network: "192.168.10.0/24",
      broadcast: "192.168.10.255",
      subnetMask: "255.255.255.0",
      firstHost: "192.168.10.1",
      lastHost: "192.168.10.254",
    });
    expect(analyzeNetworkValue("2001:db8::1/64")).toMatchObject({
      type: "IPV6",
      network: "2001:db8:0:0:0:0:0:0/64",
      addresses: "2^64",
    });
    expect(analyzeNetworkValue("02-42-ac-11-00-02")).toMatchObject({
      colon: "02:42:AC:11:00:02",
      locallyAdministered: "yes",
    });
    expect(
      analyzeNetworkValue("https://example.com:8443/api?q=tools#result"),
    ).toMatchObject({
      hostname: "example.com",
      port: "8443",
      pathname: "/api",
    });
  });
});

describe("API builder and command references", () => {
  it("parses headers and generates cURL, Fetch, and Axios requests", () => {
    const headers = parseHeaderLines(
      "Content-Type: application/json\nX-Request-ID: sprint-9",
    );
    const input = {
      method: "POST",
      url: "https://api.example.com/items",
      headers,
      body: '{"name":"demo"}',
    };
    expect(generateApiSnippet(input, "curl")).toContain(
      "-H 'X-Request-ID: sprint-9'",
    );
    expect(generateApiSnippet(input, "fetch")).toContain(
      '"body": "{\\"name\\":\\"demo\\"}"',
    );
    const axios = generateApiSnippet(input, "axios");
    expect(axios).toContain('"data": "{\\"name\\":\\"demo\\"}"');
    expect(axios).not.toContain('"body"');
    expect(() => parseHeaderLines("broken header")).toThrow(
      "Invalid header line",
    );
  });

  it("searches localized cheatsheet content", () => {
    expect(Object.keys(cheatsheets)).toHaveLength(12);
    expect(
      Object.values(cheatsheets).reduce(
        (total, entries) => total + entries.length,
        0,
      ),
    ).toBe(94);
    for (const entries of Object.values(cheatsheets)) {
      expect(entries.length).toBeGreaterThanOrEqual(6);
      expect(new Set(entries.map((entry) => entry.command)).size).toBe(
        entries.length,
      );
    }
    expect(searchCheatsheet("linux", "systemd")[0]?.command).toContain(
      "journalctl",
    );
    expect(searchCheatsheet("git", "历史")[0]?.command).toContain("git log");
    expect(searchCheatsheet("docker", "compose")[0]?.command).toContain(
      "docker compose",
    );
    expect(searchCheatsheet("nginx", "转发")[0]?.command).toContain(
      "proxy_pass",
    );
    expect(searchCheatsheet("vim", "逐项确认")[0]?.command).toContain(":%s/");
    expect(searchCheatsheet("regex", "单词边界")[0]?.command).toBe(
      "\\bword\\b",
    );
    expect(searchCheatsheet("bash", "pipefail")[0]?.command).toBe(
      "set -euo pipefail",
    );
    expect(searchCheatsheet("sql", "执行计划")[0]?.command).toContain(
      "EXPLAIN",
    );
    expect(searchCheatsheet("javascript", "异步")[0]?.command).toContain(
      "Promise.all",
    );
    expect(searchCheatsheet("python", "虚拟环境")[0]?.command).toContain(
      "venv",
    );
    expect(searchCheatsheet("http-status-code", "速率限制")[0]?.command).toBe(
      "429 Too Many Requests",
    );
    expect(searchCheatsheet("css", "响应式网格")[0]?.command).toContain(
      "auto-fit",
    );
  });
});
