import { NextRequest } from "next/server";
import { productService } from "@/services/product.service";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth } from "@/lib/auth/session";

export async function GET(_request: NextRequest) {
  try {
    await requireAuth();
    const [products, stats] = await Promise.all([
      productService.getLowStockProducts(),
      productService.getLowStockStats(),
    ]);

    return createSuccessResponse({
      products,
      stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
