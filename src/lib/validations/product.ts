import { z } from "zod";
import { UNITS_OF_MEASURE } from "@/lib/constants";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters")
    .trim(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  isActive: z.boolean().default(true),
  parentId: z.string().uuid("Invalid parent category ID").optional().nullable(),
});

export const updateCategorySchema = categorySchema.partial();

export const productSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters")
    .trim(),
  sku: z
    .string()
    .min(2, "SKU must be at least 2 characters")
    .max(50, "SKU cannot exceed 50 characters")
    .trim()
    .toUpperCase()
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "SKU can only contain alphanumeric characters, hyphens, and underscores"
    ),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().nullable(),
  uom: z.enum(UNITS_OF_MEASURE, {
    message: `Unit of measure must be one of: ${UNITS_OF_MEASURE.join(", ")}`,
  }).default("PCS"),
  categoryId: z.string().uuid("Valid category ID is required"),
  minimumStock: z.coerce.number().min(0, "Minimum stock cannot be negative").default(0),
  isActive: z.boolean().default(true),
  // Optional initial stock allocation to a specific location
  initialStock: z
    .object({
      locationId: z.string().uuid("Valid warehouse location ID is required"),
      quantity: z.number().min(0, "Initial stock quantity cannot be negative"),
    })
    .optional(),
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters")
    .trim()
    .optional(),
  sku: z
    .string()
    .min(2, "SKU must be at least 2 characters")
    .max(50, "SKU cannot exceed 50 characters")
    .trim()
    .toUpperCase()
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "SKU can only contain alphanumeric characters, hyphens, and underscores"
    )
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  uom: z.enum(UNITS_OF_MEASURE).optional(),
  categoryId: z.string().uuid("Valid category ID is required").optional(),
  minimumStock: z.coerce.number().min(0, "Minimum stock cannot be negative").optional(),
  isActive: z.boolean().optional(),
});

export const productQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
  stockStatus: z.enum(["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).default("ALL"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ProductInput = {
  name: string;
  sku: string;
  description?: string | null;
  uom?: (typeof UNITS_OF_MEASURE)[number];
  categoryId: string;
  minimumStock?: number;
  isActive?: boolean;
  initialStock?: {
    locationId: string;
    quantity: number;
  };
};
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = {
  search?: string;
  categoryId?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  stockStatus?: "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  page?: number;
  limit?: number;
};
