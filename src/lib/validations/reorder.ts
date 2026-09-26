import { z } from "zod";

export const reorderRuleSchema = z
  .object({
    productId: z.string().uuid("Valid product ID is required"),
    warehouseId: z.string().uuid("Valid warehouse ID is required"),
    locationId: z.string().uuid("Valid location ID is required").optional().nullable(),
    minStock: z.number().min(0, "Minimum stock cannot be negative"),
    maxStock: z.number().min(0, "Maximum stock cannot be negative"),
    reorderQty: z.number().positive("Reorder quantity must be greater than 0"),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.maxStock >= data.minStock, {
    message: "Maximum stock must be greater than or equal to minimum stock",
    path: ["maxStock"],
  });

export type ReorderRuleInput = z.infer<typeof reorderRuleSchema>;
