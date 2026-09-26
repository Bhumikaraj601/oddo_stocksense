import prisma from "@/lib/prisma";
import { OperationStatus } from "@prisma/client";

export class OperationRepository {
  // Receipts
  async listReceipts(status?: OperationStatus) {
    return prisma.receipt.findMany({
      where: status ? { status } : undefined,
      include: {
        destinationLocation: { include: { warehouse: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async countPendingReceipts(): Promise<number> {
    return prisma.receipt.count({
      where: {
        status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
      },
    });
  }

  // Deliveries
  async listDeliveries(status?: OperationStatus) {
    return prisma.delivery.findMany({
      where: status ? { status } : undefined,
      include: {
        sourceLocation: { include: { warehouse: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async countPendingDeliveries(): Promise<number> {
    return prisma.delivery.count({
      where: {
        status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
      },
    });
  }

  // Transfers
  async listTransfers(status?: OperationStatus) {
    return prisma.internalTransfer.findMany({
      where: status ? { status } : undefined,
      include: {
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async countInternalTransfers(): Promise<number> {
    return prisma.internalTransfer.count({
      where: {
        status: { not: OperationStatus.CANCELED },
      },
    });
  }

  // Adjustments
  async listAdjustments(status?: OperationStatus) {
    return prisma.adjustment.findMany({
      where: status ? { status } : undefined,
      include: {
        location: { include: { warehouse: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const operationRepository = new OperationRepository();
