import getEd25519Keys from "micro-key-producer/ssh.js";

export type SshKeyAlgorithm = "ED25519" | "RSA" | "ECDSA";
export type RsaKeySize = 2048 | 3072 | 4096;
export type EcdsaKeySize = 256 | 384 | 521;

export interface GenerateSshKeyOptions {
  algorithm: SshKeyAlgorithm;
  size?: RsaKeySize | EcdsaKeySize;
  comment?: string;
  passphrase?: string;
}

export interface GeneratedSshKey {
  algorithm: SshKeyAlgorithm;
  bits: number;
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  privateFormat: "OpenSSH" | "PKCS#8" | "Encrypted PKCS#8";
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function uint32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, false);
  return bytes;
}

function sshBytes(bytes: Uint8Array): Uint8Array {
  return concat(uint32(bytes.byteLength), bytes);
}

function sshText(value: string): Uint8Array {
  return sshBytes(new TextEncoder().encode(value));
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function mpint(value: Uint8Array): Uint8Array {
  let first = 0;
  while (first < value.length - 1 && value[first] === 0) first += 1;
  const normalized = value.subarray(first);
  const positive =
    normalized[0] & 0x80 ? concat(new Uint8Array([0]), normalized) : normalized;
  return sshBytes(positive);
}

function cleanComment(value = "devtoolbox"): string {
  const comment = value.trim() || "devtoolbox";
  if (comment.length > 128 || /[\r\n\0]/.test(comment)) {
    throw new Error(
      "SSH key comments must be one line and at most 128 characters.",
    );
  }
  return comment;
}

function pem(label: string, data: Uint8Array): string {
  const body =
    toBase64(data)
      .match(/.{1,64}/g)
      ?.join("\n") ?? "";
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----\n`;
}

async function fingerprint(blob: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(blob));
  return `SHA256:${toBase64(new Uint8Array(digest)).replace(/=+$/, "")}`;
}

function derLength(length: number): Uint8Array {
  if (length < 0x80) return new Uint8Array([length]);
  const bytes: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function der(tag: number, content: Uint8Array): Uint8Array {
  return concat(new Uint8Array([tag]), derLength(content.byteLength), content);
}

function derSequence(...items: Uint8Array[]): Uint8Array {
  return der(0x30, concat(...items));
}

function derOctet(value: Uint8Array): Uint8Array {
  return der(0x04, value);
}

function derInteger(value: number): Uint8Array {
  const bytes: number[] = [];
  let remaining = value;
  do {
    bytes.unshift(remaining & 0xff);
    remaining >>>= 8;
  } while (remaining > 0);
  if (bytes[0] & 0x80) bytes.unshift(0);
  return der(0x02, new Uint8Array(bytes));
}

function derNull(): Uint8Array {
  return new Uint8Array([0x05, 0x00]);
}

function derOid(value: string): Uint8Array {
  const parts = value.split(".").map(Number);
  if (
    parts.length < 2 ||
    parts.some((part) => !Number.isInteger(part) || part < 0)
  ) {
    throw new Error("Invalid object identifier.");
  }
  const encoded = [parts[0] * 40 + parts[1]];
  for (const part of parts.slice(2)) {
    const groups = [part & 0x7f];
    let remaining = Math.floor(part / 128);
    while (remaining > 0) {
      groups.unshift((remaining & 0x7f) | 0x80);
      remaining = Math.floor(remaining / 128);
    }
    encoded.push(...groups);
  }
  return der(0x06, new Uint8Array(encoded));
}

async function encryptPkcs8(
  pkcs8: Uint8Array,
  passphrase: string,
): Promise<string> {
  if (passphrase.length < 8) {
    throw new Error("Passphrases must contain at least 8 characters.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 210_000;
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const encryptionKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    passwordKey,
    { name: "AES-CBC", length: 256 },
    false,
    ["encrypt"],
  );
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      encryptionKey,
      Uint8Array.from(pkcs8),
    ),
  );
  const hmacSha256 = derSequence(derOid("1.2.840.113549.2.9"), derNull());
  const pbkdf2Params = derSequence(
    derOctet(salt),
    derInteger(iterations),
    derInteger(32),
    hmacSha256,
  );
  const keyDerivation = derSequence(
    derOid("1.2.840.113549.1.5.12"),
    pbkdf2Params,
  );
  const encryptionScheme = derSequence(
    derOid("2.16.840.1.101.3.4.1.42"),
    derOctet(iv),
  );
  const pbes2Params = derSequence(keyDerivation, encryptionScheme);
  const algorithm = derSequence(derOid("1.2.840.113549.1.5.13"), pbes2Params);
  return pem(
    "ENCRYPTED PRIVATE KEY",
    derSequence(algorithm, derOctet(encrypted)),
  );
}

async function exportPrivateKey(
  privateKey: CryptoKey,
  passphrase?: string,
): Promise<{ value: string; format: GeneratedSshKey["privateFormat"] }> {
  const data = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", privateKey),
  );
  if (passphrase) {
    return {
      value: await encryptPkcs8(data, passphrase),
      format: "Encrypted PKCS#8",
    };
  }
  return { value: pem("PRIVATE KEY", data), format: "PKCS#8" };
}

export async function generateSshKey(
  options: GenerateSshKeyOptions,
): Promise<GeneratedSshKey> {
  const comment = cleanComment(options.comment);
  if (options.algorithm === "ED25519") {
    if (options.passphrase) {
      throw new Error("Passphrase export is not available for Ed25519 keys.");
    }
    const seed = crypto.getRandomValues(new Uint8Array(32));
    const result = getEd25519Keys(seed, comment);
    seed.fill(0);
    return {
      algorithm: "ED25519",
      bits: 256,
      publicKey: result.publicKey,
      privateKey: result.privateKey,
      fingerprint: result.fingerprint,
      privateFormat: "OpenSSH",
    };
  }

  if (options.algorithm === "RSA") {
    const bits = (options.size ?? 3072) as RsaKeySize;
    if (![2048, 3072, 4096].includes(bits))
      throw new Error("Unsupported RSA key size.");
    const pair = (await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: bits,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;
    const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
    if (!jwk.e || !jwk.n)
      throw new Error("The browser returned an incomplete RSA key.");
    const blob = concat(
      sshText("ssh-rsa"),
      mpint(fromBase64Url(jwk.e)),
      mpint(fromBase64Url(jwk.n)),
    );
    const privateResult = await exportPrivateKey(
      pair.privateKey,
      options.passphrase,
    );
    return {
      algorithm: "RSA",
      bits,
      publicKey: `ssh-rsa ${toBase64(blob)} ${comment}`,
      privateKey: privateResult.value,
      fingerprint: await fingerprint(blob),
      privateFormat: privateResult.format,
    };
  }

  const bits = (options.size ?? 256) as EcdsaKeySize;
  const curves: Record<EcdsaKeySize, { web: string; ssh: string }> = {
    256: { web: "P-256", ssh: "nistp256" },
    384: { web: "P-384", ssh: "nistp384" },
    521: { web: "P-521", ssh: "nistp521" },
  };
  const curve = curves[bits];
  if (!curve) throw new Error("Unsupported ECDSA key size.");
  const pair = (await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: curve.web },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  if (!jwk.x || !jwk.y)
    throw new Error("The browser returned an incomplete ECDSA key.");
  const keyType = `ecdsa-sha2-${curve.ssh}`;
  const point = concat(
    new Uint8Array([0x04]),
    fromBase64Url(jwk.x),
    fromBase64Url(jwk.y),
  );
  const blob = concat(sshText(keyType), sshText(curve.ssh), sshBytes(point));
  const privateResult = await exportPrivateKey(
    pair.privateKey,
    options.passphrase,
  );
  return {
    algorithm: "ECDSA",
    bits,
    publicKey: `${keyType} ${toBase64(blob)} ${comment}`,
    privateKey: privateResult.value,
    fingerprint: await fingerprint(blob),
    privateFormat: privateResult.format,
  };
}
