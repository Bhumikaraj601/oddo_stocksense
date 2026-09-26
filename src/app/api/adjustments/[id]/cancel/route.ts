import { NextRequest } from "next/server";
import { adjustmentService } from "@/services/adjustment.service";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireRole } from "@/lib/auth/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    await requireRole(["WAREHOUSE_STAFF", "INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const result = await adjustmentService.cancelAdjustment(id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
