import prisma from "@/lib/prisma";
import { OperationType, Prisma } from "@prisma/client";

export class LedgerRepository {
  async listMovements(params?: {
    productId?: string;
    operationType?: OperationType;
    reference?: string;
    limit?: number;
    page?: number;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.StockLedgerWhereInput = {
      ...(params?.productId ? { productId: params.productId } : {}),
      ...(params?.operationType ? { operationType: params.operationType } : {}),
      ...(params?.reference
        ? { reference: { contains: params.reference, mode: "insensitive" } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.stockLedger.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: true,
          sourceLocation: { include: { warehouse: true } },
          destinationLocation: { include: { warehouse: true } },
          performedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.stockLedger.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
        uom: data.uom ?? "Units",
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
