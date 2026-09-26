import { NextRequest } from "next/server";
import { categoryService } from "@/services/category.service";
import { updateCategorySchema } from "@/lib/validations/product";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth } from "@/lib/auth/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const category = await categoryService.getCategoryById(id);
    return createSuccessResponse(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const updatedCategory = await categoryService.updateCategory(id, validatedData);
    return createSuccessResponse(updatedCategory);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = await categoryService.deleteCategory(id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
