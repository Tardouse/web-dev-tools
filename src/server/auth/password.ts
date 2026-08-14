import "server-only";

import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, "lowercase")
  .regex(/[A-Z]/, "uppercase")
  .regex(/[0-9]/, "number")
  .regex(/[^A-Za-z0-9]/, "symbol");

export function isStrongPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*-_+";
const ALL = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;

function randomFrom(alphabet: string): string {
  return alphabet[randomInt(alphabet.length)];
}

export function generateTemporaryPassword(): string {
  const values = [
    randomFrom(LOWERCASE),
    randomFrom(UPPERCASE),
    randomFrom(DIGITS),
    randomFrom(SYMBOLS),
    ...Array.from({ length: 12 }, () => randomFrom(ALL)),
  ];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [values[index], values[target]] = [values[target], values[index]];
  }
  return values.join("");
}
