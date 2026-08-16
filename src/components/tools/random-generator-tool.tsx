"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { useState } from "react";
import { byteLength, formatBytes, TOOL_LIMITS } from "@/lib/config";
import {
  generateFakeJson,
  generateLorem,
  generateMockCsv,
  generatePassword,
  generateRandomColors,
  generateRandomDates,
  generateRandomNumbers,
  generateRandomString,
  generateUsernames,
  type RandomColor,
} from "@/lib/tools/random-generators";
import type { ToolComponentProps } from "@/lib/types";
import {
  ActionButton,
  ClearButton,
  CopyButton,
  DownloadButton,
} from "./tool-actions";

type GeneratorKind =
  | "random-string-generator"
  | "password-generator"
  | "username-generator"
  | "lorem-ipsum-generator"
  | "fake-json-generator"
  | "mock-data-generator"
  | "random-number-generator"
  | "random-date-generator"
  | "random-color-generator";

const titles: Record<GeneratorKind, { en: string; zh: string }> = {
  "random-string-generator": {
    en: "Random string generator",
    zh: "随机字符串生成器",
  },
  "password-generator": {
    en: "Secure password generator",
    zh: "安全密码生成器",
  },
  "username-generator": { en: "Username generator", zh: "用户名生成器" },
  "lorem-ipsum-generator": {
    en: "Lorem Ipsum generator",
    zh: "Lorem Ipsum 生成器",
  },
  "fake-json-generator": { en: "Fake JSON generator", zh: "Fake JSON 生成器" },
  "mock-data-generator": {
    en: "Mock CSV data generator",
    zh: "Mock CSV 数据生成器",
  },
  "random-number-generator": {
    en: "Random number generator",
    zh: "随机数生成器",
  },
  "random-date-generator": {
    en: "Random date generator",
    zh: "随机日期生成器",
  },
  "random-color-generator": {
    en: "Random color generator",
    zh: "随机颜色生成器",
  },
};

const filenames: Record<GeneratorKind, string> = {
  "random-string-generator": "random-string.txt",
  "password-generator": "password.txt",
  "username-generator": "usernames.txt",
  "lorem-ipsum-generator": "lorem-ipsum.txt",
  "fake-json-generator": "fake-data.json",
  "mock-data-generator": "mock-data.csv",
  "random-number-generator": "random-numbers.txt",
  "random-date-generator": "random-dates.txt",
  "random-color-generator": "random-colors.txt",
};

function kindFrom(value: string): GeneratorKind {
  return value in titles ? (value as GeneratorKind) : "random-string-generator";
}

export function RandomGeneratorTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const kind = kindFrom(
    definition?.implementation ?? definition?.slug ?? "random-string-generator",
  );
  const zh = locale === "zh";
  const [length, setLength] = useState(20);
  const [count, setCount] = useState(8);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [separator, setSeparator] = useState<"-" | "_" | "." | "">("-");
  const [includeUsernameDigits, setIncludeUsernameDigits] = useState(true);
  const [loremMode, setLoremMode] = useState<
    "words" | "sentences" | "paragraphs"
  >("paragraphs");
  const [amount, setAmount] = useState(3);
  const [minimum, setMinimum] = useState(1);
  const [maximum, setMaximum] = useState(100);
  const [integer, setInteger] = useState(true);
  const [decimals, setDecimals] = useState(2);
  const [unique, setUnique] = useState(false);
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2030-12-31");
  const [dateFormat, setDateFormat] = useState<"iso" | "date" | "unix">("iso");
  const [colorFormat, setColorFormat] = useState<keyof RandomColor>("hex");
  const [textOutput, setTextOutput] = useState("");
  const [colors, setColors] = useState<RandomColor[]>([]);
  const [entropy, setEntropy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const output = colors.length
    ? colors.map((color) => color[colorFormat]).join("\n")
    : textOutput;

  const clear = () => {
    setTextOutput("");
    setColors([]);
    setEntropy(null);
    setError("");
  };

  const generate = () => {
    setError("");
    setEntropy(null);
    setColors([]);
    try {
      if (kind === "random-string-generator") {
        setTextOutput(
          generateRandomString({
            length,
            uppercase,
            lowercase,
            digits,
            symbols,
            excludeAmbiguous,
          }),
        );
      } else if (kind === "password-generator") {
        const result = generatePassword({
          length,
          uppercase,
          lowercase,
          digits,
          symbols,
          excludeAmbiguous,
        });
        setTextOutput(result.value);
        setEntropy(result.entropyBits);
      } else if (kind === "username-generator") {
        setTextOutput(
          generateUsernames({
            count,
            separator,
            includeDigits: includeUsernameDigits,
          }).join("\n"),
        );
      } else if (kind === "lorem-ipsum-generator") {
        setTextOutput(generateLorem(loremMode, amount));
      } else if (kind === "fake-json-generator") {
        setTextOutput(generateFakeJson(count));
      } else if (kind === "mock-data-generator") {
        setTextOutput(generateMockCsv(count));
      } else if (kind === "random-number-generator") {
        setTextOutput(
          generateRandomNumbers({
            minimum,
            maximum,
            count,
            integer,
            decimals,
            unique,
          }).join("\n"),
        );
      } else if (kind === "random-date-generator") {
        setTextOutput(
          generateRandomDates({
            start: startDate,
            end: endDate,
            count,
            format: dateFormat,
          }).join("\n"),
        );
      } else {
        const generated = generateRandomColors(count);
        setColors(generated);
        setTextOutput("");
      }
    } catch (caught) {
      setTextOutput("");
      setColors([]);
      setError(caught instanceof Error ? caught.message : "Generation failed.");
    }
  };

  const characterControls = (kind === "random-string-generator" ||
    kind === "password-generator") && (
    <>
      <label className="field generator-number-field">
        <span className="field-label">{zh ? "长度" : "Length"}</span>
        <input
          aria-label={zh ? "长度" : "Length"}
          type="number"
          min={kind === "password-generator" ? 4 : 1}
          max={
            kind === "password-generator"
              ? TOOL_LIMITS.maxPasswordLength
              : TOOL_LIMITS.maxRandomStringLength
          }
          value={length}
          onChange={(event) => setLength(Number(event.target.value))}
        />
      </label>
      <div
        className="generator-checkboxes"
        role="group"
        aria-label={zh ? "字符集" : "Character sets"}
      >
        <label className="checkbox">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(event) => setUppercase(event.target.checked)}
          />
          {zh ? "大写" : "Uppercase"}
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={lowercase}
            onChange={(event) => setLowercase(event.target.checked)}
          />
          {zh ? "小写" : "Lowercase"}
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={digits}
            onChange={(event) => setDigits(event.target.checked)}
          />
          {zh ? "数字" : "Digits"}
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={symbols}
            onChange={(event) => setSymbols(event.target.checked)}
          />
          {zh ? "符号" : "Symbols"}
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={excludeAmbiguous}
            onChange={(event) => setExcludeAmbiguous(event.target.checked)}
          />
          {zh ? "排除易混淆字符" : "Exclude ambiguous"}
        </label>
      </div>
    </>
  );

  return (
    <section className="tool-workspace card generator-workbench">
      <div className="workspace-header">
        <h2>{titles[kind][zh ? "zh" : "en"]}</h2>
        <div className="workspace-actions">
          <ClearButton onClick={clear} messages={messages} />
          <CopyButton value={output} messages={messages} />
          <DownloadButton
            value={output}
            filename={filenames[kind]}
            messages={messages}
            type={
              kind === "fake-json-generator"
                ? "application/json"
                : kind === "mock-data-generator"
                  ? "text/csv"
                  : "text/plain"
            }
          />
        </div>
      </div>
      <div className="generator-controls">
        {characterControls}
        {kind === "username-generator" && (
          <>
            <CountField count={count} setCount={setCount} zh={zh} />
            <label className="field generator-number-field">
              <span className="field-label">{zh ? "分隔符" : "Separator"}</span>
              <select
                aria-label={zh ? "分隔符" : "Separator"}
                value={separator}
                onChange={(event) =>
                  setSeparator(event.target.value as typeof separator)
                }
              >
                <option value="-">-</option>
                <option value="_">_</option>
                <option value=".">.</option>
                <option value="">{zh ? "无" : "None"}</option>
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={includeUsernameDigits}
                onChange={(event) =>
                  setIncludeUsernameDigits(event.target.checked)
                }
              />
              {zh ? "添加两位数字" : "Add two digits"}
            </label>
          </>
        )}
        {kind === "lorem-ipsum-generator" && (
          <>
            <label className="field generator-number-field">
              <span className="field-label">{zh ? "模式" : "Mode"}</span>
              <select
                aria-label={zh ? "模式" : "Mode"}
                value={loremMode}
                onChange={(event) =>
                  setLoremMode(event.target.value as typeof loremMode)
                }
              >
                <option value="words">{zh ? "单词" : "Words"}</option>
                <option value="sentences">{zh ? "句子" : "Sentences"}</option>
                <option value="paragraphs">{zh ? "段落" : "Paragraphs"}</option>
              </select>
            </label>
            <label className="field generator-number-field">
              <span className="field-label">{zh ? "数量" : "Amount"}</span>
              <input
                aria-label={zh ? "数量" : "Amount"}
                type="number"
                min={1}
                max={
                  loremMode === "words"
                    ? TOOL_LIMITS.maxLoremWords
                    : loremMode === "sentences"
                      ? TOOL_LIMITS.maxLoremSentences
                      : TOOL_LIMITS.maxLoremParagraphs
                }
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </label>
          </>
        )}
        {(kind === "fake-json-generator" ||
          kind === "mock-data-generator" ||
          kind === "random-color-generator") && (
          <CountField count={count} setCount={setCount} zh={zh} />
        )}
        {kind === "random-number-generator" && (
          <>
            <label className="field generator-number-field">
              <span className="field-label">{zh ? "最小值" : "Minimum"}</span>
              <input
                aria-label={zh ? "最小值" : "Minimum"}
                type="number"
                value={minimum}
                onChange={(event) => setMinimum(Number(event.target.value))}
              />
            </label>
            <label className="field generator-number-field">
              <span className="field-label">{zh ? "最大值" : "Maximum"}</span>
              <input
                aria-label={zh ? "最大值" : "Maximum"}
                type="number"
                value={maximum}
                onChange={(event) => setMaximum(Number(event.target.value))}
              />
            </label>
            <CountField count={count} setCount={setCount} zh={zh} />
            {!integer && (
              <label className="field generator-number-field">
                <span className="field-label">
                  {zh ? "小数位" : "Decimal places"}
                </span>
                <input
                  aria-label={zh ? "小数位" : "Decimal places"}
                  type="number"
                  min={0}
                  max={TOOL_LIMITS.maxRandomDecimalPlaces}
                  value={decimals}
                  onChange={(event) => setDecimals(Number(event.target.value))}
                />
              </label>
            )}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={integer}
                onChange={(event) => setInteger(event.target.checked)}
              />
              {zh ? "整数" : "Whole numbers"}
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={unique}
                onChange={(event) => setUnique(event.target.checked)}
              />
              {zh ? "不重复" : "Unique"}
            </label>
          </>
        )}
        {kind === "random-date-generator" && (
          <>
            <label className="field">
              <span className="field-label">
                {zh ? "开始日期" : "Start date"}
              </span>
              <input
                aria-label={zh ? "开始日期" : "Start date"}
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">
                {zh ? "结束日期" : "End date"}
              </span>
              <input
                aria-label={zh ? "结束日期" : "End date"}
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            <CountField count={count} setCount={setCount} zh={zh} />
            <label className="field generator-number-field">
              <span className="field-label">{zh ? "格式" : "Format"}</span>
              <select
                aria-label={zh ? "日期格式" : "Date format"}
                value={dateFormat}
                onChange={(event) =>
                  setDateFormat(event.target.value as typeof dateFormat)
                }
              >
                <option value="iso">ISO 8601</option>
                <option value="date">YYYY-MM-DD</option>
                <option value="unix">Unix</option>
              </select>
            </label>
          </>
        )}
        {kind === "random-color-generator" && (
          <label className="field generator-number-field">
            <span className="field-label">
              {zh ? "输出格式" : "Output format"}
            </span>
            <select
              aria-label={zh ? "颜色格式" : "Color format"}
              value={colorFormat}
              onChange={(event) =>
                setColorFormat(event.target.value as keyof RandomColor)
              }
            >
              <option value="hex">HEX</option>
              <option value="rgb">RGB</option>
              <option value="hsl">HSL</option>
            </select>
          </label>
        )}
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}
      <div className="panel-label">
        <span>{zh ? "生成结果" : "Generated output"}</span>
        <span>
          {entropy !== null
            ? `${zh ? "熵" : "Entropy"}: ~${entropy} bits`
            : output
              ? formatBytes(byteLength(output))
              : ""}
        </span>
      </div>
      {colors.length ? (
        <div className="random-color-grid">
          {colors.map((color, index) => (
            <div className="random-color-row" key={`${color.hex}-${index}`}>
              <span
                className="color-swatch"
                style={{ background: color.hex }}
              />
              <code>{color[colorFormat]}</code>
              <CopyButton value={color[colorFormat]} messages={messages} />
            </div>
          ))}
        </div>
      ) : (
        <pre
          className="editor editor-output generator-output"
          data-placeholder={
            zh ? "点击生成以创建结果" : "Generate to create output"
          }
        >
          {textOutput}
        </pre>
      )}
      <div className="workspace-footer">
        <span className="workspace-footer-meta">
          Web Crypto · {zh ? "本地生成" : "Generated locally"}
        </span>
        <ActionButton onClick={generate} icon={RefreshCw} primary>
          {zh ? "生成" : "Generate"}
        </ActionButton>
      </div>
    </section>
  );
}

function CountField({
  count,
  setCount,
  zh,
}: {
  count: number;
  setCount: (value: number) => void;
  zh: boolean;
}) {
  return (
    <label className="field generator-number-field">
      <span className="field-label">{zh ? "数量" : "Count"}</span>
      <input
        aria-label={zh ? "数量" : "Count"}
        type="number"
        min={1}
        max={TOOL_LIMITS.maxRandomBatchSize}
        value={count}
        onChange={(event) => setCount(Number(event.target.value))}
      />
    </label>
  );
}
