import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(100),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().uuid("Invalid parent category ID").optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(150),
  sku: z.string().min(2, "SKU must be at least 2 characters").max(50).regex(/^[a-zA-Z0-9_-]+$/, "SKU can only contain alphanumeric characters, hyphens, and underscores"),
  description: z.string().max(1000).optional().nullable(),
  uom: z.string().min(1, "Unit of measure is required").default("Units"),
  categoryId: z.string().uuid("Valid category ID is required"),
  isActive: z.boolean().default(true),
  // Optional initial stock fields when creating product
  initialStock: z
    .object({
      locationId: z.string().uuid("Valid location ID is required"),
      quantity: z.number().min(0, "Quantity cannot be negative"),
    })
    .optional(),
});

export const updateProductSchema = productSchema.partial().omit({ sku: true });

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
