import { ledgerRepository } from "@/repositories/ledger.repository";
import { OperationType } from "@prisma/client";

export class LedgerService {
  async listMovements(params?: {
    productId?: string;
    operationType?: OperationType;
    reference?: string;
    limit?: number;
    page?: number;
  }) {
    return ledgerRepository.listMovements(params);
  }
}

export const ledgerService = new LedgerService();
