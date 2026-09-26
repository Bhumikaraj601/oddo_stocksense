import { z } from "zod";

export const deliveryItemInputSchema = z.object({
  productId: z.string().min(1, "Valid product ID is required"),
  locationId: z.string().min(1, "Valid source location ID is required"),
  quantityDemand: z.coerce
    .number()
    .positive("Requested quantity must be greater than 0")
    .max(1_000_000, "Requested quantity cannot exceed 1,000,000"),
  uom: z.string().min(1, "UOM is required").default("PCS"),
});

export const deliverySchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters")
    .max(150, "Customer name cannot exceed 150 characters"),
  warehouseId: z.string().min(1, "Valid warehouse ID is required"),
  sourceLocationId: z.string().optional().nullable(),
  scheduledDate: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional().nullable(),
  items: z
    .array(deliveryItemInputSchema)
    .min(1, "At least one product item is required in a delivery order"),
});

export const updateDeliverySchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters")
    .max(150, "Customer name cannot exceed 150 characters")
    .optional(),
  warehouseId: z.string().min(1).optional(),
  sourceLocationId: z.string().optional().nullable(),
  scheduledDate: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional().nullable(),
  items: z.array(deliveryItemInputSchema).min(1, "At least one product item is required").optional(),
});

export const pickItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Item ID is required"),
        pickedQuantity: z.coerce
          .number()
          .min(0, "Picked quantity cannot be negative"),
      })
    )
    .min(1, "At least one item must be picked"),
});

export const packItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Item ID is required"),
        packedQuantity: z.coerce
          .number()
          .min(0, "Packed quantity cannot be negative"),
      })
    )
    .min(1, "At least one item must be packed"),
});

export const deliveryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["ALL", "DRAFT", "WAITING", "READY", "DONE", "CANCELED"]).default("ALL"),
  warehouseId: z.string().optional(),
  sourceLocationId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type DeliveryItemInput = z.infer<typeof deliveryItemInputSchema>;
export type DeliveryInput = z.infer<typeof deliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type PickItemsInput = z.infer<typeof pickItemsSchema>;
export type PackItemsInput = z.infer<typeof packItemsSchema>;
export type DeliveryQuery = z.infer<typeof deliveryQuerySchema>;
