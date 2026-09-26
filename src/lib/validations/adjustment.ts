import { z } from "zod";

export const adjustmentItemSchema = z.object({
  productId: z.string().uuid("Valid product ID is required"),
  theoreticalQty: z.number().min(0, "Theoretical quantity cannot be negative"),
  countedQty: z.number().min(0, "Counted quantity cannot be negative"),
  uom: z.string().default("Units"),
});

export const adjustmentSchema = z.object({
  locationId: z.string().uuid("Valid location is required"),
  reason: z.string().min(2, "Reason is required for inventory adjustment").max(255),
  items: z.array(adjustmentItemSchema).min(1, "At least one item is required for an adjustment"),
});

export type AdjustmentItemInput = z.infer<typeof adjustmentItemSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
