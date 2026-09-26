import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderView } from "@/components/shared/placeholder-view";
import { SlidersHorizontal } from "lucide-react";

export default function AdjustmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Adjustments"
        description="Reconcile recorded stock with physical warehouse counts and scrap write-offs."
      />
      <PlaceholderView
        title="Physical Count & Stock Adjustment Architecture"
        module="Operations / Stock Adjustments"
        description="Data structure is established to track theoretical quantity vs. counted quantity, computing the difference and logging discrepancy reasons into the Stock Ledger."
        icon={SlidersHorizontal}
        features={[
          "Adjustment & AdjustmentItem models storing theoreticalQty, countedQty, and differenceQty",
          "Audited discrepancy reasons (damage, loss, cycle count correction)",
          "Location-scoped inventory verification",
          "Zod validation schemas in src/lib/validations/adjustment.ts",
          "Ledger alignment to maintain financial and physical inventory integrity",
        ]}
      />
    </div>
  );
}
