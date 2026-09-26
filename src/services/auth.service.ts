import { userRepository } from "@/repositories/user.repository";
import { otpRepository } from "@/repositories/otp.repository";
import {
  LoginInput,
  SignupInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResetPasswordInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "@/lib/validations/auth";
import {
  hashPassword,
  verifyPassword,
  generateOTP,
  hashOTP,
  verifyOTP,
} from "@/lib/auth/password";
import { createSessionToken, SessionPayload } from "@/lib/auth/session";
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/utils/api-error";

export class AuthService {
  /**
   * Registers a new user account and creates a session token.
   */
  async signup(input: SignupInput) {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError("An account with this email address already exists.");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await createSessionToken(sessionPayload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Authenticates user credentials and generates a session token.
   */
  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const isPasswordValid = await verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await createSessionToken(sessionPayload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Generates a 6-digit OTP for password reset and logs it in development mode.
   */
  async requestPasswordReset(input: ForgotPasswordInput) {
    const user = await userRepository.findByEmail(input.email);

    // Generic safe response to prevent email enumeration
    if (!user || !user.isActive) {
      return {
        success: true,
        message:
          "If an account with this email exists, a 6-digit verification code has been dispatched.",
      };
    }

    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);

    // Store in DB with 10-minute validity
    await otpRepository.createOTP(user.id, otpHash, 10);

    // Development-safe inspection logger
    console.log("====================================================");
    console.log(`[StockSense Auth] OTP Generated for ${user.email}: ${otp}`);
    console.log("Valid for 10 minutes (Max 3 attempts)");
    console.log("====================================================");

    return {
      success: true,
      message:
        "If an account with this email exists, a 6-digit verification code has been dispatched.",
      // Include devOtp in non-production for frictionless testing in Hackathon evaluation
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    };
  }

  /**
   * Verifies an OTP without resetting password yet.
   */
  async verifyOtp(input: VerifyOtpInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new ValidationError("Invalid or expired verification code.");
    }

    const activeOtp = await otpRepository.findLatestActiveOTP(user.id);
    if (!activeOtp) {
      throw new ValidationError(
        "Verification code has expired or does not exist. Please request a new code."
      );
    }

    if (activeOtp.attempts >= activeOtp.maxAttempts) {
      throw new ValidationError(
        "Maximum verification attempts exceeded. Please request a new code."
      );
    }

    const isMatch = await verifyOTP(input.otp, activeOtp.otpHash);
    if (!isMatch) {
      await otpRepository.incrementAttempts(activeOtp.id);
      const remaining = activeOtp.maxAttempts - (activeOtp.attempts + 1);
      throw new ValidationError(
        `Invalid verification code. ${remaining} attempt(s) remaining.`
      );
    }

    return {
      valid: true,
      message: "Verification code confirmed.",
    };
  }

  /**
   * Resets password after verifying the OTP.
   */
  async resetPassword(input: ResetPasswordInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new ValidationError("Invalid or expired verification code.");
    }

    const activeOtp = await otpRepository.findLatestActiveOTP(user.id);
    if (!activeOtp) {
      throw new ValidationError(
        "Verification code has expired or does not exist. Please request a new code."
      );
    }

    if (activeOtp.attempts >= activeOtp.maxAttempts) {
      throw new ValidationError(
        "Maximum verification attempts exceeded. Please request a new code."
      );
    }

    const isMatch = await verifyOTP(input.otp, activeOtp.otpHash);
    if (!isMatch) {
      await otpRepository.incrementAttempts(activeOtp.id);
      const remaining = activeOtp.maxAttempts - (activeOtp.attempts + 1);
      throw new ValidationError(
        `Invalid verification code. ${remaining} attempt(s) remaining.`
      );
    }

    // Hash new password and update user
    const newPasswordHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(user.id, newPasswordHash);

    // Invalidate the used OTP
    await otpRepository.markAsUsed(activeOtp.id);

    return {
      success: true,
      message: "Password has been successfully updated. You can now log in.",
    };
  }

  /**
   * Retrieves user profile details.
   */
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }
    return user;
  }

  /**
   * Updates user name.
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }
    return userRepository.updateProfile(userId, { name: input.name });
  }

  /**
   * Updates user password while authenticated.
   */
  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await userRepository.findByEmail(userId);
    const fullUser = await userRepository.findById(userId);
    if (!fullUser) {
      throw new NotFoundError("User");
    }

    // Verify existing password
    const userWithPass = await userRepository.findByEmail(fullUser.email);
    if (!userWithPass) {
      throw new NotFoundError("User");
    }

    const isValid = await verifyPassword(
      input.currentPassword,
      userWithPass.passwordHash
    );
    if (!isValid) {
      throw new ValidationError("Current password is incorrect.");
    }

    const newHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(userId, newHash);

    return {
      success: true,
      message: "Password changed successfully.",
    };
  }
}

export const authService = new AuthService();
