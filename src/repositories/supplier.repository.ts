import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class SupplierRepository {
  async findById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { receipts: true } },
      },
    });
  }

  async findByName(name: string, excludeId?: string) {
    return prisma.supplier.findFirst({
      where: {
        name: { equals: name.trim(), mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async findByCode(code: string, excludeId?: string) {
    return prisma.supplier.findFirst({
      where: {
        code: { equals: code.trim(), mode: "insensitive" },
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
    const limit = params?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {
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
              { email: { contains: params.search, mode: "insensitive" } },
              { phone: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: { select: { receipts: true } },
        },
      }),
    ]);

    return {
      data: suppliers,
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
    code?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    isActive?: boolean;
  }) {
    return prisma.supplier.create({
      data: {
        name: data.name.trim(),
        code: data.code?.trim().toUpperCase() || null,
        email: data.email?.trim().toLowerCase() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      code?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      isActive?: boolean;
    }
  ) {
    return prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.code !== undefined ? { code: data.code?.trim().toUpperCase() || null } : {}),
        ...(data.email !== undefined ? { email: data.email?.trim().toLowerCase() || null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async delete(id: string) {
    const receiptsCount = await prisma.receipt.count({
      where: { supplierId: id },
    });

    if (receiptsCount > 0) {
      return prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.supplier.delete({
      where: { id },
    });
  }
}

export const supplierRepository = new SupplierRepository();
