import { NextRequest } from "next/server";
import { supplierService } from "@/services/supplier.service";
import { supplierSchema } from "@/lib/validations/receipt";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth, requireRole } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);

    const suppliers = await supplierService.getSuppliers({
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as any) ?? "ALL",
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 100,
    });

    return createSuccessResponse(suppliers.data, suppliers.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["INVENTORY_MANAGER", "ADMIN"]);
    const body = await request.json();
    const validated = supplierSchema.parse(body);
    const supplier = await supplierService.createSupplier(validated);
    return createSuccessResponse(supplier, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
