import { productRepository } from "@/repositories/product.repository";
import { operationRepository } from "@/repositories/operation.repository";
import { DashboardKPIs } from "@/types";

export class DashboardService {
  /**
   * Retrieves high-level inventory KPIs for the StockSense dashboard.
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const [
      totalProducts,
      pendingReceipts,
      pendingDeliveries,
      internalTransfersCount,
    ] = await Promise.all([
      productRepository.countTotal(),
      operationRepository.countPendingReceipts(),
      operationRepository.countPendingDeliveries(),
      operationRepository.countInternalTransfers(),
    ]);

    // Initial foundation counts (to be calculated by real-time aggregation in Phase 2)
    return {
      totalProducts,
      lowStockCount: 0,
      outOfStockCount: 0,
      pendingReceipts,
      pendingDeliveries,
      internalTransfersCount,
    };
  }
}

export const dashboardService = new DashboardService();
