import { NextRequest } from "next/server";
import { categoryService } from "@/services/category.service";
import { categorySchema } from "@/lib/validations/product";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive =
      isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;

    const categories = await categoryService.listCategories({ search, isActive });
    return createSuccessResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const category = await categoryService.createCategory(validatedData);
    return createSuccessResponse(category, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
