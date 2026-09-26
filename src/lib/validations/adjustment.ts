import { z } from "zod";

export const adjustmentItemInputSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  countedQty: z.coerce
    .number()
    .min(0, "Counted quantity must be 0 or greater")
    .max(1_000_000, "Quantity cannot exceed 1,000,000"),
  theoreticalQty: z.coerce.number().optional().default(0),
  uom: z.string().min(1, "UOM is required").default("PCS"),
});

export const adjustmentSchema = z.object({
  warehouseId: z.string().optional().nullable(),
  locationId: z.string().min(1, "Location is required"),
  reason: z.string().trim().max(1000, "Reason cannot exceed 1000 characters").optional().nullable(),
  items: z
    .array(adjustmentItemInputSchema)
    .min(1, "At least one product line item is required in an adjustment"),
});

export const updateAdjustmentSchema = z.object({
  warehouseId: z.string().optional().nullable(),
  locationId: z.string().min(1).optional(),
  reason: z.string().trim().max(1000).optional().nullable(),
  items: z.array(adjustmentItemInputSchema).min(1).optional(),
});

export const adjustmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["ALL", "DRAFT", "DONE", "CANCELED"]).default("ALL"),
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AdjustmentItemInput = z.infer<typeof adjustmentItemInputSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
export type UpdateAdjustmentInput = z.infer<typeof updateAdjustmentSchema>;
export type AdjustmentQuery = z.infer<typeof adjustmentQuerySchema>;
