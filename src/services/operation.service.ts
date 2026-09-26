import { operationRepository } from "@/repositories/operation.repository";
import { OperationStatus } from "@prisma/client";

export class OperationService {
  async listReceipts(status?: OperationStatus) {
    return operationRepository.listReceipts(status);
  }

  async listDeliveries(status?: OperationStatus) {
    return operationRepository.listDeliveries(status);
  }

  async listTransfers(status?: OperationStatus) {
    return operationRepository.listTransfers(status);
  }

  async listAdjustments(status?: OperationStatus) {
    return operationRepository.listAdjustments(status);
  }
}

export const operationService = new OperationService();
