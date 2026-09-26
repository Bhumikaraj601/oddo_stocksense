import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderView } from "@/components/shared/placeholder-view";
import { Building2 } from "lucide-react";

export default function WarehousesSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses & Storage Locations"
        description="Configure physical warehouses, internal zones, racks, and virtual partner locations."
      />
      <PlaceholderView
        title="Multi-Warehouse & Hierarchical Location Architecture"
        module="Settings / Warehouses & Locations"
        description="The multi-warehouse schema allows defining discrete warehouses (e.g., Main Warehouse, Production Floor) and nested sub-locations (Racks, Bins, Scrap, Transit)."
        icon={Building2}
        features={[
          "Warehouse Prisma model supporting multiple distinct physical facilities",
          "Location entity with hierarchical parent-child relationships (Warehouse ➔ Zone ➔ Rack)",
          "LocationType enum supporting INTERNAL, VENDOR, CUSTOMER, PRODUCTION, TRANSIT, and SCRAP",
          "Zod schemas in src/lib/validations/warehouse.ts",
          "WarehouseService & WarehouseRepository for managing warehouse hierarchies",
        ]}
      />
    </div>
  );
}
