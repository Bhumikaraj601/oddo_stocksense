import { NextRequest } from "next/server";
import { deliveryService } from "@/services/delivery.service";
import { deliveryQuerySchema, deliverySchema } from "@/lib/validations/delivery";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth, requireRole } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);

    const query = deliveryQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? "ALL",
      warehouseId: searchParams.get("warehouseId") ?? undefined,
      sourceLocationId: searchParams.get("sourceLocationId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
    });

    const result = await deliveryService.getDeliveries(query);
    return createSuccessResponse(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["WAREHOUSE_STAFF", "INVENTORY_MANAGER", "ADMIN"]);
    const body = await request.json();
    const validated = deliverySchema.parse(body);
    const delivery = await deliveryService.createDelivery(validated, session.userId);
    return createSuccessResponse(delivery, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
