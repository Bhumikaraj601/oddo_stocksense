import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class CategoryRepository {
  async list(params?: { search?: string; isActive?: boolean }) {
    const where: Prisma.CategoryWhereInput = {
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return prisma.category.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, isActive: true } },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          take: 10,
          select: { id: true, name: true, sku: true, uom: true, isActive: true },
        },
        _count: { select: { products: true } },
      },
    });
  }

  async findByName(name: string, excludeId?: string) {
    return prisma.category.findFirst({
      where: {
        name: { equals: name.trim(), mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async create(data: {
    name: string;
    description?: string | null;
    parentId?: string | null;
    isActive?: boolean;
  }) {
    return prisma.category.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        parentId: data.parentId || null,
        isActive: data.isActive ?? true,
      },
      include: {
        parent: true,
        _count: { select: { products: true } },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      parentId?: string | null;
      isActive?: boolean;
    }
  ) {
    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined
          ? { description: data.description?.trim() || null }
          : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: {
        parent: true,
        _count: { select: { products: true } },
      },
    });
  }

  async countProductsInCategory(categoryId: string): Promise<number> {
    return prisma.product.count({
      where: { categoryId },
    });
  }

  async delete(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryRepository = new CategoryRepository();
