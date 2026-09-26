import prisma from "../src/lib/prisma";
import { authService } from "../src/services/auth.service";
import { otpRepository } from "../src/repositories/otp.repository";
import { verifyPassword, hashPassword } from "../src/lib/auth/password";
import { verifyPasswordResetToken } from "../src/lib/auth/reset-token";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}${detail ? ` — ${detail}` : ""}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
  }
}

async function runOtpFlowTest() {
  console.log("======================================================================");
  console.log("🚀 STOCKSENSE — FORGOT PASSWORD EMAIL OTP E2E TEST SUITE");
  console.log("======================================================================\n");

  try {
    const testEmail = `otp.tester.${Date.now()}@stocksense.io`;
    const initialPassword = "OldPassword123!";
    const newPassword = "NewSecretPassword456!";

    // 1. Create a user
    const signupRes = await authService.signup({
      name: "OTP Test User",
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
      role: "WAREHOUSE_STAFF",
    });
    const userId = signupRes.user.id;
    assert(!!userId, "Test user registered", `User ID: ${userId}`);

    // 2. Request Password Reset (First Request)
    const resetReq = await authService.requestPasswordReset({ email: testEmail });
    assert(resetReq.success, "Password reset request generated successfully");

    // 3. Verify OTP created in DB
    const activeOtpRecord = await otpRepository.findLatestActiveOTP(userId);
    assert(!!activeOtpRecord, "Active OTP record stored in database", `OTP ID: ${activeOtpRecord?.id}`);
    assert(activeOtpRecord?.attempts === 0, "Initial OTP attempt count is 0");
    assert(activeOtpRecord?.usedAt === null, "OTP is currently unused");

    // 4. Test Resend Cooldown (within 60s)
    let cooldownRejected = false;
    try {
      await authService.requestPasswordReset({ email: testEmail });
    } catch (e: any) {
      cooldownRejected = true;
    }
    assert(cooldownRejected, "60-second Resend OTP spam cooldown enforced");

    // 5. Test Invalid OTP verification
    let wrongOtpRejected = false;
    try {
      await authService.verifyOtp({
        email: testEmail,
        otp: "000000",
      });
    } catch (e: any) {
      wrongOtpRejected = true;
    }
    assert(wrongOtpRejected, "Invalid OTP rejection verified");

    // 6. Inspect incremented attempt counter
    const afterWrongAttempt = await otpRepository.findLatestActiveOTP(userId);
    assert(afterWrongAttempt?.attempts === 1, "OTP attempt count incremented to 1", `Attempts: ${afterWrongAttempt?.attempts}`);

    // 7. Find actual OTP from console simulation or test by setting a known hash
    // Let's create a known test OTP "482913" to test verification
    const testKnownOtp = "482913";
    const knownHash = await (await import("../src/lib/auth/password")).hashOTP(testKnownOtp);
    await prisma.passwordResetOTP.update({
      where: { id: activeOtpRecord!.id },
      data: { otpHash: knownHash, attempts: 0 },
    });

    // 8. Verify with correct OTP
    const verifyRes = await authService.verifyOtp({
      email: testEmail,
      otp: testKnownOtp,
    });
    assert(verifyRes.success && !!verifyRes.resetToken, "Correct OTP verified and resetToken issued", `Token Length: ${verifyRes.resetToken?.length}`);

    // 9. Verify signed reset token validity
    const decodedToken = await verifyPasswordResetToken(verifyRes.resetToken!);
    assert(decodedToken?.userId === userId && decodedToken?.email === testEmail, "Reset authorization token cryptographically valid");

    // 10. Reset Password with new password
    const resetResult = await authService.resetPassword({
      resetToken: verifyRes.resetToken!,
      newPassword,
      confirmNewPassword: newPassword,
    });
    assert(resetResult.success, "Password reset successfully completed");

    // 11. Verify OTP record marked as used
    const usedOtpRecord = await otpRepository.findById(activeOtpRecord!.id);
    assert(usedOtpRecord?.usedAt !== null, "OTP record invalidated with usedAt timestamp");

    // 12. Test Token / OTP Reuse Prevention
    let tokenReuseRejected = false;
    try {
      await authService.resetPassword({
        resetToken: verifyRes.resetToken!,
        newPassword: "AnotherPassword789!",
        confirmNewPassword: "AnotherPassword789!",
      });
    } catch (e: any) {
      tokenReuseRejected = true;
    }
    assert(tokenReuseRejected, "Reusing already-used reset authorization rejected");

    // 13. Test Login with OLD password (must fail)
    let oldPasswordFailed = false;
    try {
      await authService.login({
        email: testEmail,
        password: initialPassword,
      });
    } catch (e: any) {
      oldPasswordFailed = true;
    }
    assert(oldPasswordFailed, "Login with old password fails as expected");

    // 14. Test Login with NEW password (must succeed)
    const newLoginRes = await authService.login({
      email: testEmail,
      password: newPassword,
    });
    assert(!!newLoginRes?.token && newLoginRes.user.email === testEmail, "Login with new password succeeds");

    // Clean up test user
    await prisma.user.delete({ where: { id: userId } });

    console.log("\n======================================================================");
    console.log(`🏁 FORGOT PASSWORD OTP SUITE: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log("======================================================================\n");

    if (passedTests !== totalTests) {
      process.exit(1);
    }
  } catch (error) {
    console.error("FATAL ERROR IN OTP TEST:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runOtpFlowTest();
