import { z } from "zod";

export const transferItemSchema = z.object({
  productId: z.string().uuid("Valid product ID is required"),
  quantity: z.number().positive("Transfer quantity must be greater than 0"),
  uom: z.string().default("Units"),
});

export const transferSchema = z
  .object({
    sourceLocationId: z.string().uuid("Valid source location is required"),
    destinationLocationId: z.string().uuid("Valid destination location is required"),
    scheduledDate: z.coerce.date().optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    items: z.array(transferItemSchema).min(1, "At least one item is required for an internal transfer"),
  })
  .refine((data) => data.sourceLocationId !== data.destinationLocationId, {
    message: "Source location and destination location cannot be the same",
    path: ["destinationLocationId"],
  });

export type TransferItemInput = z.infer<typeof transferItemSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
