import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    const result = await authService.resetPassword(validatedData);

    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
