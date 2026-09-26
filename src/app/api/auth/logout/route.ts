import { createSuccessResponse } from "@/lib/utils/api-response";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie();
  return createSuccessResponse({
    message: "Logged out successfully.",
  });
}
