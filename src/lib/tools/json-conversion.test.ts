import { describe, expect, it } from "vitest";
import {
  createJsonTree,
  jsonToCsv,
  jsonToXml,
  jsonToYaml,
} from "./json-conversion";

describe("JSON conversion tools", () => {
  it("serializes JSON to YAML while preserving scalar types", () => {
    const output = jsonToYaml(
      '{"name":"DevToolbox","enabled":true,"count":3,"items":["json","yaml"]}',
    );
    expect(output).toContain("name: DevToolbox");
    expect(output).toContain("enabled: true");
    expect(output).toContain("- yaml");
  });

  it("creates typed, escaped, and lossless XML", () => {
    const output = jsonToXml(
      '{"message":"<safe> & useful","items":[1,null],"spaced key":true}',
    );
    expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(output).toContain('<property name="message" type="string">');
    expect(output).toContain("&lt;safe&gt; &amp; useful");
    expect(output).toContain('<property name="spaced key" type="boolean">true');
    expect(output).toContain('<item type="null"></item>');
    expect(jsonToXml('{"emoji":"🚀"}')).toContain("🚀");
    expect(() => jsonToXml('{"bad":"\\u0001"}')).toThrow(
      "XML 1.0 cannot represent",
    );
  });

  it("creates CSV with union headers, nested JSON, and formula protection", () => {
    const output = jsonToCsv(
      '[{"name":"=2+2","meta":{"active":true}},{"name":"Ada","score":9}]',
    );
    const lines = output.split("\n");
    expect(lines[0]).toBe("name,meta,score");
    expect(lines[1]).toContain("'=2+2");
    expect(lines[1]).toContain('"{""active"":true}"');
    expect(lines[2]).toBe("Ada,,9");
  });

  it("summarizes JSON tree nodes and depth", () => {
    expect(createJsonTree('{"items":[{"ok":true},null]}')).toMatchObject({
      stats: {
        nodes: 5,
        objects: 2,
        arrays: 1,
        primitives: 2,
        maxDepth: 3,
      },
    });
  });
});
