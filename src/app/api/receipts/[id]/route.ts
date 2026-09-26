import { NextRequest } from "next/server";
import { receiptService } from "@/services/receipt.service";
import { updateReceiptSchema } from "@/lib/validations/receipt";
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
    const receipt = await receiptService.getReceiptById(id);
    return createSuccessResponse(receipt);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireRole(["WAREHOUSE_STAFF", "INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const validated = updateReceiptSchema.parse(body);
    const updated = await receiptService.updateDraftReceipt(id, validated);
    return createSuccessResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
