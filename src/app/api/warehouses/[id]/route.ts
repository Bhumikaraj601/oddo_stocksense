import { NextRequest } from "next/server";
import { warehouseService } from "@/services/warehouse.service";
import { updateWarehouseSchema } from "@/lib/validations/warehouse";
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
    const warehouse = await warehouseService.getWarehouseById(id);
    return createSuccessResponse(warehouse);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const validated = updateWarehouseSchema.parse(body);
    const updated = await warehouseService.updateWarehouse(id, validated);
    return createSuccessResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const result = await warehouseService.deleteWarehouse(id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
