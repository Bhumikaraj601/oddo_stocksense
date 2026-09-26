import { NextRequest } from "next/server";
import { productService } from "@/services/product.service";
import { productSchema, productQuerySchema } from "@/lib/validations/product";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validatedQuery = productQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      status: searchParams.get("status") ?? "ALL",
      stockStatus: searchParams.get("stockStatus") ?? "ALL",
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });

    const result = await productService.listProducts(validatedQuery);

    return createSuccessResponse(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const product = await productService.createProduct(validatedData);

    return createSuccessResponse(product, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
