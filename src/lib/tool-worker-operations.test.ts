import { packTar } from "modern-tar";
import { describe, expect, it } from "vitest";
import { executeToolWorkerRequest } from "./tool-worker-operations";
import type {
  DiffWorkerResult,
  NumberBaseWorkerResult,
} from "./tool-worker-protocol";
import type { LocalFileEntry } from "./tools/archive";

const encode = (value: string) => new TextEncoder().encode(value);
const decode = (value: Uint8Array) => new TextDecoder().decode(value);

describe("tool worker operations", () => {
  it("runs JSON, encoding, hashing, case, text, and JWT operations", async () => {
    await expect(
      executeToolWorkerRequest({
        operation: "json-format",
        input: '{"ok":true}',
        indent: 2,
      }),
    ).resolves.toContain('"ok": true');
    await expect(
      executeToolWorkerRequest({
        operation: "json-minify",
        input: '{ "ok": true }',
      }),
    ).resolves.toBe('{"ok":true}');
    await expect(
      executeToolWorkerRequest({
        operation: "json-validate",
        input: "[1,2]",
      }),
    ).resolves.toContain("Root type: array");
    await expect(
      executeToolWorkerRequest({
        operation: "json-to-yaml",
        input: '{"ready":true}',
      }),
    ).resolves.toContain("ready: true");
    await expect(
      executeToolWorkerRequest({
        operation: "json-to-xml",
        input: '{"ready":true}',
      }),
    ).resolves.toContain('<property name="ready" type="boolean">true');
    await expect(
      executeToolWorkerRequest({
        operation: "json-to-csv",
        input: '[{"name":"Ada"}]',
      }),
    ).resolves.toBe("name\nAda");
    await expect(
      executeToolWorkerRequest({
        operation: "json-tree",
        input: '{"items":[1,2]}',
      }),
    ).resolves.toMatchObject({ stats: { nodes: 4, maxDepth: 2 } });
    await expect(
      executeToolWorkerRequest({ operation: "base64-encode", input: "世界" }),
    ).resolves.toBe("5LiW55WM");
    await expect(
      executeToolWorkerRequest({
        operation: "base64-decode",
        input: "5LiW55WM",
      }),
    ).resolves.toBe("世界");
    await expect(
      executeToolWorkerRequest({ operation: "url-encode", input: "a b" }),
    ).resolves.toBe("a%20b");
    await expect(
      executeToolWorkerRequest({ operation: "url-decode", input: "a%20b" }),
    ).resolves.toBe("a b");
    await expect(
      executeToolWorkerRequest({
        operation: "hash",
        input: "abc",
        algorithm: "MD5",
      }),
    ).resolves.toBe("900150983cd24fb0d6963f7d28e17f72");
    await expect(
      executeToolWorkerRequest({
        operation: "case-convert",
        input: "hello world",
        mode: "camel",
      }),
    ).resolves.toBe("helloWorld");
    await expect(
      executeToolWorkerRequest({
        operation: "text-count",
        input: "Hello 世界",
      }),
    ).resolves.toMatchObject({
      characters: 8,
      chineseCharacters: 2,
      englishCharacters: 5,
      words: 2,
    });
    await expect(
      executeToolWorkerRequest({
        operation: "jwt-decode",
        input: "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjMifQ.signature",
      }),
    ).resolves.toMatchObject({ payload: { sub: "123" } });
  });

  it("runs data size and text processing operations inside the worker boundary", async () => {
    await expect(
      executeToolWorkerRequest({
        operation: "data-size-convert",
        input: "1",
        unit: "GiB",
      }),
    ).resolves.toMatchObject({
      bytes: 1_073_741_824,
      values: { MiB: 1024, GB: 1.073741824 },
    });
    await expect(
      executeToolWorkerRequest({
        operation: "line-clean",
        input: "Alpha\n\nalpha\nBeta",
        options: {
          removeBlank: true,
          removeDuplicates: true,
          trimLines: false,
          caseSensitive: false,
        },
      }),
    ).resolves.toBe("Alpha\nBeta");
    await expect(
      executeToolWorkerRequest({
        operation: "line-sort",
        input: "item10\nitem2",
        options: {
          mode: "natural",
          descending: false,
          caseSensitive: true,
          locale: "en-US",
        },
      }),
    ).resolves.toBe("item2\nitem10");
    await expect(
      executeToolWorkerRequest({
        operation: "line-number",
        input: "one\ntwo",
        options: {
          action: "add",
          start: 1,
          pad: false,
          separator: "colon",
        },
      }),
    ).resolves.toBe("1: one\n2: two");
    await expect(
      executeToolWorkerRequest({
        operation: "text-deduplicate",
        input: "one two one",
        options: { mode: "words", caseSensitive: true },
      }),
    ).resolves.toBe("one two");
    await expect(
      executeToolWorkerRequest({
        operation: "text-merge",
        first: "A1\nA2",
        second: "B1\nB2",
        options: { mode: "interleave", separator: "\n" },
      }),
    ).resolves.toBe("A1\nB1\nA2\nB2");
    await expect(
      executeToolWorkerRequest({
        operation: "text-split",
        input: "one,two,,three",
        options: {
          mode: "comma",
          delimiter: "",
          trimParts: true,
          removeEmpty: true,
          output: "json",
        },
      }),
    ).resolves.toBe('[\n  "one",\n  "two",\n  "three"\n]');
  });

  it("formats web code and SQL inside the worker boundary", async () => {
    await expect(
      executeToolWorkerRequest({
        operation: "web-code",
        input: ".app{color:red;margin:0}",
        language: "css",
        action: "format",
      }),
    ).resolves.toContain("color: red");
    await expect(
      executeToolWorkerRequest({
        operation: "web-code",
        input: ".app { color: red; margin: 0; }",
        language: "css",
        action: "minify",
      }),
    ).resolves.toBe(".app{color:red;margin:0}");
    await expect(
      executeToolWorkerRequest({
        operation: "sql-format",
        input: "select id from users where active=1",
        dialect: "sql",
        keywordCase: "upper",
      }),
    ).resolves.toContain("SELECT");
  });

  it("runs extended encoding and URL operations inside the worker boundary", async () => {
    await expect(
      executeToolWorkerRequest({ operation: "base64-auto", input: "SGVsbG8=" }),
    ).resolves.toBe("Hello");
    const fileBase64 = await executeToolWorkerRequest({
      operation: "file-base64-encode",
      data: encode("worker file"),
      mimeType: "text/plain",
      dataUrl: true,
    });
    expect(fileBase64).toBe("data:text/plain;base64,d29ya2VyIGZpbGU=");
    const decodedFile = (await executeToolWorkerRequest({
      operation: "file-base64-decode",
      input: fileBase64 as string,
    })) as { data: Uint8Array; mimeType: string; source: string };
    expect(decodedFile).toMatchObject({
      mimeType: "text/plain",
      source: "data-url",
    });
    expect(Array.from(decodedFile.data)).toEqual(
      Array.from(encode("worker file")),
    );
    await expect(
      executeToolWorkerRequest({
        operation: "url-parse",
        input: "https://example.com/a?q=one&q=two",
      }),
    ).resolves.toContain('"q": [');
    await expect(
      executeToolWorkerRequest({
        operation: "query-parse",
        input: "?q=dev+tools",
      }),
    ).resolves.toContain('"q": "dev tools"');
    await expect(
      executeToolWorkerRequest({ operation: "unicode-encode", input: "世🚀" }),
    ).resolves.toBe("\\u4E16\\u{1F680}");
    await expect(
      executeToolWorkerRequest({
        operation: "unicode-decode",
        input: "\\u4E16\\u{1F680}",
      }),
    ).resolves.toBe("世🚀");
    await expect(
      executeToolWorkerRequest({
        operation: "ascii-encode",
        input: "AZ",
        base: "hex",
      }),
    ).resolves.toBe("0x41 0x5A");
    await expect(
      executeToolWorkerRequest({ operation: "ascii-decode", input: "65 90" }),
    ).resolves.toBe("AZ");
    await expect(
      executeToolWorkerRequest({ operation: "utf8-inspect", input: "A世" }),
    ).resolves.toMatchObject({ bytes: 4, codePoints: 2, multibyte: 1 });
  });

  it("computes regex, diff, and arbitrary-base results", async () => {
    const regex = await executeToolWorkerRequest({
      operation: "regex-test",
      pattern: "item-(\\d+)",
      flags: "g",
      input: "item-7 item-9",
      replacement: "product-$1",
    });
    expect(regex).toMatchObject({
      matches: [
        {
          value: "item-7",
          groups: [{ number: 1, name: null, value: "7" }],
        },
        {
          value: "item-9",
          groups: [{ number: 1, name: null, value: "9" }],
        },
      ],
      replacementResult: "product-7 product-9",
    });

    const diff = (await executeToolWorkerRequest({
      operation: "diff",
      before: "old\n",
      after: "new\n",
      mode: "lines",
      ignoreWhitespace: false,
      ignoreCase: false,
    })) as DiffWorkerResult;
    expect(diff.text).toContain("-old");
    expect(diff.model.left[0].tone).toBe("modified");
    expect(diff.displayBefore).toBe("old\n");

    const jsonDiff = (await executeToolWorkerRequest({
      operation: "diff",
      before: '{"a":1,"b":2}',
      after: '{"b":2,"a":1}',
      mode: "json",
      ignoreWhitespace: false,
      ignoreCase: false,
    })) as DiffWorkerResult;
    expect(jsonDiff.model.left.every((line) => line.tone === "unchanged")).toBe(
      true,
    );

    const number = (await executeToolWorkerRequest({
      operation: "number-base",
      input: "255",
      from: 10,
      to: 16,
      targets: [2, 16],
    })) as NumberBaseWorkerResult;
    expect(number).toEqual({
      value: "ff",
      conversions: [
        { base: 2, value: "11111111" },
        { base: 16, value: "ff" },
      ],
    });
  });

  it("creates and extracts ZIP, TAR, and GZIP payloads", async () => {
    const files: LocalFileEntry[] = [
      { name: "docs/readme.txt", data: encode("worker zip") },
    ];
    const zip = (await executeToolWorkerRequest({
      operation: "archive-create-zip",
      files,
    })) as Uint8Array;
    const zipEntries = (await executeToolWorkerRequest({
      operation: "archive-extract",
      data: zip,
      format: "zip",
      filename: "files.zip",
    })) as LocalFileEntry[];
    expect(zipEntries[0].name).toBe("docs/readme.txt");
    expect(decode(zipEntries[0].data)).toBe("worker zip");

    const tar = await packTar([
      { header: { name: "worker.txt", size: 3 }, body: "tar" },
    ]);
    const tarEntries = (await executeToolWorkerRequest({
      operation: "archive-extract",
      data: tar,
      format: "tar",
      filename: "files.tar",
    })) as LocalFileEntry[];
    expect(decode(tarEntries[0].data)).toBe("tar");

    const gzip = (await executeToolWorkerRequest({
      operation: "archive-gzip",
      data: encode("worker gzip"),
      action: "compress",
    })) as Uint8Array;
    const gzipEntries = (await executeToolWorkerRequest({
      operation: "archive-extract",
      data: gzip,
      format: "gzip",
      filename: "message.txt.gz",
    })) as LocalFileEntry[];
    expect(gzipEntries[0].name).toBe("message.txt");
    expect(decode(gzipEntries[0].data)).toBe("worker gzip");
  });

  it("hashes files and generates SSH keys inside the worker boundary", async () => {
    await expect(
      executeToolWorkerRequest({
        operation: "file-hash",
        data: encode("abc"),
        algorithm: "SHA-256",
      }),
    ).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );

    await expect(
      executeToolWorkerRequest({
        operation: "ssh-key",
        options: { algorithm: "ED25519", comment: "worker@example.com" },
      }),
    ).resolves.toMatchObject({
      algorithm: "ED25519",
      bits: 256,
      privateFormat: "OpenSSH",
    });
  });
});
