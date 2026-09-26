import { NextRequest } from "next/server";
import { transferService } from "@/services/transfer.service";
import { updateTransferSchema } from "@/lib/validations/transfer";
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
    const transfer = await transferService.getTransferById(id);
    return createSuccessResponse(transfer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireRole(["WAREHOUSE_STAFF", "INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const validated = updateTransferSchema.parse(body);
    const updated = await transferService.updateDraftTransfer(id, validated);
    return createSuccessResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
