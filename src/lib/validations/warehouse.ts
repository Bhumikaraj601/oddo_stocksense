import { z } from "zod";

export const LOCATION_TYPES = [
  "INTERNAL",
  "VENDOR",
  "CUSTOMER",
  "INVENTORY_LOSS",
  "PRODUCTION",
  "TRANSIT",
] as const;

export const warehouseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Warehouse name must be at least 2 characters")
    .max(100, "Warehouse name cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Warehouse code must be at least 2 characters")
    .max(20, "Warehouse code cannot exceed 20 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain alphanumeric characters, hyphens, and underscores")
    .transform((val) => val.toUpperCase()),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  address: z.string().trim().max(500, "Address cannot exceed 500 characters").optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateWarehouseSchema = warehouseSchema.partial();

export const locationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Location name must be at least 2 characters")
    .max(100, "Location name cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Location code must be at least 2 characters")
    .max(30, "Location code cannot exceed 30 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain alphanumeric characters, hyphens, and underscores")
    .transform((val) => val.toUpperCase()),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  type: z.enum(LOCATION_TYPES, {
    message: "Invalid location type",
  }).default("INTERNAL"),
  isScrap: z.boolean().default(false),
  isActive: z.boolean().default(true),
  warehouseId: z.string().min(1, "Warehouse ID is required").optional().nullable(),
  parentId: z.string().optional().nullable(),
});

export const updateLocationSchema = locationSchema.partial();

export const warehouseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
});

export const locationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  warehouseId: z.string().optional(),
  type: z.enum([...LOCATION_TYPES, "ALL"]).default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
  search: z.string().optional(),
});

export const stockQuerySchema = z.object({
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
  productId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type WarehouseQuery = z.infer<typeof warehouseQuerySchema>;
export type LocationQuery = z.infer<typeof locationQuerySchema>;
export type StockQuery = z.infer<typeof stockQuerySchema>;

