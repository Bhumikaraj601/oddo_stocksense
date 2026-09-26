import { NextRequest } from "next/server";
import { locationService } from "@/services/location.service";
import { updateLocationSchema } from "@/lib/validations/warehouse";
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
    const location = await locationService.getLocationById(id);
    return createSuccessResponse(location);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const validated = updateLocationSchema.parse(body);
    const updated = await locationService.updateLocation(id, validated);
    return createSuccessResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const result = await locationService.deleteLocation(id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
