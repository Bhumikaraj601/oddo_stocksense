import { productRepository } from "@/repositories/product.repository";
import { categoryRepository } from "@/repositories/category.repository";
import { locationRepository } from "@/repositories/location.repository";
import { ProductInput, UpdateProductInput, ProductQueryParams } from "@/lib/validations/product";
import { NotFoundError, ConflictError, ValidationError } from "@/lib/utils/api-error";

export class ProductService {
  async getProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Product");
    }
    return product;
  }

  async listProducts(params?: ProductQueryParams) {
    return productRepository.list({
      search: params?.search,
      categoryId: params?.categoryId,
      status: params?.status,
      stockStatus: params?.stockStatus,
      page: params?.page,
      limit: params?.limit,
    });
  }

  async getLowStockProducts() {
    return productRepository.getLowStockProducts();
  }

  async getLowStockStats() {
    return productRepository.countLowStockAndOutOfStock();
  }

  async createProduct(input: ProductInput) {
    // 1. Verify SKU uniqueness (case-insensitive)
    const existingSku = await productRepository.findBySku(input.sku);
    if (existingSku) {
      throw new ConflictError(`Product with SKU "${input.sku.toUpperCase()}" already exists.`);
    }

    // 2. Verify Category exists
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new ValidationError("Selected category does not exist in the database.");
    }

    // 3. Verify Location exists if initial stock is provided
    if (input.initialStock && input.initialStock.quantity > 0) {
      const location = await locationRepository.findById(
        input.initialStock.locationId
      );
      if (!location) {
        throw new ValidationError(
          "Selected initial stock location does not exist. Please select a valid warehouse location."
        );
      }
    }

    return productRepository.create({
      name: input.name,
      sku: input.sku,
      description: input.description,
      uom: input.uom,
      categoryId: input.categoryId,
      minimumStock: input.minimumStock ?? 0,
      isActive: input.isActive,
      initialStock: input.initialStock,
    });
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const product = await this.getProductById(id);

    // If SKU is being updated, verify uniqueness
    if (input.sku && input.sku.toUpperCase() !== product.sku.toUpperCase()) {
      const existingSku = await productRepository.findBySku(input.sku, id);
      if (existingSku) {
        throw new ConflictError(
          `Product with SKU "${input.sku.toUpperCase()}" already exists.`
        );
      }
    }

    // If category is being updated, verify category exists
    if (input.categoryId && input.categoryId !== product.categoryId) {
      const category = await categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new ValidationError("Selected category does not exist.");
      }
    }

    return productRepository.update(id, input);
  }

  async deactivateProduct(id: string) {
    await this.getProductById(id);
    return productRepository.update(id, { isActive: false });
  }

  async activateProduct(id: string) {
    await this.getProductById(id);
    return productRepository.update(id, { isActive: true });
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);

    const hasHistory = await productRepository.hasHistoricalRecords(id);
    if (hasHistory) {
      // Deactivate instead of hard deleting to preserve inventory history
      await productRepository.update(id, { isActive: false });
      return {
        success: true,
        deactivated: true,
        message:
          "Product has associated stock or operational records. It has been deactivated instead of deleted to preserve inventory audit history.",
      };
    }

    await productRepository.delete(id);
    return {
      success: true,
      deactivated: false,
      message: "Product permanently deleted from catalog.",
    };
  }
}

export const productService = new ProductService();
