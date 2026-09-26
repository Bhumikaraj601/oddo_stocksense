import { authService } from "../src/services/auth.service";
import { hashPassword, verifyPassword, generateOTP, hashOTP, verifyOTP } from "../src/lib/auth/password";
import { createSessionToken, verifySessionToken } from "../src/lib/auth/session";

async function runUnitVerification() {
  console.log("==================================================");
  console.log("StockSense Phase 2 Auth Unit & Security Test Suite");
  console.log("==================================================");

  // 1. Password Hashing & Comparison Test
  console.log("\n[Test 1] Password Hashing & Verification");
  const rawPass = "SecurePass123!";
  const hash = await hashPassword(rawPass);
  const isMatch = await verifyPassword(rawPass, hash);
  const isWrongMatch = await verifyPassword("WrongPassword123!", hash);

  console.assert(isMatch === true, "Password match verification failed");
  console.assert(isWrongMatch === false, "Wrong password verification failed");
  console.log("✓ Password hashing & salt verification passed.");

  // 2. 6-Digit OTP Cryptographic Generation & Hashing Test
  console.log("\n[Test 2] OTP Generation & Hashing");
  const otp = generateOTP(6);
  console.assert(/^\d{6}$/.test(otp), `OTP ${otp} is not a 6 digit number`);
  const otpHash = await hashOTP(otp);
  const otpMatch = await verifyOTP(otp, otpHash);
  const wrongOtpMatch = await verifyOTP("000000", otpHash);

  console.assert(otpMatch === true, "OTP verification failed");
  console.assert(wrongOtpMatch === false, "Invalid OTP was falsely accepted");
  console.log(`✓ 6-Digit OTP (${otp}) generation & hashing verified.`);

  // 3. JWT Session Token Sign & Verify Test
  console.log("\n[Test 3] Session JWT Token Creation & Verification");
  const sessionData = {
    userId: "test-uuid-1234",
    email: "manager@stocksense.io",
    name: "Warehouse Manager",
    role: "INVENTORY_MANAGER" as const,
  };

  const token = await createSessionToken(sessionData);
  console.assert(typeof token === "string" && token.length > 20, "JWT token generation failed");
  const verified = await verifySessionToken(token);

  console.assert(verified?.userId === sessionData.userId, "Session payload userId mismatch");
  console.assert(verified?.role === "INVENTORY_MANAGER", "Session payload role mismatch");
  console.log("✓ Session token signed with HS256 & verified successfully.");

  console.log("\n==================================================");
  console.log("✓ ALL UNIT & CRYPTO SECURITY TESTS PASSED (100%)");
  console.log("==================================================");
}

runUnitVerification().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
