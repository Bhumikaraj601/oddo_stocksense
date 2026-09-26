import { NextRequest } from "next/server";
import { locationService } from "@/services/location.service";
import { locationSchema } from "@/lib/validations/warehouse";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth, requireRole } from "@/lib/auth/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { id: warehouseId } = await params;
    const { searchParams } = new URL(request.url);

    const locations = await locationService.getLocations({
      warehouseId,
      status: (searchParams.get("status") as any) ?? "ALL",
      type: (searchParams.get("type") as any) ?? "ALL",
      search: searchParams.get("search") ?? undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 100,
    });

    return createSuccessResponse(locations.data, locations.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const { id: warehouseId } = await params;
    const body = await request.json();

    const validated = locationSchema.parse({
      ...body,
      warehouseId,
    });

    const location = await locationService.createLocation(validated);
    return createSuccessResponse(location, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
