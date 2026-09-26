import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderView } from "@/components/shared/placeholder-view";
import { Shuffle } from "lucide-react";

export default function TransfersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Transfers"
        description="Relocate products between warehouses, racks, and production zones."
      />
      <PlaceholderView
        title="Internal Relocation & Stock Transfers Architecture"
        module="Operations / Internal Transfers"
        description="Database models and services support multi-location transfers with atomic source deduction and destination addition inside transactional database boundaries."
        icon={Shuffle}
        features={[
          "InternalTransfer & InternalTransferItem Prisma schema with dual location references",
          "Validation guard preventing identical source and destination selection",
          "OperationStatus progression (DRAFT ➔ READY ➔ DONE)",
          "Zod validation schemas in src/lib/validations/transfer.ts",
          "Direct integration ready for StockLedger dual-movement logging",
        ]}
      />
    </div>
  );
}
