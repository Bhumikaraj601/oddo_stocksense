import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const result = await authService.requestPasswordReset(validatedData);

    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
