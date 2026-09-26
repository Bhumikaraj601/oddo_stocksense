import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { signupSchema } from "@/lib/validations/auth";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    const { user, token } = await authService.signup(validatedData);

    // Set secure HTTP-only session cookie
    await setSessionCookie(token);

    return createSuccessResponse(
      {
        user,
        message: "Account created successfully.",
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
