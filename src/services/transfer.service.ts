import { transferRepository } from "@/repositories/transfer.repository";
import { productRepository } from "@/repositories/product.repository";
import { warehouseRepository } from "@/repositories/warehouse.repository";
import { locationRepository } from "@/repositories/location.repository";
import { stockRepository } from "@/repositories/stock.repository";
import {
  TransferInput,
  UpdateTransferInput,
  TransferQuery,
  transferSchema,
  updateTransferSchema,
  transferQuerySchema,
} from "@/lib/validations/transfer";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/utils/api-error";
import { OperationStatus } from "@prisma/client";

export class TransferService {
  async getTransfers(query?: TransferQuery) {
    const validated = query ? transferQuerySchema.parse(query) : undefined;
    return transferRepository.list(validated);
  }

  async getTransferById(id: string) {
    const transfer = await transferRepository.findById(id);
    if (!transfer) {
      throw new NotFoundError("Internal Transfer");
    }
    return transfer;
  }

  async createTransfer(input: TransferInput, createdById: string) {
    const validated = transferSchema.parse(input);

    // 1. Validate Source Location
    const sourceLoc = await locationRepository.findById(validated.sourceLocationId);
    if (!sourceLoc) {
      throw new NotFoundError("Source Location");
    }
    if (!sourceLoc.isActive) {
      throw new ValidationError("Selected source location is inactive.");
    }

    // If source warehouse is provided, verify relation
    if (validated.sourceWarehouseId) {
      const sourceWh = await warehouseRepository.findById(validated.sourceWarehouseId);
      if (!sourceWh) {
        throw new NotFoundError("Source Warehouse");
      }
      if (!sourceWh.isActive) {
        throw new ValidationError("Selected source warehouse is inactive.");
      }
      if (sourceLoc.warehouseId !== validated.sourceWarehouseId) {
        throw new ValidationError(
          `Source location "${sourceLoc.name}" does not belong to warehouse "${sourceWh.name}".`
        );
      }
    }

    // 2. Validate Destination Location
    const destLoc = await locationRepository.findById(validated.destinationLocationId);
    if (!destLoc) {
      throw new NotFoundError("Destination Location");
    }
    if (!destLoc.isActive) {
      throw new ValidationError("Selected destination location is inactive.");
    }

    // If destination warehouse is provided, verify relation
    if (validated.destinationWarehouseId) {
      const destWh = await warehouseRepository.findById(validated.destinationWarehouseId);
      if (!destWh) {
        throw new NotFoundError("Destination Warehouse");
      }
      if (!destWh.isActive) {
        throw new ValidationError("Selected destination warehouse is inactive.");
      }
      if (destLoc.warehouseId !== validated.destinationWarehouseId) {
        throw new ValidationError(
          `Destination location "${destLoc.name}" does not belong to warehouse "${destWh.name}".`
        );
      }
    }

    // 3. Location Distinction
    if (validated.sourceLocationId === validated.destinationLocationId) {
      throw new ValidationError("Source location and destination location cannot be the same.");
    }

    // 4. Validate Line Items & Check Stock
    for (const item of validated.items) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product (${item.productId})`);
      }
      if (!product.isActive) {
        throw new ValidationError(
          `Product "${product.name}" (${product.sku}) is deactivated and cannot be transferred.`
        );
      }
    }

    return transferRepository.create(validated, createdById);
  }

  async updateDraftTransfer(id: string, input: UpdateTransferInput) {
    const validated = updateTransferSchema.parse(input);

    const existing = await transferRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Internal Transfer");
    }

    if (existing.status !== OperationStatus.DRAFT) {
      throw new ValidationError(
        `Cannot edit internal transfer in "${existing.status}" status. Only DRAFT transfers can be modified.`
      );
    }

    const sourceLocationId = validated.sourceLocationId || existing.sourceLocationId;
    const destLocationId = validated.destinationLocationId || existing.destinationLocationId;

    if (sourceLocationId === destLocationId) {
      throw new ValidationError("Source location and destination location cannot be the same.");
    }

    if (validated.items) {
      for (const item of validated.items) {
        const product = await productRepository.findById(item.productId);
        if (!product || !product.isActive) {
          throw new ValidationError("Invalid or inactive product in transfer items.");
        }
      }
    }

    return transferRepository.updateDraft(id, validated);
  }

  async markReady(id: string) {
    const existing = await transferRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Internal Transfer");
    }

    if (existing.status !== OperationStatus.DRAFT) {
      throw new ValidationError(
        `Only DRAFT transfers can be marked as READY. Current status is "${existing.status}".`
      );
    }

    if (!existing.items || existing.items.length === 0) {
      throw new ValidationError("Cannot mark a transfer as READY with no product line items.");
    }

    // Verify stock availability at source location
    for (const item of existing.items) {
      const stock = await stockRepository.getStock(item.productId, existing.sourceLocationId);
      const available = stock?.quantity ?? 0;
      if (available < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for product "${item.product.name}" (${item.product.sku}) at source location "${existing.sourceLocation.name}". Available: ${available} ${item.uom}, Transfer requested: ${item.quantity} ${item.uom}.`
        );
      }
    }

    return transferRepository.updateStatus(id, OperationStatus.READY);
  }

  async validateTransfer(id: string, validatedById: string) {
    const existing = await transferRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Internal Transfer");
    }

    if (existing.status === OperationStatus.DONE) {
      throw new ConflictError("This internal transfer has already been validated.");
    }

    if (existing.status === OperationStatus.CANCELED) {
      throw new ValidationError("Cannot validate a canceled internal transfer.");
    }

    return transferRepository.validateTransferTransaction(id, validatedById);
  }

  async cancelTransfer(id: string) {
    const existing = await transferRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Internal Transfer");
    }

    if (existing.status === OperationStatus.DONE) {
      throw new ValidationError(
        "Cannot cancel a completed internal transfer. Completed stock movements must be reversed via a new transfer."
      );
    }

    if (existing.status === OperationStatus.CANCELED) {
      return existing;
    }

    return transferRepository.cancel(id);
  }

  async getPendingCount() {
    return transferRepository.countPendingTransfers();
  }
}

export const transferService = new TransferService();
