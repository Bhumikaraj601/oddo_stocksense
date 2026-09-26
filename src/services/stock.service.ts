import { stockRepository } from "@/repositories/stock.repository";
import { StockQuery, stockQuerySchema } from "@/lib/validations/warehouse";

export class StockService {
  async getStock(productId: string, locationId: string) {
    return stockRepository.getStock(productId, locationId);
  }

  async getStockByProduct(productId: string) {
    return stockRepository.listStockByProduct(productId);
  }

  async getStockByLocation(locationId: string) {
    return stockRepository.listStockByLocation(locationId);
  }

  async getStockByWarehouse(warehouseId: string) {
    return stockRepository.listStockByWarehouse(warehouseId);
  }

  async getTotalStock(productId: string) {
    return stockRepository.getTotalStockForProduct(productId);
  }

  async listStock(query?: StockQuery) {
    const validated = query ? stockQuerySchema.parse(query) : undefined;
    return stockRepository.listStock(validated);
  }

  async listReorderRules(productId?: string) {
    return stockRepository.listReorderRules(productId);
  }
}

export const stockService = new StockService();
