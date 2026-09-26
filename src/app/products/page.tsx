import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderView } from "@/components/shared/placeholder-view";
import { Package } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Categories"
        description="Master catalog management, SKU tracking, and category hierarchy."
      />
      <PlaceholderView
        title="Product Catalog & Category Architecture"
        module="Catalog Management"
        description="Structured database schema and Zod validation models are ready for product CRUD, SKU uniqueness validation, category trees, and per-location initial stock allocation."
        icon={Package}
        features={[
          "Prisma Product model with unique SKU, UOM (Units, kg, liters, etc.), and Category relations",
          "Hierarchical Category schema with parent-child category tree support",
          "Stock entity mapping Product + Location = Current Quantity",
          "ReorderRule entity with minimum stock, maximum stock, and reorder threshold",
          "ProductService and ProductRepository layered architecture with Zod schema validation",
        ]}
      />
    </div>
  );
}
