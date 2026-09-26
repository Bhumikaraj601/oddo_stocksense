import { NextRequest } from "next/server";
import { warehouseService } from "@/services/warehouse.service";
import { warehouseQuerySchema, warehouseSchema } from "@/lib/validations/warehouse";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth, requireRole } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const query = warehouseQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? "ALL",
    });

    const result = await warehouseService.getWarehouses(query);
    return createSuccessResponse(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);

    const body = await request.json();
    const validated = warehouseSchema.parse(body);
    const warehouse = await warehouseService.createWarehouse(validated);

    return createSuccessResponse(warehouse, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
