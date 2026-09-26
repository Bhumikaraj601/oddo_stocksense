import { warehouseRepository } from "@/repositories/warehouse.repository";
import { WarehouseInput, LocationInput } from "@/lib/validations/warehouse";
import { NotFoundError } from "@/lib/utils/api-error";

export class WarehouseService {
  async listWarehouses() {
    return warehouseRepository.listWarehouses();
  }

  async getWarehouseById(id: string) {
    const warehouse = await warehouseRepository.findWarehouseById(id);
    if (!warehouse) {
      throw new NotFoundError("Warehouse");
    }
    return warehouse;
  }

  async createWarehouse(input: WarehouseInput) {
    return warehouseRepository.createWarehouse(input);
  }

  async listLocations(warehouseId?: string) {
    return warehouseRepository.listLocations(warehouseId);
  }

  async getLocationById(id: string) {
    const location = await warehouseRepository.findLocationById(id);
    if (!location) {
      throw new NotFoundError("Location");
    }
    return location;
  }

  async createLocation(input: LocationInput) {
    return warehouseRepository.createLocation(input);
  }
}

export const warehouseService = new WarehouseService();
