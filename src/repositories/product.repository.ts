import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ProductRepository {
  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, isActive: true },
        },
        stocks: {
          include: {
            location: {
              include: { warehouse: true },
            },
          },
          orderBy: { quantity: "desc" },
        },
        reorderRules: {
          include: {
            warehouse: true,
            location: true,
          },
        },
        _count: {
          select: {
            stocks: true,
            receiptItems: true,
            deliveryItems: true,
            transferItems: true,
            adjustmentItems: true,
            ledgerEntries: true,
          },
        },
      },
    });
  }

  async findBySku(sku: string, excludeId?: string) {
    return prisma.product.findFirst({
      where: {
        sku: { equals: sku.trim(), mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: { category: true },
    });
  }

  async list(params?: {
    search?: string;
    categoryId?: string;
    status?: "ALL" | "ACTIVE" | "INACTIVE";
    page?: number;
    limit?: number;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(params?.status === "ACTIVE"
        ? { isActive: true }
        : params?.status === "INACTIVE"
        ? { isActive: false }
        : {}),
      ...(params?.categoryId && params.categoryId !== "ALL"
        ? { categoryId: params.categoryId }
        : {}),
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
          category: {
            select: { id: true, name: true },
          },
          stocks: {
            include: {
              location: {
                select: { id: true, name: true, code: true, warehouse: { select: { name: true } } },
              },
            },
          },
          _count: {
            select: { stocks: true, ledgerEntries: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate total on-hand quantity per product
    const enrichedItems = items.map((product) => {
      const totalStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
      return {
        ...product,
        totalStock,
      };
    });

    return {
      items: enrichedItems,
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
          name: data.name.trim(),
          sku: data.sku.trim().toUpperCase(),
          description: data.description?.trim() || null,
          uom: data.uom ?? "PCS",
          categoryId: data.categoryId,
          isActive: data.isActive ?? true,
        },
        include: {
          category: true,
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

        // Record initial balance into traceable stock ledger
        await tx.stockLedger.create({
          data: {
            reference: `INIT-${product.sku}`,
            operationType: "ADJUSTMENT",
            productId: product.id,
            destinationLocationId: data.initialStock.locationId,
            quantity: data.initialStock.quantity,
            uom: product.uom,
            notes: "Initial inventory allocation on product creation",
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
      sku?: string;
      description?: string | null;
      uom?: string;
      categoryId?: string;
      isActive?: boolean;
    }
  ) {
    return prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.sku !== undefined ? { sku: data.sku.trim().toUpperCase() } : {}),
        ...(data.description !== undefined
          ? { description: data.description?.trim() || null }
          : {}),
        ...(data.uom !== undefined ? { uom: data.uom } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: {
        category: true,
        stocks: {
          include: { location: { include: { warehouse: true } } },
        },
      },
    });
  }

  async hasHistoricalRecords(id: string): Promise<boolean> {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            stocks: true,
            receiptItems: true,
            deliveryItems: true,
            transferItems: true,
            adjustmentItems: true,
            ledgerEntries: true,
          },
        },
      },
    });

    if (!product) return false;

    const counts = product._count;
    const totalTransactions =
      counts.receiptItems +
      counts.deliveryItems +
      counts.transferItems +
      counts.adjustmentItems +
      counts.ledgerEntries;

    return totalTransactions > 0;
  }

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      // Remove stocks and reorder rules if safe
      await tx.stock.deleteMany({ where: { productId: id } });
      await tx.reorderRule.deleteMany({ where: { productId: id } });
      return tx.product.delete({ where: { id } });
    });
  }

  async countTotal() {
    return prisma.product.count({ where: { isActive: true } });
  }
}

export const productRepository = new ProductRepository();
