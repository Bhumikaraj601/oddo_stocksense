import { NextRequest } from "next/server";
import { ledgerService } from "@/services/ledger.service";
import { ledgerQuerySchema } from "@/lib/validations/ledger";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);

    // If client requested aggregate stats only
    if (searchParams.get("stats") === "true") {
      const stats = await ledgerService.getStats();
      return createSuccessResponse(stats);
    }

    const query = ledgerQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
      search: searchParams.get("search") ?? undefined,
      productId: searchParams.get("productId") ?? undefined,
      operationType: searchParams.get("operationType") ?? "ALL",
      warehouseId: searchParams.get("warehouseId") ?? undefined,
      locationId: searchParams.get("locationId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? "createdAt",
      sortOrder: searchParams.get("sortOrder") ?? "desc",
    });

    const result = await ledgerService.getMovements(query);
    return createSuccessResponse(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}
