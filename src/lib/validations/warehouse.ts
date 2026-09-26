import { z } from "zod";

export const warehouseSchema = z.object({
  name: z.string().min(2, "Warehouse name must be at least 2 characters").max(100),
  code: z.string().min(2, "Warehouse code must be at least 2 characters").max(20).regex(/^[a-zA-Z0-9_-]+$/, "Code can only contain alphanumeric characters, hyphens, and underscores"),
  address: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const locationSchema = z.object({
  name: z.string().min(2, "Location name must be at least 2 characters").max(100),
  code: z.string().min(2, "Location code must be at least 2 characters").max(30),
  type: z.enum(["INTERNAL", "VENDOR", "CUSTOMER", "INVENTORY_LOSS", "PRODUCTION", "TRANSIT"]).default("INTERNAL"),
  isScrap: z.boolean().default(false),
  warehouseId: z.string().uuid("Valid warehouse ID is required").optional().nullable(),
  parentId: z.string().uuid("Invalid parent location ID").optional().nullable(),
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
