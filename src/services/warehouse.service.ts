import { warehouseRepository } from "@/repositories/warehouse.repository";
import {
  WarehouseInput,
  UpdateWarehouseInput,
  WarehouseQuery,
  warehouseSchema,
  updateWarehouseSchema,
} from "@/lib/validations/warehouse";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "@/lib/utils/api-error";

export class WarehouseService {
  async getWarehouses(query?: WarehouseQuery) {
    return warehouseRepository.list(query);
  }

  async getWarehouseById(id: string) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError("Warehouse");
    }
    return warehouse;
  }

  async createWarehouse(input: WarehouseInput) {
    const validated = warehouseSchema.parse(input);

    const existingCode = await warehouseRepository.findByCode(validated.code);
    if (existingCode) {
      throw new ConflictError(
        `Warehouse code "${validated.code}" is already in use.`
      );
    }

    const existingName = await warehouseRepository.findByName(validated.name);
    if (existingName) {
      throw new ConflictError(
        `Warehouse name "${validated.name}" is already in use.`
      );
    }

    return warehouseRepository.create(validated);
  }

  async updateWarehouse(id: string, input: UpdateWarehouseInput) {
    const validated = updateWarehouseSchema.parse(input);

    const existing = await warehouseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Warehouse");
    }

    if (validated.code && validated.code.toUpperCase() !== existing.code.toUpperCase()) {
      const duplicateCode = await warehouseRepository.findByCode(
        validated.code,
        id
      );
      if (duplicateCode) {
        throw new ConflictError(
          `Warehouse code "${validated.code}" is already in use.`
        );
      }
    }

    if (validated.name && validated.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicateName = await warehouseRepository.findByName(
        validated.name,
        id
      );
      if (duplicateName) {
        throw new ConflictError(
          `Warehouse name "${validated.name}" is already in use.`
        );
      }
    }

    return warehouseRepository.update(id, validated);
  }

  async deactivateWarehouse(id: string) {
    const existing = await warehouseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Warehouse");
    }

    return warehouseRepository.update(id, { isActive: false });
  }

  async deleteWarehouse(id: string) {
    const existing = await warehouseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Warehouse");
    }

    const hasHistory = await warehouseRepository.hasHistoricalRecords(id);
    const result = await warehouseRepository.delete(id);

    return {
      deactivated: hasHistory,
      message: hasHistory
        ? "Warehouse contains historical inventory or operations and was safely deactivated instead of deleted."
        : "Warehouse was permanently deleted.",
      warehouse: result,
    };
  }
}

export const warehouseService = new WarehouseService();
