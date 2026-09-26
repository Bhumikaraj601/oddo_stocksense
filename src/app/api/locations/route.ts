import { NextRequest } from "next/server";
import { warehouseService } from "@/services/warehouse.service";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId") ?? undefined;

    const locations = await warehouseService.listLocations(warehouseId);
    return createSuccessResponse(locations);
  } catch (error) {
    return handleApiError(error);
  }
}
