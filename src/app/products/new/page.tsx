"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Boxes,
  PlusCircle,
  Building2,
} from "lucide-react";
import { UNITS_OF_MEASURE, UnitOfMeasure } from "@/lib/constants";

interface CategoryOption {
  id: string;
  name: string;
}

interface LocationOption {
  id: string;
  name: string;
  code: string;
  warehouse?: { name: string };
}

export default function NewProductPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [uom, setUom] = React.useState<UnitOfMeasure>("PCS");
  const [minimumStock, setMinimumStock] = React.useState<number | "">(0);
  const [hasInitialStock, setHasInitialStock] = React.useState(false);
  const [initialLocationId, setInitialLocationId] = React.useState("");
  const [initialQuantity, setInitialQuantity] = React.useState<number | "">("");

  // Options State
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [locations, setLocations] = React.useState<LocationOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load Categories & Warehouse Locations
  React.useEffect(() => {
    async function loadFormOptions() {
      try {
        const [catRes, locRes] = await Promise.all([
          fetch("/api/categories?isActive=true"),
          fetch("/api/locations"),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.success && Array.isArray(catData.data)) {
            setCategories(catData.data);
            if (catData.data.length > 0) {
              setCategoryId(catData.data[0].id);
            }
          }
        }

        if (locRes.ok) {
          const locData = await locRes.json();
          if (locData.success && Array.isArray(locData.data)) {
            setLocations(locData.data);
            if (locData.data.length > 0) {
              setInitialLocationId(locData.data[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load options:", err);
      } finally {
        setIsLoadingOptions(false);
      }
    }

    loadFormOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!sku.trim()) {
      setError("Product SKU is required.");
      return;
    }

    if (!categoryId) {
      setError("Please select a product category.");
      return;
    }

    if (hasInitialStock) {
      if (!initialLocationId) {
        setError("Please select a warehouse location for initial stock.");
        return;
      }
      if (typeof initialQuantity !== "number" || initialQuantity <= 0) {
        setError("Initial stock quantity must be greater than 0.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim() || null,
        categoryId,
        uom,
        minimumStock: typeof minimumStock === "number" ? Math.max(0, minimumStock) : 0,
        isActive: true,
      };

      if (hasInitialStock && typeof initialQuantity === "number" && initialQuantity > 0) {
        payload.initialStock = {
          locationId: initialLocationId,
          quantity: initialQuantity,
        };
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to create product. Check SKU uniqueness.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/products/${data.data.id}`);
      router.refresh();
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Add New Product"
        description="Define master catalog details, SKU code, category, minimum stock threshold, and optional initial stock."
      >
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/products">
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Validation Error</p>
            <p className="text-[11px] mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Product Details Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              General Information
            </CardTitle>
            <CardDescription className="text-xs">
              Primary identification fields and stock rules for the inventory product.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Industrial Steel Ingot 50kg"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  SKU / Code <span className="text-rose-500">* (Must be unique)</span>
                </label>
                <Input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g. RAW-STL-050"
                  className="h-9 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    href="/settings/categories"
                    target="_blank"
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    <PlusCircle className="w-3 h-3" /> New Category
                  </Link>
                </div>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isLoadingOptions}
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.length === 0 ? (
                    <option value="">No categories available</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Unit of Measure (UOM) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={uom}
                  onChange={(e) => setUom(e.target.value as UnitOfMeasure)}
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                >
                  {UNITS_OF_MEASURE.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Minimum Stock Threshold ({uom})
                </label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={minimumStock}
                  onChange={(e) =>
                    setMinimumStock(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  placeholder="e.g. 50"
                  className="h-9 text-xs font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400">
                  Triggers &quot;Low Stock&quot; alert when total inventory falls below this quantity.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description / Specifications
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed material specifications, dimensions, weight, or notes..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Optional Initial Stock Allocation Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  Initial Inventory Allocation (Optional)
                </CardTitle>
                <CardDescription className="text-xs">
                  Assign starting on-hand quantity to a designated warehouse location.
                </CardDescription>
              </div>
              <input
                type="checkbox"
                id="initialStockToggle"
                checked={hasInitialStock}
                onChange={(e) => setHasInitialStock(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </CardHeader>

          {hasInitialStock && (
            <CardContent className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in-50">
              <div className="rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 p-3 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Initial stock creates an immediate inventory level and records an initial
                  allocation entry into the <strong>Stock Ledger</strong> audit history.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Storage Location <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={initialLocationId}
                    onChange={(e) => setInitialLocationId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {locations.length === 0 ? (
                      <option value="">No locations available</option>
                    ) : (
                      locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.warehouse?.name ? `${loc.warehouse.name} - ` : ""}
                          {loc.name} ({loc.code})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Starting Quantity ({uom}) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    step="any"
                    value={initialQuantity}
                    onChange={(e) =>
                      setInitialQuantity(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                    placeholder="e.g. 100"
                    className="h-9 text-xs font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/products">Cancel</Link>
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Product...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
