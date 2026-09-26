import { NextRequest } from "next/server";
import { transferService } from "@/services/transfer.service";
import { transferQuerySchema, transferSchema } from "@/lib/validations/transfer";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth, requireRole } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);

    const query = transferQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? "ALL",
      sourceWarehouseId: searchParams.get("sourceWarehouseId") ?? undefined,
      destinationWarehouseId: searchParams.get("destinationWarehouseId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
    });

    const result = await transferService.getTransfers(query);
    return createSuccessResponse(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["WAREHOUSE_STAFF", "INVENTORY_MANAGER", "ADMIN"]);
    const body = await request.json();
    const validated = transferSchema.parse(body);
    const transfer = await transferService.createTransfer(validated, session.userId);
    return createSuccessResponse(transfer, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
