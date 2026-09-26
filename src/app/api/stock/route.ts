import { NextRequest } from "next/server";
import { stockService } from "@/services/stock.service";
import { stockQuerySchema } from "@/lib/validations/warehouse";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const query = stockQuerySchema.parse({
      warehouseId: searchParams.get("warehouseId") ?? undefined,
      locationId: searchParams.get("locationId") ?? undefined,
      productId: searchParams.get("productId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 50,
    });

    const result = await stockService.listStock(query);
    return createSuccessResponse(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}
