import { NextRequest } from "next/server";
import { dashboardService } from "@/services/dashboard.service";
import { ledgerRepository } from "@/repositories/ledger.repository";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/api-error";
import { requireAuth } from "@/lib/auth/session";

export async function GET(_request: NextRequest) {
  try {
    await requireAuth();

    const [kpis, recentMovements] = await Promise.all([
      dashboardService.getDashboardKPIs(),
      ledgerRepository.listMovements({ page: 1, limit: 6, sortBy: "createdAt", sortOrder: "desc" }),
    ]);

    return createSuccessResponse({
      kpis,
      recentMovements: recentMovements.data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
