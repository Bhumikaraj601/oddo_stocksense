import { userRepository } from "@/repositories/user.repository";
import { LoginInput, RegisterInput } from "@/lib/validations/auth";
import { UnauthorizedError, ConflictError } from "@/lib/utils/api-error";

export class AuthService {
  /**
   * Placeholder foundation for authentication flow.
   * Full JWT/NextAuth token issuance is activated in Phase 2.
   */
  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // In Phase 2: verify password hash with bcrypt/argon2
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("A user with this email address already exists");
    }

    // Phase 1 placeholder hash
    const passwordHash = `mock_hash_${input.password}`;

    return userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });
  }
}

export const authService = new AuthService();
