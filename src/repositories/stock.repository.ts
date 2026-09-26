import prisma from "@/lib/prisma";

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
        product: true,
        location: true,
      },
    });
  }

  async listStockByProduct(productId: string) {
    return prisma.stock.findMany({
      where: { productId },
      include: {
        location: {
          include: { warehouse: true },
        },
      },
    });
  }

  async listStockByLocation(locationId: string) {
    return prisma.stock.findMany({
      where: { locationId },
      include: {
        product: {
          include: { category: true },
        },
      },
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

  async createOrUpdateStock(productId: string, locationId: string, quantity: number) {
    return prisma.stock.upsert({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      update: {
        quantity,
      },
      create: {
        productId,
        locationId,
        quantity,
      },
    });
  }
}

export const stockRepository = new StockRepository();
