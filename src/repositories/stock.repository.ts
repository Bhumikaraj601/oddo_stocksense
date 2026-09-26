import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class StockRepository {
  async getStock(productId: string, locationId: string) {
    return prisma.stock.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      include: {
        product: {
          include: { category: true },
        },
        location: {
          include: { warehouse: true },
        },
      },
    });
  }

  async listStock(params?: {
    warehouseId?: string;
    locationId?: string;
    productId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.StockWhereInput = {
      ...(params?.locationId && params.locationId !== "ALL"
        ? { locationId: params.locationId }
        : {}),
      ...(params?.warehouseId && params.warehouseId !== "ALL"
        ? { location: { warehouseId: params.warehouseId } }
        : {}),
      ...(params?.productId ? { productId: params.productId } : {}),
      ...(params?.search
        ? {
            OR: [
              { product: { name: { contains: params.search, mode: "insensitive" } } },
              { product: { sku: { contains: params.search, mode: "insensitive" } } },
              { location: { name: { contains: params.search, mode: "insensitive" } } },
              { location: { code: { contains: params.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, stocks] = await Promise.all([
      prisma.stock.count({ where }),
      prisma.stock.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ location: { warehouseId: "asc" } }, { quantity: "desc" }],
        include: {
          product: {
            include: { category: true },
          },
          location: {
            include: { warehouse: true },
          },
        },
      }),
    ]);

    return {
      data: stocks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async listStockByProduct(productId: string) {
    return prisma.stock.findMany({
      where: { productId },
      include: {
        location: {
          include: { warehouse: true },
        },
      },
      orderBy: { quantity: "desc" },
    });
  }

  async listStockByLocation(locationId: string) {
    return prisma.stock.findMany({
      where: { locationId },
      include: {
        product: {
          include: { category: true },
        },
        location: {
          include: { warehouse: true },
        },
      },
      orderBy: { quantity: "desc" },
    });
  }

  async listStockByWarehouse(warehouseId: string) {
    return prisma.stock.findMany({
      where: {
        location: { warehouseId },
      },
      include: {
        product: {
          include: { category: true },
        },
        location: {
          include: { warehouse: true },
        },
      },
      orderBy: { quantity: "desc" },
    });
  }

  async getTotalStockForProduct(productId: string): Promise<number> {
    const aggregate = await prisma.stock.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    return aggregate._sum.quantity ?? 0;
  }

  async listReorderRules(productId?: string) {
    return prisma.reorderRule.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: true,
        warehouse: true,
        location: true,
      },
    });
  }

  async createOrUpdateStock(
    productId: string,
    locationId: string,
    quantity: number,
    reservedQuantity: number = 0
  ) {
    return prisma.stock.upsert({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      update: {
        quantity,
        reservedQuantity,
      },
      create: {
        productId,
        locationId,
        quantity,
        reservedQuantity,
      },
      include: {
        product: true,
        location: true,
      },
    });
  }
}

export const stockRepository = new StockRepository();
