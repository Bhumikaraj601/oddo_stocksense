import { adjustmentRepository } from "@/repositories/adjustment.repository";
import { productRepository } from "@/repositories/product.repository";
import { warehouseRepository } from "@/repositories/warehouse.repository";
import { locationRepository } from "@/repositories/location.repository";
import {
  AdjustmentInput,
  UpdateAdjustmentInput,
  AdjustmentQuery,
  adjustmentSchema,
  updateAdjustmentSchema,
  adjustmentQuerySchema,
} from "@/lib/validations/adjustment";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/utils/api-error";
import { OperationStatus } from "@prisma/client";

export class AdjustmentService {
  async getAdjustments(query?: AdjustmentQuery) {
    const validated = query ? adjustmentQuerySchema.parse(query) : undefined;
    return adjustmentRepository.list(validated);
  }

  async getAdjustmentById(id: string) {
    const adjustment = await adjustmentRepository.findById(id);
    if (!adjustment) {
      throw new NotFoundError("Inventory Adjustment");
    }
    return adjustment;
  }

  async createAdjustment(input: AdjustmentInput, createdById: string) {
    const validated = adjustmentSchema.parse(input);

    // 1. Validate Location
    const location = await locationRepository.findById(validated.locationId);
    if (!location) {
      throw new NotFoundError("Location");
    }
    if (!location.isActive) {
      throw new ValidationError("Selected location is inactive.");
    }

    // 2. Validate Warehouse & association if provided
    if (validated.warehouseId) {
      const warehouse = await warehouseRepository.findById(validated.warehouseId);
      if (!warehouse) {
        throw new NotFoundError("Warehouse");
      }
      if (!warehouse.isActive) {
        throw new ValidationError("Selected warehouse is inactive.");
      }
      if (location.warehouseId !== validated.warehouseId) {
        throw new ValidationError(
          `Location "${location.name}" does not belong to warehouse "${warehouse.name}".`
        );
      }
    } else {
      // If warehouseId was not passed, populate it from location if available
      validated.warehouseId = location.warehouseId;
    }

    // 3. Validate Line Items
    if (!validated.items || validated.items.length === 0) {
      throw new ValidationError("At least one product item is required for adjustment.");
    }

    for (const item of validated.items) {
      if (item.countedQty < 0) {
        throw new ValidationError("Counted quantity cannot be negative.");
      }
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product (${item.productId})`);
      }
      if (!product.isActive) {
        throw new ValidationError(
          `Product "${product.name}" (${product.sku}) is deactivated and cannot be adjusted.`
        );
      }
    }

    return adjustmentRepository.create(validated, createdById);
  }

  async updateDraftAdjustment(id: string, input: UpdateAdjustmentInput) {
    const validated = updateAdjustmentSchema.parse(input);

    const existing = await adjustmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Inventory Adjustment");
    }

    if (existing.status !== OperationStatus.DRAFT) {
      throw new ValidationError(
        `Cannot edit inventory adjustment in "${existing.status}" status. Only DRAFT adjustments can be modified.`
      );
    }

    const locationId = validated.locationId || existing.locationId;
    const warehouseId = validated.warehouseId !== undefined ? validated.warehouseId : existing.warehouseId;

    if (locationId) {
      const location = await locationRepository.findById(locationId);
      if (!location || !location.isActive) {
        throw new ValidationError("Selected location is invalid or inactive.");
      }
      if (warehouseId && location.warehouseId !== warehouseId) {
        throw new ValidationError(
          `Location "${location.name}" does not belong to the selected warehouse.`
        );
      }
    }

    if (validated.items) {
      for (const item of validated.items) {
        if (item.countedQty < 0) {
          throw new ValidationError("Counted quantity cannot be negative.");
        }
        const product = await productRepository.findById(item.productId);
        if (!product || !product.isActive) {
          throw new ValidationError("Invalid or inactive product in adjustment items.");
        }
      }
    }

    return adjustmentRepository.updateDraft(id, validated);
  }

  async validateAdjustment(id: string, validatedById: string) {
    const existing = await adjustmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Inventory Adjustment");
    }

    if (existing.status === OperationStatus.DONE) {
      throw new ConflictError("This inventory adjustment has already been validated.");
    }

    if (existing.status === OperationStatus.CANCELED) {
      throw new ValidationError("Cannot validate a canceled inventory adjustment.");
    }

    return adjustmentRepository.validateAdjustmentTransaction(id, validatedById);
  }

  async cancelAdjustment(id: string) {
    const existing = await adjustmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Inventory Adjustment");
    }

    if (existing.status === OperationStatus.DONE) {
      throw new ValidationError(
        "Cannot cancel a completed inventory adjustment. Completed adjustments cannot be modified."
      );
    }

    if (existing.status === OperationStatus.CANCELED) {
      return existing;
    }

    return adjustmentRepository.cancel(id);
  }

  async getPendingCount() {
    return adjustmentRepository.countPendingAdjustments();
  }
}

export const adjustmentService = new AdjustmentService();
