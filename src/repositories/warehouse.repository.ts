import prisma from "@/lib/prisma";
import { LocationType } from "@prisma/client";

export class WarehouseRepository {
  async listWarehouses() {
    return prisma.warehouse.findMany({
      include: {
        locations: {
          include: {
            _count: { select: { stocks: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findWarehouseById(id: string) {
    return prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: true,
      },
    });
  }

  async createWarehouse(data: {
    name: string;
    code: string;
    address?: string | null;
    isActive?: boolean;
  }) {
    return prisma.warehouse.create({
      data,
    });
  }

  async listLocations(warehouseId?: string) {
    return prisma.location.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: {
        warehouse: true,
        parent: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async findLocationById(id: string) {
    return prisma.location.findUnique({
      where: { id },
      include: {
        warehouse: true,
        parent: true,
        stocks: {
          include: { product: true },
        },
      },
    });
  }

  async createLocation(data: {
    name: string;
    code: string;
    type?: LocationType;
    isScrap?: boolean;
    warehouseId?: string | null;
    parentId?: string | null;
  }) {
    return prisma.location.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type ?? LocationType.INTERNAL,
        isScrap: data.isScrap ?? false,
        warehouseId: data.warehouseId,
        parentId: data.parentId,
      },
    });
  }
}

export const warehouseRepository = new WarehouseRepository();
