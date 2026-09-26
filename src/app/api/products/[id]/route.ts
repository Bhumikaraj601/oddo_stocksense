import { NextRequest } from "next/server";
import { productService } from "@/services/product.service";
import { updateProductSchema } from "@/lib/validations/product";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth } from "@/lib/auth/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await productService.getProductById(id);
    return createSuccessResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    const updatedProduct = await productService.updateProduct(id, validatedData);
    return createSuccessResponse(updatedProduct);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = await productService.deleteProduct(id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
