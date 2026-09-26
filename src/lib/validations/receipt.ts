import { z } from "zod";

export const receiptItemSchema = z.object({
  productId: z.string().uuid("Valid product ID is required"),
  quantityExpected: z.number().positive("Quantity expected must be greater than 0"),
  quantityReceived: z.number().min(0, "Quantity received cannot be negative").default(0),
  uom: z.string().default("Units"),
});

export const receiptSchema = z.object({
  supplierName: z.string().min(2, "Supplier name is required").max(150),
  destinationLocationId: z.string().uuid("Valid destination location is required"),
  scheduledDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(receiptItemSchema).min(1, "At least one product item is required in a receipt"),
});

export type ReceiptItemInput = z.infer<typeof receiptItemSchema>;
export type ReceiptInput = z.infer<typeof receiptSchema>;
