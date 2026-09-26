import { z } from "zod";

export const transferItemInputSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce
    .number()
    .positive("Transfer quantity must be greater than 0")
    .max(1_000_000, "Quantity cannot exceed 1,000,000"),
  uom: z.string().min(1, "UOM is required").default("PCS"),
});

export const transferSchema = z
  .object({
    sourceWarehouseId: z.string().optional().nullable(),
    sourceLocationId: z.string().min(1, "Source location is required"),
    destinationWarehouseId: z.string().optional().nullable(),
    destinationLocationId: z.string().min(1, "Destination location is required"),
    scheduledDate: z.coerce.date().optional().nullable(),
    notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional().nullable(),
    items: z
      .array(transferItemInputSchema)
      .min(1, "At least one product line item is required in a transfer"),
  })
  .refine(
    (data) => data.sourceLocationId !== data.destinationLocationId,
    {
      message: "Source location and destination location cannot be the same",
      path: ["destinationLocationId"],
    }
  );

export const updateTransferSchema = z
  .object({
    sourceWarehouseId: z.string().optional().nullable(),
    sourceLocationId: z.string().min(1).optional(),
    destinationWarehouseId: z.string().optional().nullable(),
    destinationLocationId: z.string().min(1).optional(),
    scheduledDate: z.coerce.date().optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    items: z.array(transferItemInputSchema).min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.sourceLocationId && data.destinationLocationId) {
        return data.sourceLocationId !== data.destinationLocationId;
      }
      return true;
    },
    {
      message: "Source location and destination location cannot be the same",
      path: ["destinationLocationId"],
    }
  );

export const transferQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["ALL", "DRAFT", "WAITING", "READY", "DONE", "CANCELED"]).default("ALL"),
  sourceWarehouseId: z.string().optional(),
  destinationWarehouseId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type TransferItemInput = z.infer<typeof transferItemInputSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
export type TransferQuery = z.infer<typeof transferQuerySchema>;
