import { categoryRepository } from "@/repositories/category.repository";
import { CategoryInput, UpdateCategoryInput } from "@/lib/validations/product";
import { NotFoundError, ConflictError, ValidationError } from "@/lib/utils/api-error";

export class CategoryService {
  async listCategories(params?: { search?: string; isActive?: boolean }) {
    return categoryRepository.list(params);
  }

  async getCategoryById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Category");
    }
    return category;
  }

  async createCategory(input: CategoryInput) {
    const existing = await categoryRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError(
        `Category with name "${input.name.trim()}" already exists (case-insensitive duplicate).`
      );
    }

    if (input.parentId) {
      const parent = await categoryRepository.findById(input.parentId);
      if (!parent) {
        throw new ValidationError("Selected parent category does not exist.");
      }
    }

    return categoryRepository.create(input);
  }

  async updateCategory(id: string, input: UpdateCategoryInput) {
    await this.getCategoryById(id);

    if (input.name) {
      const existing = await categoryRepository.findByName(input.name, id);
      if (existing) {
        throw new ConflictError(
          `Category with name "${input.name.trim()}" already exists.`
        );
      }
    }

    if (input.parentId) {
      if (input.parentId === id) {
        throw new ValidationError("A category cannot be its own parent.");
      }
      const parent = await categoryRepository.findById(input.parentId);
      if (!parent) {
        throw new ValidationError("Selected parent category does not exist.");
      }
    }

    return categoryRepository.update(id, input);
  }

  async deactivateCategory(id: string) {
    await this.getCategoryById(id);
    return categoryRepository.update(id, { isActive: false });
  }

  async activateCategory(id: string) {
    await this.getCategoryById(id);
    return categoryRepository.update(id, { isActive: true });
  }

  async deleteCategory(id: string) {
    await this.getCategoryById(id);

    const productCount = await categoryRepository.countProductsInCategory(id);
    if (productCount > 0) {
      // Soft-deactivate instead of hard delete to protect relations
      await categoryRepository.update(id, { isActive: false });
      return {
        success: true,
        deactivated: true,
        message: `Category has ${productCount} associated product(s). It has been deactivated instead of permanently deleted.`,
      };
    }

    await categoryRepository.delete(id);
    return {
      success: true,
      deactivated: false,
      message: "Category permanently deleted.",
    };
  }
}

export const categoryService = new CategoryService();
