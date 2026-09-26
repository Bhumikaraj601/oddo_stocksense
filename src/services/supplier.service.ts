import { supplierRepository } from "@/repositories/supplier.repository";
import {
  SupplierInput,
  UpdateSupplierInput,
  supplierSchema,
  updateSupplierSchema,
} from "@/lib/validations/receipt";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "@/lib/utils/api-error";

export class SupplierService {
  async getSuppliers(params?: {
    search?: string;
    status?: "ALL" | "ACTIVE" | "INACTIVE";
    page?: number;
    limit?: number;
  }) {
    return supplierRepository.list(params);
  }

  async getSupplierById(id: string) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError("Supplier");
    }
    return supplier;
  }

  async createSupplier(input: SupplierInput) {
    const validated = supplierSchema.parse(input);

    const existingName = await supplierRepository.findByName(validated.name);
    if (existingName) {
      throw new ConflictError(
        `Supplier with name "${validated.name}" already exists.`
      );
    }

    if (validated.code) {
      const existingCode = await supplierRepository.findByCode(validated.code);
      if (existingCode) {
        throw new ConflictError(
          `Supplier with code "${validated.code}" already exists.`
        );
      }
    }

    return supplierRepository.create(validated);
  }

  async updateSupplier(id: string, input: UpdateSupplierInput) {
    const validated = updateSupplierSchema.parse(input);

    const existing = await supplierRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Supplier");
    }

    if (validated.name && validated.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicateName = await supplierRepository.findByName(
        validated.name,
        id
      );
      if (duplicateName) {
        throw new ConflictError(
          `Supplier with name "${validated.name}" already exists.`
        );
      }
    }

    if (validated.code && validated.code.toUpperCase() !== existing.code?.toUpperCase()) {
      const duplicateCode = await supplierRepository.findByCode(
        validated.code,
        id
      );
      if (duplicateCode) {
        throw new ConflictError(
          `Supplier with code "${validated.code}" already exists.`
        );
      }
    }

    return supplierRepository.update(id, validated);
  }

  async deleteSupplier(id: string) {
    const existing = await supplierRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Supplier");
    }

    return supplierRepository.delete(id);
  }
}

export const supplierService = new SupplierService();
