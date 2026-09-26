import { stockRepository } from "@/repositories/stock.repository";
import { ReorderRuleInput } from "@/lib/validations/reorder";

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

  async getTotalStock(productId: string) {
    return stockRepository.getTotalStockForProduct(productId);
  }

  async listReorderRules(productId?: string) {
    return stockRepository.listReorderRules(productId);
  }
}

export const stockService = new StockService();
