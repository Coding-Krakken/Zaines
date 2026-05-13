import { describe, expect, it } from "vitest";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";

describe("auth password helpers", () => {
  it("hashes and verifies passwords", () => {
    const password = "SecurePassword123";
    const hash = hashPassword(password);

    expect(hash).toContain(":");
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("enforces baseline password strength", () => {
    expect(validatePasswordStrength("short")).toBeTruthy();
    expect(validatePasswordStrength("alllowercase123")).toBeTruthy();
    expect(validatePasswordStrength("MixedCase123")).toBeNull();
  });
});
