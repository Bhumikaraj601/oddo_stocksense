import { NextRequest } from "next/server";
import { adjustmentService } from "@/services/adjustment.service";
import { updateAdjustmentSchema } from "@/lib/validations/adjustment";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth, requireRole } from "@/lib/auth/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const adjustment = await adjustmentService.getAdjustmentById(id);
    return createSuccessResponse(adjustment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireRole(["WAREHOUSE_STAFF", "INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const validated = updateAdjustmentSchema.parse(body);
    const updated = await adjustmentService.updateDraftAdjustment(id, validated);
    return createSuccessResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
