import { NextRequest } from "next/server";
import { deliveryService } from "@/services/delivery.service";
import { packItemsSchema } from "@/lib/validations/delivery";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireRole } from "@/lib/auth/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireRole(["WAREHOUSE_STAFF", "INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const validated = packItemsSchema.parse(body);
    const result = await deliveryService.packDelivery(id, validated);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
