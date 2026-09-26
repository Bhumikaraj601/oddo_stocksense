import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderView } from "@/components/shared/placeholder-view";
import { ArrowDownToLine } from "lucide-react";

export default function ReceiptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Receipts"
        description="Receive stock from suppliers and automatically update destination warehouse inventory."
      />
      <PlaceholderView
        title="Incoming Stock & Supplier Receipts Architecture"
        module="Operations / Receipts"
        description="Database entities and service layers are prepared for logging supplier shipments, tracking expected vs. received quantities, and committing movements to the Stock Ledger upon validation."
        icon={ArrowDownToLine}
        features={[
          "Receipt & ReceiptItem Prisma entities with unique reference codes (e.g., REC-2026-XXXX)",
          "OperationStatus lifecycle: DRAFT ➔ WAITING ➔ READY ➔ DONE / CANCELED",
          "Destination location tracking with automatic ledger entry generation on completion",
          "Zod validation schemas in src/lib/validations/receipt.ts",
          "OperationService & OperationRepository ready for Phase 2 validation workflows",
        ]}
      />
    </div>
  );
}
