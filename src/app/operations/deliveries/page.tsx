import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderView } from "@/components/shared/placeholder-view";
import { ArrowUpFromLine } from "lucide-react";

export default function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Orders (Outgoing)"
        description="Pick, pack, and dispatch goods to customers with stock deductions."
      />
      <PlaceholderView
        title="Outgoing Stock & Delivery Orders Architecture"
        module="Operations / Delivery Orders"
        description="Architecture is ready to handle picking and shipping workflows, reserving stock quantities, and deducting inventory from source locations upon operation completion."
        icon={ArrowUpFromLine}
        features={[
          "Delivery & DeliveryItem Prisma models with unique reference numbers (e.g., DEL-2026-XXXX)",
          "Source Location verification to guarantee sufficient inventory before dispatch",
          "Traceable customer tracking and order status transitions (DRAFT to DONE)",
          "Zod validation schemas in src/lib/validations/delivery.ts",
          "Automated ledger logging and stock balance reconciliation hooks",
        ]}
      />
    </div>
  );
}
