import { z } from "zod";
import { OperationType } from "@prisma/client";

export const ledgerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  productId: z.string().optional(),
  operationType: z
    .enum(["ALL", "RECEIPT", "DELIVERY", "INTERNAL_TRANSFER", "ADJUSTMENT"])
    .default("ALL"),
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["createdAt", "quantity", "reference", "operationType"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type LedgerQuery = z.infer<typeof ledgerQuerySchema>;
