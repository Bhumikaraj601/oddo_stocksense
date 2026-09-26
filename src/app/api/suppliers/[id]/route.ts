import { NextRequest } from "next/server";
import { supplierService } from "@/services/supplier.service";
import { updateSupplierSchema } from "@/lib/validations/receipt";
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
    const supplier = await supplierService.getSupplierById(id);
    return createSuccessResponse(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const validated = updateSupplierSchema.parse(body);
    const updated = await supplierService.updateSupplier(id, validated);
    return createSuccessResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const { id } = await params;
    const result = await supplierService.deleteSupplier(id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
