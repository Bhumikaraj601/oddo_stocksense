import { productRepository } from "@/repositories/product.repository";
import { operationRepository } from "@/repositories/operation.repository";
import { DashboardKPIs } from "@/types";

export class DashboardService {
  /**
   * Retrieves high-level inventory KPIs for the StockSense dashboard based on real PostgreSQL data.
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const [
      totalProducts,
      stockStats,
      pendingReceipts,
      pendingDeliveries,
      internalTransfersCount,
    ] = await Promise.all([
      productRepository.countTotal(),
      productRepository.countLowStockAndOutOfStock(),
      operationRepository.countPendingReceipts(),
      operationRepository.countPendingDeliveries(),
      operationRepository.countInternalTransfers(),
    ]);

    return {
      totalProducts,
      lowStockCount: stockStats.lowStockCount,
      outOfStockCount: stockStats.outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      internalTransfersCount,
    };
  }
}

export const dashboardService = new DashboardService();
