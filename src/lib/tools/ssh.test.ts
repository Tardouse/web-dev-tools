import { describe, expect, it } from "vitest";
import { generateSshKey } from "./ssh";

describe("browser-local SSH key generation", () => {
  it("creates an OpenSSH Ed25519 key pair", async () => {
    const key = await generateSshKey({
      algorithm: "ED25519",
      comment: "dev@example.com",
    });
    expect(key.publicKey).toMatch(
      /^ssh-ed25519 [A-Za-z0-9+/]+ dev@example\.com$/,
    );
    expect(key.privateKey).toContain("BEGIN OPENSSH PRIVATE KEY");
    expect(key.fingerprint).toMatch(/^SHA256:/);
    expect(key.privateFormat).toBe("OpenSSH");
  });

  it("creates standard RSA public and PKCS#8 private keys", async () => {
    const key = await generateSshKey({ algorithm: "RSA", size: 2048 });
    expect(key.publicKey).toMatch(/^ssh-rsa /);
    expect(key.privateKey).toContain("BEGIN PRIVATE KEY");
    expect(key.bits).toBe(2048);
    expect(key.fingerprint).toMatch(/^SHA256:/);
  });

  it("encrypts ECDSA private keys when a passphrase is provided", async () => {
    const key = await generateSshKey({
      algorithm: "ECDSA",
      size: 256,
      passphrase: "correct horse battery staple",
    });
    expect(key.publicKey).toMatch(/^ecdsa-sha2-nistp256 /);
    expect(key.privateKey).toContain("BEGIN ENCRYPTED PRIVATE KEY");
    expect(key.privateFormat).toBe("Encrypted PKCS#8");
  });

  it("rejects multiline comments and unsupported Ed25519 passphrases", async () => {
    await expect(
      generateSshKey({ algorithm: "ED25519", comment: "bad\ncomment" }),
    ).rejects.toThrow(/one line/i);
    await expect(
      generateSshKey({ algorithm: "ED25519", passphrase: "password" }),
    ).rejects.toThrow(/not available/i);
  });
});
