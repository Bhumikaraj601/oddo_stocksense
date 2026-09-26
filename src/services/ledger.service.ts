import { ledgerRepository } from "@/repositories/ledger.repository";
import { LedgerQuery, ledgerQuerySchema } from "@/lib/validations/ledger";

export class LedgerService {
  async getMovements(query?: LedgerQuery) {
    const validated = query ? ledgerQuerySchema.parse(query) : undefined;
    return ledgerRepository.listMovements(validated);
  }

  async getStats() {
    return ledgerRepository.getLedgerStats();
  }
}

export const ledgerService = new LedgerService();
