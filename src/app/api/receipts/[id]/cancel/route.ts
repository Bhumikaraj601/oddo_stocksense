import { NextRequest } from "next/server";
import { receiptService } from "@/services/receipt.service";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireRole } from "@/lib/auth/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const result = await receiptService.cancelReceipt(id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
