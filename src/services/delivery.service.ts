import { deliveryRepository } from "@/repositories/delivery.repository";
import { productRepository } from "@/repositories/product.repository";
import { warehouseRepository } from "@/repositories/warehouse.repository";
import { locationRepository } from "@/repositories/location.repository";
import { stockRepository } from "@/repositories/stock.repository";
import {
  DeliveryInput,
  UpdateDeliveryInput,
  DeliveryQuery,
  PickItemsInput,
  PackItemsInput,
  deliverySchema,
  updateDeliverySchema,
  deliveryQuerySchema,
  pickItemsSchema,
  packItemsSchema,
} from "@/lib/validations/delivery";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/utils/api-error";
import { OperationStatus } from "@prisma/client";

export class DeliveryService {
  async getDeliveries(query?: DeliveryQuery) {
    const validated = query ? deliveryQuerySchema.parse(query) : undefined;
    return deliveryRepository.list(validated);
  }

  async getDeliveryById(id: string) {
    const delivery = await deliveryRepository.findById(id);
    if (!delivery) {
      throw new NotFoundError("Delivery");
    }
    return delivery;
  }

  async createDelivery(input: DeliveryInput, createdById: string) {
    const validated = deliverySchema.parse(input);

    // 1. Validate Warehouse
    const warehouse = await warehouseRepository.findById(validated.warehouseId);
    if (!warehouse) {
      throw new NotFoundError("Warehouse");
    }
    if (!warehouse.isActive) {
      throw new ValidationError("Selected warehouse is inactive.");
    }

    // 2. Validate Default Source Location if specified
    if (validated.sourceLocationId) {
      const sourceLoc = await locationRepository.findById(validated.sourceLocationId);
      if (!sourceLoc) {
        throw new NotFoundError("Source Location");
      }
      if (!sourceLoc.isActive) {
        throw new ValidationError("Selected primary source location is inactive.");
      }
      if (sourceLoc.warehouseId !== validated.warehouseId) {
        throw new ValidationError(
          `Primary source location "${sourceLoc.name}" does not belong to warehouse "${warehouse.name}".`
        );
      }
    }

    // 3. Validate Line Items (Product & Warehouse Location pairing & Stock Availability)
    for (const item of validated.items) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product (${item.productId})`);
      }
      if (!product.isActive) {
        throw new ValidationError(
          `Product "${product.name}" (${product.sku}) is deactivated and cannot be delivered.`
        );
      }

      const location = await locationRepository.findById(item.locationId);
      if (!location) {
        throw new NotFoundError(`Location (${item.locationId})`);
      }
      if (!location.isActive) {
        throw new ValidationError(
          `Source location "${location.name}" is deactivated.`
        );
      }

      // Ensure location belongs to the selected warehouse
      if (location.warehouseId !== validated.warehouseId) {
        throw new ValidationError(
          `Source location "${location.name}" does not belong to warehouse "${warehouse.name}".`
        );
      }
    }

    return deliveryRepository.create(validated, createdById);
  }

  async updateDraftDelivery(id: string, input: UpdateDeliveryInput) {
    const validated = updateDeliverySchema.parse(input);

    const existing = await deliveryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Delivery");
    }

    if (existing.status !== OperationStatus.DRAFT) {
      throw new ValidationError(
        `Cannot edit delivery in "${existing.status}" status. Only DRAFT deliveries can be modified.`
      );
    }

    const warehouseId = validated.warehouseId || existing.warehouseId;

    if (validated.items && warehouseId) {
      for (const item of validated.items) {
        const product = await productRepository.findById(item.productId);
        if (!product || !product.isActive) {
          throw new ValidationError("Invalid or inactive product in delivery items.");
        }

        const location = await locationRepository.findById(item.locationId);
        if (!location || location.warehouseId !== warehouseId) {
          throw new ValidationError(
            `Location "${location?.name || item.locationId}" does not belong to the selected warehouse.`
          );
        }
      }
    }

    return deliveryRepository.updateDraft(id, validated);
  }

  async confirmDelivery(id: string) {
    const existing = await deliveryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Delivery");
    }

    if (existing.status !== OperationStatus.DRAFT) {
      throw new ValidationError(
        `Only DRAFT deliveries can be confirmed into WAITING state. Current status is "${existing.status}".`
      );
    }

    if (!existing.items || existing.items.length === 0) {
      throw new ValidationError("Cannot confirm a delivery order with no product line items.");
    }

    // Check stock availability upfront to warn/inform warehouse staff
    for (const item of existing.items) {
      const targetLocId = item.locationId || existing.sourceLocationId;
      if (targetLocId) {
        const stock = await stockRepository.getStock(item.productId, targetLocId);
        const available = stock?.quantity ?? 0;
        if (available < item.quantityDemand) {
          throw new ValidationError(
            `Insufficient stock to fulfill order for "${item.product.name}" (${item.product.sku}). Available: ${available} ${item.uom}, Requested: ${item.quantityDemand} ${item.uom}.`
          );
        }
      }
    }

    return deliveryRepository.updateStatus(id, OperationStatus.WAITING);
  }

  async pickDelivery(id: string, input: PickItemsInput) {
    const validated = pickItemsSchema.parse(input);
    const existing = await deliveryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Delivery");
    }

    if (
      existing.status !== OperationStatus.DRAFT &&
      existing.status !== OperationStatus.WAITING &&
      existing.status !== OperationStatus.READY
    ) {
      throw new ValidationError(
        `Cannot pick items on a delivery with status "${existing.status}".`
      );
    }

    return deliveryRepository.pickItems(id, validated);
  }

  async packDelivery(id: string, input: PackItemsInput) {
    const validated = packItemsSchema.parse(input);
    const existing = await deliveryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Delivery");
    }

    if (
      existing.status !== OperationStatus.WAITING &&
      existing.status !== OperationStatus.READY
    ) {
      throw new ValidationError(
        `Cannot pack items on a delivery with status "${existing.status}". Delivery must be in WAITING or READY status.`
      );
    }

    return deliveryRepository.packItems(id, validated);
  }

  async validateDelivery(id: string, validatedById: string) {
    const existing = await deliveryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Delivery");
    }

    if (existing.status === OperationStatus.DONE) {
      throw new ConflictError("This delivery order has already been validated.");
    }

    if (existing.status === OperationStatus.CANCELED) {
      throw new ValidationError("Cannot validate a canceled delivery order.");
    }

    return deliveryRepository.validateDeliveryTransaction(id, validatedById);
  }

  async cancelDelivery(id: string) {
    const existing = await deliveryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Delivery");
    }

    if (existing.status === OperationStatus.DONE) {
      throw new ValidationError(
        "Cannot cancel a completed delivery order. Completed stock decrements cannot be reversed directly."
      );
    }

    if (existing.status === OperationStatus.CANCELED) {
      return existing;
    }

    return deliveryRepository.cancel(id);
  }

  async getPendingCount() {
    return deliveryRepository.countPendingDeliveries();
  }
}

export const deliveryService = new DeliveryService();
