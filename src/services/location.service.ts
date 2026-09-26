import { locationRepository } from "@/repositories/location.repository";
import { warehouseRepository } from "@/repositories/warehouse.repository";
import {
  LocationInput,
  UpdateLocationInput,
  LocationQuery,
  locationSchema,
  updateLocationSchema,
} from "@/lib/validations/warehouse";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "@/lib/utils/api-error";

export class LocationService {
  async getLocations(query?: LocationQuery) {
    return locationRepository.list(query);
  }

  async getLocationById(id: string) {
    const location = await locationRepository.findById(id);
    if (!location) {
      throw new NotFoundError("Location");
    }
    return location;
  }

  async createLocation(input: LocationInput) {
    const validated = locationSchema.parse(input);

    if (validated.warehouseId) {
      const warehouse = await warehouseRepository.findById(validated.warehouseId);
      if (!warehouse) {
        throw new NotFoundError("Warehouse");
      }
      if (!warehouse.isActive) {
        throw new ValidationError("Cannot create a location in an inactive warehouse.");
      }
    }

    const existingCode = await locationRepository.findByCode(
      validated.warehouseId,
      validated.code
    );
    if (existingCode) {
      throw new ConflictError(
        `Location code "${validated.code}" is already in use within this warehouse.`
      );
    }

    return locationRepository.create(validated);
  }

  async updateLocation(id: string, input: UpdateLocationInput) {
    const validated = updateLocationSchema.parse(input);

    const existing = await locationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Location");
    }

    const targetWarehouseId =
      validated.warehouseId !== undefined
        ? validated.warehouseId
        : existing.warehouseId;

    if (validated.warehouseId && validated.warehouseId !== existing.warehouseId) {
      const warehouse = await warehouseRepository.findById(validated.warehouseId);
      if (!warehouse) {
        throw new NotFoundError("Warehouse");
      }
    }

    if (validated.code && validated.code.toUpperCase() !== existing.code.toUpperCase()) {
      const duplicateCode = await locationRepository.findByCode(
        targetWarehouseId,
        validated.code,
        id
      );
      if (duplicateCode) {
        throw new ConflictError(
          `Location code "${validated.code}" is already in use within this warehouse.`
        );
      }
    }

    return locationRepository.update(id, validated);
  }

  async deactivateLocation(id: string) {
    const existing = await locationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Location");
    }

    return locationRepository.update(id, { isActive: false });
  }

  async deleteLocation(id: string) {
    const existing = await locationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Location");
    }

    const hasHistory = await locationRepository.hasHistoricalRecords(id);
    const result = await locationRepository.delete(id);

    return {
      deactivated: hasHistory,
      message: hasHistory
        ? "Location contains inventory or movements and was safely deactivated instead of deleted."
        : "Location was permanently deleted.",
      location: result,
    };
  }
}

export const locationService = new LocationService();
