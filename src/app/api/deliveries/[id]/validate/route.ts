import { NextRequest } from "next/server";
import { deliveryService } from "@/services/delivery.service";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireRole } from "@/lib/auth/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const result = await deliveryService.validateDelivery(id, session.userId);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
