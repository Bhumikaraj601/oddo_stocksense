import { z } from "zod";

export const deliveryItemSchema = z.object({
  productId: z.string().uuid("Valid product ID is required"),
  quantityDemand: z.number().positive("Quantity demand must be greater than 0"),
  quantityDelivered: z.number().min(0, "Quantity delivered cannot be negative").default(0),
  uom: z.string().default("Units"),
});

export const deliverySchema = z.object({
  customerName: z.string().min(2, "Customer name is required").max(150),
  sourceLocationId: z.string().uuid("Valid source location is required"),
  scheduledDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(deliveryItemSchema).min(1, "At least one product item is required in a delivery order"),
});

export type DeliveryItemInput = z.infer<typeof deliveryItemSchema>;
export type DeliveryInput = z.infer<typeof deliverySchema>;
