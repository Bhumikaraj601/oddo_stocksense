import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ProductRepository {
  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stocks: {
          include: {
            location: {
              include: { warehouse: true },
            },
          },
        },
        reorderRules: true,
      },
    });
  }

  async findBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
      include: { category: true },
    });
  }

  async list(params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { sku: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          stocks: {
            include: { location: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: {
    name: string;
    sku: string;
    description?: string | null;
    uom?: string;
    categoryId: string;
    isActive?: boolean;
    initialStock?: {
      locationId: string;
      quantity: number;
    };
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          description: data.description,
          uom: data.uom ?? "Units",
          categoryId: data.categoryId,
          isActive: data.isActive ?? true,
        },
      });

      if (data.initialStock && data.initialStock.quantity > 0) {
        await tx.stock.create({
          data: {
            productId: product.id,
            locationId: data.initialStock.locationId,
            quantity: data.initialStock.quantity,
          },
        });

        // Record in ledger
        await tx.stockLedger.create({
          data: {
            reference: `INIT-${product.sku}`,
            operationType: "ADJUSTMENT",
            productId: product.id,
            destinationLocationId: data.initialStock.locationId,
            quantity: data.initialStock.quantity,
            uom: product.uom,
            notes: "Initial stock on product creation",
          },
        });
      }

      return product;
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      uom?: string;
      categoryId?: string;
      isActive?: boolean;
    }
  ) {
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async countTotal() {
    return prisma.product.count({ where: { isActive: true } });
  }

  // Categories
  async listCategories() {
    return prisma.category.findMany({
      include: {
        parent: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async createCategory(data: { name: string; description?: string | null; parentId?: string | null }) {
    return prisma.category.create({ data });
  }
}

export const productRepository = new ProductRepository();
