import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderView } from "@/components/shared/placeholder-view";
import { History } from "lucide-react";

export default function StockLedgerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Ledger / Movement History"
        description="Complete chronological, tamper-evident ledger of every stock transaction."
      />
      <PlaceholderView
        title="Stock Movement Ledger & Audit Trail Architecture"
        module="Operations / Stock Ledger"
        description="The Stock Ledger is the central source of truth for StockSense. It records every receipt, delivery, transfer, and adjustment with timestamps, reference IDs, and user accountability."
        icon={History}
        features={[
          "StockLedger Prisma model indexing reference, operationType, and createdAt",
          "Traceable linking to Source Location, Destination Location, Product, and Performed By User",
          "Enums for RECEIPT, DELIVERY, INTERNAL_TRANSFER, and ADJUSTMENT operations",
          "LedgerService & LedgerRepository for querying audit trails and movement logs",
          "Supports future chronological filtering, export, and compliance reports",
        ]}
      />
    </div>
  );
}
