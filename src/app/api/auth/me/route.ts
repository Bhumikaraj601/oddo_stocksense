import { getCurrentUser } from "@/lib/auth/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return createErrorResponse("Not authenticated", 401, "UNAUTHORIZED");
  }

  return createSuccessResponse({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
}
