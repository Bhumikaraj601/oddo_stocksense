import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password securely using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
}

/**
 * Hashes an OTP before storing in the database.
 */
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/**
 * Verifies an entered OTP against the hashed OTP in the database.
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
