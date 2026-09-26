import prisma from "@/lib/prisma";
import { OperationType, Prisma } from "@prisma/client";
import { LedgerQuery } from "@/lib/validations/ledger";

export class LedgerRepository {
  async listMovements(params?: LedgerQuery) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StockLedgerWhereInput = {
      ...(params?.productId && params.productId !== "ALL"
        ? { productId: params.productId }
        : {}),
      ...(params?.operationType && params.operationType !== "ALL"
        ? { operationType: params.operationType as OperationType }
        : {}),
      ...(params?.warehouseId && params.warehouseId !== "ALL"
        ? {
            OR: [
              { sourceLocation: { warehouseId: params.warehouseId } },
              { destinationLocation: { warehouseId: params.warehouseId } },
            ],
          }
        : {}),
      ...(params?.locationId && params.locationId !== "ALL"
        ? {
            OR: [
              { sourceLocationId: params.locationId },
              { destinationLocationId: params.locationId },
            ],
          }
        : {}),
      ...(params?.startDate || params?.endDate
        ? {
            createdAt: {
              ...(params?.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params?.endDate ? { lte: new Date(params.endDate) } : {}),
            },
          }
        : {}),
      ...(params?.search
        ? {
            OR: [
              { reference: { contains: params.search, mode: "insensitive" } },
              { notes: { contains: params.search, mode: "insensitive" } },
              {
                product: {
                  OR: [
                    { name: { contains: params.search, mode: "insensitive" } },
                    { sku: { contains: params.search, mode: "insensitive" } },
                  ],
                },
              },
              {
                sourceLocation: {
                  OR: [
                    { name: { contains: params.search, mode: "insensitive" } },
                    { code: { contains: params.search, mode: "insensitive" } },
                  ],
                },
              },
              {
                destinationLocation: {
                  OR: [
                    { name: { contains: params.search, mode: "insensitive" } },
                    { code: { contains: params.search, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    // Determine sorting
    const sortBy = params?.sortBy ?? "createdAt";
    const sortOrder = params?.sortOrder ?? "desc";

    const orderBy: Prisma.StockLedgerOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      prisma.stockLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          product: {
            include: { category: true },
          },
          sourceLocation: {
            include: { warehouse: true },
          },
          destinationLocation: {
            include: { warehouse: true },
          },
          performedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.stockLedger.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getLedgerStats() {
    const [total, receipts, deliveries, transfers, adjustments] = await Promise.all([
      prisma.stockLedger.count(),
      prisma.stockLedger.count({ where: { operationType: OperationType.RECEIPT } }),
      prisma.stockLedger.count({ where: { operationType: OperationType.DELIVERY } }),
      prisma.stockLedger.count({ where: { operationType: OperationType.INTERNAL_TRANSFER } }),
      prisma.stockLedger.count({ where: { operationType: OperationType.ADJUSTMENT } }),
    ]);

    return {
      total,
      receipts,
      deliveries,
      transfers,
      adjustments,
    };
  }

  async recordMovement(data: {
    reference: string;
    operationType: OperationType;
    productId: string;
    sourceLocationId?: string | null;
    destinationLocationId?: string | null;
    quantity: number;
    uom?: string;
    performedById?: string | null;
    notes?: string | null;
  }) {
    return prisma.stockLedger.create({
      data: {
        reference: data.reference,
        operationType: data.operationType,
        productId: data.productId,
        sourceLocationId: data.sourceLocationId,
        destinationLocationId: data.destinationLocationId,
        quantity: data.quantity,
        uom: data.uom ?? "PCS",
        performedById: data.performedById,
        notes: data.notes,
      },
      include: {
        product: true,
        sourceLocation: true,
        destinationLocation: true,
      },
    });
  }
}

export const ledgerRepository = new LedgerRepository();
