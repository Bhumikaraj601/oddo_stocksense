import prisma from "@/lib/prisma";
import { LocationType, Prisma } from "@prisma/client";

export class LocationRepository {
  async findById(id: string) {
    return prisma.location.findUnique({
      where: { id },
      include: {
        warehouse: true,
        parent: true,
        children: {
          include: {
            _count: { select: { stocks: true } },
          },
        },
        stocks: {
          include: {
            product: {
              include: { category: true },
            },
          },
          orderBy: { quantity: "desc" },
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
    });
  }

  async findByCode(warehouseId: string | null | undefined, code: string, excludeId?: string) {
    return prisma.location.findFirst({
      where: {
        code: { equals: code.trim(), mode: "insensitive" },
        ...(warehouseId !== undefined ? { warehouseId } : {}),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async list(params?: {
    warehouseId?: string;
    type?: LocationType | "ALL";
    status?: "ALL" | "ACTIVE" | "INACTIVE";
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.LocationWhereInput = {
      ...(params?.warehouseId && params.warehouseId !== "ALL"
        ? { warehouseId: params.warehouseId }
        : {}),
      ...(params?.type && params.type !== "ALL"
        ? { type: params.type as LocationType }
        : {}),
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
              { description: { contains: params.search, mode: "insensitive" } },
              { warehouse: { name: { contains: params.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, locations] = await Promise.all([
      prisma.location.count({ where }),
      prisma.location.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ warehouseId: "asc" }, { name: "asc" }],
        include: {
          warehouse: {
            select: { id: true, name: true, code: true, isActive: true },
          },
          parent: {
            select: { id: true, name: true, code: true },
          },
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
              children: true,
            },
          },
        },
      }),
    ]);

    return {
      data: locations,
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
    type?: LocationType;
    isScrap?: boolean;
    isActive?: boolean;
    warehouseId?: string | null;
    parentId?: string | null;
  }) {
    return prisma.location.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || null,
        type: data.type ?? LocationType.INTERNAL,
        isScrap: data.isScrap ?? false,
        isActive: data.isActive ?? true,
        warehouseId: data.warehouseId || null,
        parentId: data.parentId || null,
      },
      include: {
        warehouse: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string | null;
      type?: LocationType;
      isScrap?: boolean;
      isActive?: boolean;
      warehouseId?: string | null;
      parentId?: string | null;
    }
  ) {
    return prisma.location.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.code !== undefined ? { code: data.code.trim().toUpperCase() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.isScrap !== undefined ? { isScrap: data.isScrap } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.warehouseId !== undefined ? { warehouseId: data.warehouseId || null } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId || null } : {}),
      },
      include: {
        warehouse: true,
      },
    });
  }

  async hasHistoricalRecords(locationId: string): Promise<boolean> {
    const [stockCount, receiptCount, deliveryCount, transferCount, adjCount, ledgerCount] =
      await Promise.all([
        prisma.stock.count({
          where: { locationId, quantity: { gt: 0 } },
        }),
        prisma.receipt.count({
          where: { destinationLocationId: locationId },
        }),
        prisma.delivery.count({
          where: { sourceLocationId: locationId },
        }),
        prisma.internalTransfer.count({
          where: {
            OR: [
              { sourceLocationId: locationId },
              { destinationLocationId: locationId },
            ],
          },
        }),
        prisma.adjustment.count({
          where: { locationId },
        }),
        prisma.stockLedger.count({
          where: {
            OR: [
              { sourceLocationId: locationId },
              { destinationLocationId: locationId },
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
      return prisma.location.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.location.delete({
      where: { id },
    });
  }
}

export const locationRepository = new LocationRepository();
