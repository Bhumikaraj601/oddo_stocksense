import { productRepository } from "@/repositories/product.repository";
import { ProductInput, UpdateProductInput, CategoryInput } from "@/lib/validations/product";
import { NotFoundError, ConflictError } from "@/lib/utils/api-error";

export class ProductService {
  async getProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Product");
    }
    return product;
  }

  async listProducts(params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    return productRepository.list(params);
  }

  async createProduct(input: ProductInput) {
    const existing = await productRepository.findBySku(input.sku);
    if (existing) {
      throw new ConflictError(`Product with SKU "${input.sku}" already exists`);
    }

    return productRepository.create({
      name: input.name,
      sku: input.sku,
      description: input.description,
      uom: input.uom,
      categoryId: input.categoryId,
      isActive: input.isActive,
      initialStock: input.initialStock,
    });
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    await this.getProductById(id);
    return productRepository.update(id, input);
  }

  async listCategories() {
    return productRepository.listCategories();
  }

  async createCategory(input: CategoryInput) {
    return productRepository.createCategory(input);
  }
}

export const productService = new ProductService();
