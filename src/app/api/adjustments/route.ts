import { NextRequest } from "next/server";
import { adjustmentService } from "@/services/adjustment.service";
import { adjustmentQuerySchema, adjustmentSchema } from "@/lib/validations/adjustment";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth, requireRole } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);

    const query = adjustmentQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? "ALL",
      warehouseId: searchParams.get("warehouseId") ?? undefined,
      locationId: searchParams.get("locationId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
    });

    const result = await adjustmentService.getAdjustments(query);
    return createSuccessResponse(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["WAREHOUSE_STAFF", "INVENTORY_MANAGER", "ADMIN"]);
    const body = await request.json();
    const validated = adjustmentSchema.parse(body);
    const adjustment = await adjustmentService.createAdjustment(validated, session.userId);
    return createSuccessResponse(adjustment, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
