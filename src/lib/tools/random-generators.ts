import { TOOL_LIMITS } from "@/lib/config";

const UINT32_RANGE = 0x1_0000_0000;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;
const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const CHARACTER_SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}:,.?",
} as const;

const AMBIGUOUS_CHARACTERS = new Set("Il1O0o".split(""));

function assertInteger(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${label} must be a whole number from ${minimum} to ${maximum}.`,
    );
  }
}

function randomUint32(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
}

export function secureRandomInteger(minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum)) {
    throw new Error("Random integer bounds must be safe whole numbers.");
  }
  if (minimum > maximum) throw new Error("Minimum cannot exceed maximum.");
  const span = maximum - minimum + 1;
  if (span > UINT32_RANGE) {
    throw new Error("Random integer ranges cannot exceed 2^32 values.");
  }
  const limit = Math.floor(UINT32_RANGE / span) * span;
  let value = randomUint32();
  while (value >= limit) value = randomUint32();
  return minimum + (value % span);
}

function secureRandomFraction(): number {
  return randomUint32() / UINT32_RANGE;
}

function pick<T>(values: readonly T[]): T {
  if (!values.length)
    throw new Error("Cannot choose from an empty collection.");
  return values[secureRandomInteger(0, values.length - 1)];
}

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = secureRandomInteger(0, index);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function sampleUniqueIndices(populationSize: number, count: number): number[] {
  assertInteger(count, 0, populationSize, "Sample size");
  const selected = new Set<number>();
  for (
    let candidate = populationSize - count;
    candidate < populationSize;
    candidate += 1
  ) {
    const value = secureRandomInteger(0, candidate);
    selected.add(selected.has(value) ? candidate : value);
  }
  return shuffle([...selected]);
}

function selectedCharacterSets(options: {
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}): string[] {
  const sets = [
    options.uppercase ? CHARACTER_SETS.upper : "",
    options.lowercase ? CHARACTER_SETS.lower : "",
    options.digits ? CHARACTER_SETS.digits : "",
    options.symbols ? CHARACTER_SETS.symbols : "",
  ]
    .filter(Boolean)
    .map((set) =>
      options.excludeAmbiguous
        ? [...set]
            .filter((character) => !AMBIGUOUS_CHARACTERS.has(character))
            .join("")
        : set,
    )
    .filter(Boolean);
  if (!sets.length) throw new Error("Select at least one character set.");
  return sets;
}

export interface RandomStringOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export function generateRandomString(options: RandomStringOptions): string {
  assertInteger(options.length, 1, TOOL_LIMITS.maxRandomStringLength, "Length");
  const alphabet = selectedCharacterSets(options).join("");
  return Array.from(
    { length: options.length },
    () => alphabet[secureRandomInteger(0, alphabet.length - 1)],
  ).join("");
}

export interface PasswordResult {
  value: string;
  entropyBits: number;
}

export function generatePassword(options: RandomStringOptions): PasswordResult {
  assertInteger(
    options.length,
    4,
    TOOL_LIMITS.maxPasswordLength,
    "Password length",
  );
  const sets = selectedCharacterSets(options);
  if (options.length < sets.length) {
    throw new Error("Password length must cover every selected character set.");
  }
  const alphabet = sets.join("");
  const required = sets.map(
    (set) => set[secureRandomInteger(0, set.length - 1)],
  );
  const remaining = Array.from(
    { length: options.length - required.length },
    () => alphabet[secureRandomInteger(0, alphabet.length - 1)],
  );
  return {
    value: shuffle([...required, ...remaining]).join(""),
    entropyBits: Math.round(options.length * Math.log2(alphabet.length)),
  };
}

const USERNAME_ADJECTIVES = [
  "agile",
  "bright",
  "calm",
  "clever",
  "cosmic",
  "crisp",
  "curious",
  "gentle",
  "lucky",
  "nimble",
  "quiet",
  "rapid",
  "steady",
  "vivid",
  "witty",
  "zen",
] as const;
const USERNAME_NOUNS = [
  "anchor",
  "byte",
  "cloud",
  "comet",
  "forge",
  "kernel",
  "matrix",
  "pixel",
  "quartz",
  "script",
  "signal",
  "stack",
  "vector",
  "vertex",
  "wave",
  "widget",
] as const;

export function generateUsernames(options: {
  count: number;
  separator: "-" | "_" | "." | "";
  includeDigits: boolean;
}): string[] {
  assertInteger(options.count, 1, TOOL_LIMITS.maxRandomBatchSize, "Count");
  const suffixCount = options.includeDigits ? 100 : 1;
  const populationSize =
    USERNAME_ADJECTIVES.length * USERNAME_NOUNS.length * suffixCount;
  return sampleUniqueIndices(populationSize, options.count).map((index) => {
    const suffixIndex = index % suffixCount;
    const pairIndex = Math.floor(index / suffixCount);
    const nounIndex = pairIndex % USERNAME_NOUNS.length;
    const adjectiveIndex = Math.floor(pairIndex / USERNAME_NOUNS.length);
    const suffix = options.includeDigits
      ? String(suffixIndex).padStart(2, "0")
      : "";
    return `${USERNAME_ADJECTIVES[adjectiveIndex]}${options.separator}${USERNAME_NOUNS[nounIndex]}${suffix}`;
  });
}

const LOREM_WORDS = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut " +
  "labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris " +
  "nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum " +
  "fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa officia deserunt " +
  "mollit anim id est laborum integer posuere erat ante venenatis dapibus posuere velit aliquet"
).split(" ");

function loremSentence(): string {
  const words = Array.from({ length: secureRandomInteger(8, 15) }, () =>
    pick(LOREM_WORDS),
  );
  const text = words.join(" ");
  return `${text[0].toUpperCase()}${text.slice(1)}.`;
}

export function generateLorem(
  mode: "words" | "sentences" | "paragraphs",
  amount: number,
): string {
  const maximum =
    mode === "words"
      ? TOOL_LIMITS.maxLoremWords
      : mode === "sentences"
        ? TOOL_LIMITS.maxLoremSentences
        : TOOL_LIMITS.maxLoremParagraphs;
  assertInteger(amount, 1, maximum, "Amount");
  if (mode === "words") {
    return Array.from({ length: amount }, () => pick(LOREM_WORDS)).join(" ");
  }
  if (mode === "sentences") {
    return Array.from({ length: amount }, loremSentence).join(" ");
  }
  return Array.from({ length: amount }, () =>
    Array.from({ length: secureRandomInteger(3, 6) }, loremSentence).join(" "),
  ).join("\n\n");
}

const FIRST_NAMES = [
  "Avery",
  "Casey",
  "Devon",
  "Emery",
  "Jordan",
  "Morgan",
  "Quinn",
  "Riley",
] as const;
const LAST_NAMES = [
  "Chen",
  "Garcia",
  "Kim",
  "Martin",
  "Patel",
  "Smith",
  "Taylor",
  "Wilson",
] as const;
const DOMAINS = ["example.com", "example.net", "sample.dev"] as const;
const ROLES = ["admin", "editor", "viewer", "developer"] as const;
const COUNTRIES = ["CA", "CN", "DE", "GB", "JP", "US"] as const;

function randomProfile(index: number) {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const serial = String(index + 1).padStart(3, "0");
  return {
    id: `usr_${generateRandomString({ length: 10, uppercase: false, lowercase: true, digits: true, symbols: false, excludeAmbiguous: true })}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}.${serial}@${pick(DOMAINS)}`.toLowerCase(),
    role: pick(ROLES),
    country: pick(COUNTRIES),
    active: secureRandomInteger(0, 1) === 1,
  };
}

export function generateFakeJson(count: number): string {
  assertInteger(count, 1, TOOL_LIMITS.maxRandomBatchSize, "Record count");
  const now = Date.now();
  const start = Date.UTC(2020, 0, 1);
  return JSON.stringify(
    Array.from({ length: count }, (_, index) => {
      const profile = randomProfile(index);
      return {
        ...profile,
        score: secureRandomInteger(0, 100),
        createdAt: new Date(
          start + Math.floor(secureRandomFraction() * (now - start)),
        ).toISOString(),
      };
    }),
    null,
    2,
  );
}

function csvValue(value: string | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function generateMockCsv(count: number): string {
  assertInteger(count, 1, TOOL_LIMITS.maxRandomBatchSize, "Record count");
  const header = ["id", "name", "email", "role", "country", "active"];
  const rows = Array.from({ length: count }, (_, index) => {
    const profile = randomProfile(index);
    return header
      .map((key) => csvValue(profile[key as keyof typeof profile]))
      .join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export function generateRandomNumbers(options: {
  minimum: number;
  maximum: number;
  count: number;
  integer: boolean;
  decimals: number;
  unique: boolean;
}): string[] {
  if (!Number.isFinite(options.minimum) || !Number.isFinite(options.maximum)) {
    throw new Error("Minimum and maximum must be finite numbers.");
  }
  if (options.minimum > options.maximum)
    throw new Error("Minimum cannot exceed maximum.");
  assertInteger(options.count, 1, TOOL_LIMITS.maxRandomBatchSize, "Count");
  assertInteger(
    options.decimals,
    0,
    TOOL_LIMITS.maxRandomDecimalPlaces,
    "Decimal places",
  );
  const lower = Math.ceil(options.minimum);
  const upper = Math.floor(options.maximum);
  if (options.integer && lower > upper) {
    throw new Error("The range does not contain a whole number.");
  }
  if (options.integer && options.unique && upper - lower + 1 < options.count) {
    throw new Error(
      "The integer range is too small for the requested unique count.",
    );
  }
  const results: string[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (results.length < options.count && attempts < options.count * 100) {
    const value = options.integer
      ? String(secureRandomInteger(lower, upper))
      : (
          options.minimum +
          secureRandomFraction() * (options.maximum - options.minimum)
        ).toFixed(options.decimals);
    if (!options.unique || !seen.has(value)) {
      results.push(value);
      seen.add(value);
    }
    attempts += 1;
  }
  if (results.length < options.count) {
    throw new Error(
      "Unable to create enough unique numbers at this precision.",
    );
  }
  return results;
}

export function generateRandomDates(options: {
  start: string;
  end: string;
  count: number;
  format: "iso" | "date" | "unix";
}): string[] {
  assertInteger(options.count, 1, TOOL_LIMITS.maxRandomBatchSize, "Count");
  if (
    !CALENDAR_DATE_PATTERN.test(options.start) ||
    !CALENDAR_DATE_PATTERN.test(options.end)
  ) {
    throw new Error("Enter valid start and end dates.");
  }
  const start = Date.parse(`${options.start}T00:00:00.000Z`);
  const end = Date.parse(`${options.end}T00:00:00.000Z`);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    new Date(start).toISOString().slice(0, 10) !== options.start ||
    new Date(end).toISOString().slice(0, 10) !== options.end
  ) {
    throw new Error("Enter valid start and end dates.");
  }
  if (start > end) throw new Error("Start date cannot be after end date.");
  const inclusiveEnd = end + DAY_IN_MILLISECONDS - 1;
  return Array.from(
    { length: options.count },
    () =>
      start + Math.floor(secureRandomFraction() * (inclusiveEnd - start + 1)),
  )
    .sort((left, right) => left - right)
    .map((timestamp) => {
      if (options.format === "unix")
        return String(Math.floor(timestamp / 1000));
      const iso = new Date(timestamp).toISOString();
      return options.format === "date" ? iso.slice(0, 10) : iso;
    });
}

export interface RandomColor {
  hex: string;
  rgb: string;
  hsl: string;
}

function rgbToHsl(red: number, green: number, blue: number): string {
  const [r, g, b] = [red, green, blue].map((value) => value / 255);
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const lightness = (maximum + minimum) / 2;
  const delta = maximum - minimum;
  let hue = 0;
  let saturation = 0;
  if (delta) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (maximum === r) hue = 60 * (((g - b) / delta) % 6);
    else if (maximum === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return `hsl(${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%)`;
}

export function generateRandomColors(count: number): RandomColor[] {
  assertInteger(count, 1, TOOL_LIMITS.maxRandomBatchSize, "Count");
  return Array.from({ length: count }, () => {
    const red = secureRandomInteger(0, 255);
    const green = secureRandomInteger(0, 255);
    const blue = secureRandomInteger(0, 255);
    return {
      hex: `#${[red, green, blue]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("")}`.toUpperCase(),
      rgb: `rgb(${red} ${green} ${blue})`,
      hsl: rgbToHsl(red, green, blue),
    };
  });
}
