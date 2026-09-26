import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { requireAuth } from "@/lib/auth/session";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations/auth";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await authService.getProfile(session.userId);

    return createSuccessResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    if (body.currentPassword && body.newPassword) {
      const validatedData = changePasswordSchema.parse(body);
      const result = await authService.changePassword(session.userId, validatedData);
      return createSuccessResponse(result);
    }

    const validatedData = updateProfileSchema.parse(body);
    const updatedUser = await authService.updateProfile(session.userId, validatedData);

    return createSuccessResponse({
      user: updatedUser,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
