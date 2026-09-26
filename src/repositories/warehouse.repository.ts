import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class WarehouseRepository {
  async findById(id: string) {
    return prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            stocks: {
              include: {
                product: {
                  select: { id: true, name: true, sku: true, uom: true },
                },
              },
            },
            _count: {
              select: {
                stocks: true,
                receiptDestinations: true,
                deliverySources: true,
                transferSources: true,
                transferDestinations: true,
                adjustments: true,
                sourceMovements: true,
                destMovements: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
        reorderRules: {
          include: { product: true },
        },
        _count: {
          select: {
            locations: true,
            reorderRules: true,
          },
        },
      },
    });
  }

  async findByCode(code: string, excludeId?: string) {
    return prisma.warehouse.findFirst({
      where: {
        code: { equals: code.trim(), mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async findByName(name: string, excludeId?: string) {
    return prisma.warehouse.findFirst({
      where: {
        name: { equals: name.trim(), mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async list(params?: {
    search?: string;
    status?: "ALL" | "ACTIVE" | "INACTIVE";
    page?: number;
    limit?: number;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.WarehouseWhereInput = {
      ...(params?.status === "ACTIVE"
        ? { isActive: true }
        : params?.status === "INACTIVE"
        ? { isActive: false }
        : {}),
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { code: { contains: params.search, mode: "insensitive" } },
              { address: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, warehouses] = await Promise.all([
      prisma.warehouse.count({ where }),
      prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          locations: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
              isActive: true,
              _count: { select: { stocks: true } },
            },
          },
          _count: {
            select: {
              locations: true,
              reorderRules: true,
            },
          },
        },
      }),
    ]);

    return {
      data: warehouses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async create(data: {
    name: string;
    code: string;
    description?: string | null;
    address?: string | null;
    isActive?: boolean;
  }) {
    return prisma.warehouse.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || null,
        address: data.address?.trim() || null,
        isActive: data.isActive ?? true,
      },
      include: {
        locations: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string | null;
      address?: string | null;
      isActive?: boolean;
    }
  ) {
    return prisma.warehouse.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.code !== undefined ? { code: data.code.trim().toUpperCase() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: {
        locations: true,
      },
    });
  }

  async hasHistoricalRecords(warehouseId: string): Promise<boolean> {
    const locations = await prisma.location.findMany({
      where: { warehouseId },
      select: { id: true },
    });

    const locationIds = locations.map((loc) => loc.id);
    if (locationIds.length === 0) return false;

    const [stockCount, receiptCount, deliveryCount, transferCount, adjCount, ledgerCount] =
      await Promise.all([
        prisma.stock.count({
          where: { locationId: { in: locationIds }, quantity: { gt: 0 } },
        }),
        prisma.receipt.count({
          where: { destinationLocationId: { in: locationIds } },
        }),
        prisma.delivery.count({
          where: { sourceLocationId: { in: locationIds } },
        }),
        prisma.internalTransfer.count({
          where: {
            OR: [
              { sourceLocationId: { in: locationIds } },
              { destinationLocationId: { in: locationIds } },
            ],
          },
        }),
        prisma.adjustment.count({
          where: { locationId: { in: locationIds } },
        }),
        prisma.stockLedger.count({
          where: {
            OR: [
              { sourceLocationId: { in: locationIds } },
              { destinationLocationId: { in: locationIds } },
            ],
          },
        }),
      ]);

    return (
      stockCount > 0 ||
      receiptCount > 0 ||
      deliveryCount > 0 ||
      transferCount > 0 ||
      adjCount > 0 ||
      ledgerCount > 0
    );
  }

  async delete(id: string) {
    const hasHistory = await this.hasHistoricalRecords(id);

    if (hasHistory) {
      // Soft deactivate warehouse and its locations
      return prisma.$transaction([
        prisma.location.updateMany({
          where: { warehouseId: id },
          data: { isActive: false },
        }),
        prisma.warehouse.update({
          where: { id },
          data: { isActive: false },
        }),
      ]);
    }

    return prisma.warehouse.delete({
      where: { id },
    });
  }
}

export const warehouseRepository = new WarehouseRepository();
