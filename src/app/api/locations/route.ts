import { NextRequest } from "next/server";
import { locationService } from "@/services/location.service";
import { locationQuerySchema, locationSchema } from "@/lib/validations/warehouse";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth, requireRole } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);

    const query = locationQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 50,
      warehouseId: searchParams.get("warehouseId") ?? undefined,
      type: searchParams.get("type") ?? "ALL",
      status: searchParams.get("status") ?? "ALL",
      search: searchParams.get("search") ?? undefined,
    });

    const result = await locationService.getLocations(query);
    return createSuccessResponse(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const body = await request.json();
    const validated = locationSchema.parse(body);
    const location = await locationService.createLocation(validated);
    return createSuccessResponse(location, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
