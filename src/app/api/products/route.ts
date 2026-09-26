import { NextRequest } from "next/server";
import { productService } from "@/services/product.service";
import { productSchema } from "@/lib/validations/product";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const result = await productService.listProducts({
      search,
      categoryId,
      page,
      limit,
    });

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
    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const product = await productService.createProduct(validatedData);

    return createSuccessResponse(product, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
