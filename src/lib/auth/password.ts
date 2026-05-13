import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const MIN_PASSWORD_LENGTH = 10;

export function validatePasswordStrength(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "Password must be at least 10 characters.";
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUpper || !hasLower || !hasNumber) {
    return "Password must include uppercase, lowercase, and a number.";
  }

  return null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const parts = encoded.split(":");
  if (parts.length !== 2) return false;

  const [salt, hash] = parts;
  const calculated = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");

  if (calculated.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(calculated, stored);
}
