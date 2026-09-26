import prisma from "@/lib/prisma";

export class OtpRepository {
  /**
   * Creates an OTP record for password reset.
   */
  async createOTP(userId: string, otpHash: string, validityMinutes: number = 10) {
    const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

    // Invalidate existing unused OTPs for this user first
    await prisma.passwordResetOTP.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    return prisma.passwordResetOTP.create({
      data: {
        userId,
        otpHash,
        expiresAt,
        attempts: 0,
        maxAttempts: 3,
      },
    });
  }

  /**
   * Finds the latest active, unused OTP for a user.
   */
  async findLatestActiveOTP(userId: string) {
    return prisma.passwordResetOTP.findFirst({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Increments the attempt counter for an OTP.
   */
  async incrementAttempts(id: string) {
    return prisma.passwordResetOTP.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
      },
    });
  }

  /**
   * Marks an OTP as used.
   */
  async markAsUsed(id: string) {
    return prisma.passwordResetOTP.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }
}

export const otpRepository = new OtpRepository();
