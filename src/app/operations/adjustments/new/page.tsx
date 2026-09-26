"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Building2,
  MapPin,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  uom: string;
  category?: { name: string };
}

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface LocationOption {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
}

interface AdjustmentLineItemForm {
  id: string; // temp client key
  productId: string;
  theoreticalQty: number; // system stock
  countedQty: number | string; // physical count
  uom: string;
  loadingStock?: boolean;
}

export default function NewAdjustmentPage() {
  const router = useRouter();

  // Warehouse & Location States
  const [warehouseId, setWarehouseId] = React.useState("");
  const [locationId, setLocationId] = React.useState("");
  const [reason, setReason] = React.useState("");

  // Items State
  const [items, setItems] = React.useState<AdjustmentLineItemForm[]>([
    {
      id: "line-1",
      productId: "",
      theoreticalQty: 0,
      countedQty: 0,
      uom: "PCS",
    },
  ]);

  // Options Data
  const [products, setProducts] = React.useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseOption[]>([]);
  const [locations, setLocations] = React.useState<LocationOption[]>([]);

  // UI States
  const [loadingInitial, setLoadingInitial] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Load Products and Warehouses
  React.useEffect(() => {
    async function loadInitialData() {
      setLoadingInitial(true);
      try {
        const [prodRes, whRes] = await Promise.all([
          fetch("/api/products?limit=100&isActive=true"),
          fetch("/api/warehouses?limit=100"),
        ]);

        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          setProducts(prodJson.data || []);
        }

        if (whRes.ok) {
          const whJson = await whRes.json();
          const whData = whJson.data || [];
          setWarehouses(whData);

          if (whData.length > 0) {
            setWarehouseId(whData[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadInitialData();
  }, []);

  // Fetch Locations when warehouse changes
  React.useEffect(() => {
    if (!warehouseId) {
      setLocations([]);
      setLocationId("");
      return;
    }

    async function fetchLocations() {
      try {
        const res = await fetch(`/api/warehouses/${warehouseId}/locations`);
        if (res.ok) {
          const json = await res.json();
          const locs = json.data || [];
          setLocations(locs);
          if (locs.length > 0) {
            setLocationId(locs[0].id);
          } else {
            setLocationId("");
          }
        }
      } catch (err) {
        console.error("Failed to load locations:", err);
      }
    }

    fetchLocations();
  }, [warehouseId]);

  // Check live system stock for a line item
  const checkStockForLine = React.useCallback(
    async (productId: string, locId: string, lineIndex: number) => {
      if (!productId || !locId) return;

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === lineIndex ? { ...item, loadingStock: true } : item
        )
      );

      try {
        const res = await fetch(`/api/stock?productId=${productId}&locationId=${locId}`);
        if (res.ok) {
          const json = await res.json();
          const stockRecord = json.data?.[0];
          const stockQty = stockRecord ? stockRecord.quantity : 0;

          setItems((prev) =>
            prev.map((item, idx) =>
              idx === lineIndex
                ? {
                    ...item,
                    theoreticalQty: stockQty,
                    // If countedQty was uninitialized (0 with new item), set initial countedQty to theoreticalQty
                    countedQty: item.countedQty === "" ? 0 : item.countedQty,
                    loadingStock: false,
                  }
                : item
            )
          );
        }
      } catch (err) {
        console.error("Failed to query stock:", err);
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === lineIndex ? { ...item, loadingStock: false } : item
          )
        );
      }
    },
    []
  );

  // Trigger stock check whenever location changes
  React.useEffect(() => {
    if (!locationId) return;
    items.forEach((item, index) => {
      if (item.productId) {
        checkStockForLine(item.productId, locationId, index);
      }
    });
  }, [locationId, checkStockForLine]);

  // Handle Product Change in Line
  const handleProductChange = (index: number, productId: string) => {
    const selectedProd = products.find((p) => p.id === productId);

    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              productId,
              uom: selectedProd?.uom || "PCS",
            }
          : item
      )
    );

    if (productId && locationId) {
      checkStockForLine(productId, locationId, index);
    }
  };

  // Add New Line Item
  const handleAddLine = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        productId: "",
        theoreticalQty: 0,
        countedQty: 0,
        uom: "PCS",
      },
    ]);
  };

  // Remove Line Item
  const handleRemoveLine = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations
    if (!locationId) {
      setErrorMessage("Please select a warehouse location for the stock count.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("At least one product line item is required.");
      return;
    }

    // Check duplicate products
    const seenProducts = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId) {
        setErrorMessage(`Please select a product for line #${i + 1}.`);
        return;
      }
      if (seenProducts.has(item.productId)) {
        setErrorMessage(
          `Product in line #${i + 1} is duplicated. Please consolidate each product into a single line.`
        );
        return;
      }
      seenProducts.add(item.productId);

      const countNum = Number(item.countedQty);
      if (isNaN(countNum) || countNum < 0) {
        setErrorMessage(`Counted physical quantity for line #${i + 1} cannot be negative.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        warehouseId: warehouseId || null,
        locationId,
        reason: reason.trim() || null,
        items: items.map((item) => ({
          productId: item.productId,
          countedQty: Number(item.countedQty),
          uom: item.uom || "PCS",
        })),
      };

      const res = await fetch("/api/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create inventory adjustment");
      }

      router.push(`/operations/adjustments/${json.data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-400">Loading adjustment form configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/operations/adjustments">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-purple-400" />
            New Inventory Adjustment
          </h1>
          <p className="text-sm text-zinc-400">
            Record physical stock counts and calculate differences against current system quantities.
          </p>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-3">
        <Info className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-purple-300">Authoritative Physical Count Rule:</p>
          <p className="text-purple-200/90 leading-relaxed">
            Upon validation, the <strong>Physical Counted Quantity</strong> will become the authoritative new stock balance in the database. Any discrepancy will be automatically logged to the Stock Ledger as a signed movement.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to create adjustment</p>
            <p className="mt-0.5 text-xs text-red-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warehouse, Location & Reason Card */}
        <Card className="p-5 bg-zinc-900/60 border-zinc-800/80 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
            <Building2 className="h-4 w-4 text-purple-400" />
            Warehouse & Location Selection
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Warehouse Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Warehouse <span className="text-red-400">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
                className="w-full h-9 rounded-lg px-3 bg-zinc-950/60 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-purple-400" />
                Physical Location / Bin <span className="text-red-400">*</span>
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
                className="w-full h-9 rounded-lg px-3 bg-zinc-950/60 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason / Notes */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Discrepancy Reason / Notes (Optional)
            </label>
            <Input
              placeholder="e.g. Periodic cycle count, physical audit, damage scrap, shrinkage write-off"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500"
            />
          </div>
        </Card>

        {/* Line Items Table */}
        <Card className="p-5 bg-zinc-900/60 border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-400" />
                Product Counts & Differences
              </h2>
              <p className="text-xs text-zinc-400">
                Enter physical counted quantities. The server computes the difference against live system stock.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="border-zinc-700 bg-zinc-800/60 hover:bg-zinc-750 text-zinc-200 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Product
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const countVal = item.countedQty === "" ? 0 : Number(item.countedQty);
              const diff = countVal - item.theoreticalQty;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Line Index */}
                    <div className="hidden md:flex md:col-span-1 items-center justify-center text-zinc-500 font-mono text-xs font-semibold">
                      #{index + 1}
                    </div>

                    {/* Product Select */}
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase">
                        Product <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        required
                        className="w-full h-9 rounded-lg px-3 bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select Product...</option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} ({prod.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* System Stock (Read-Only) */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase">
                        System Stock
                      </label>
                      <div className="h-9 px-3 bg-zinc-900/80 border border-zinc-800/80 rounded-lg flex items-center justify-between font-mono text-sm text-zinc-300">
                        {item.loadingStock ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                        ) : (
                          <span>{item.theoreticalQty}</span>
                        )}
                        <span className="text-xs text-zinc-500">{item.uom}</span>
                      </div>
                    </div>

                    {/* Physical Counted Input */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase flex items-center justify-between">
                        <span>Counted Stock</span>
                        <span className="text-zinc-500 font-normal">({item.uom})</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.countedQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((it, idx) =>
                                idx === index
                                  ? {
                                      ...it,
                                      countedQty: val === "" ? "" : parseFloat(val) || 0,
                                    }
                                  : it
                              )
                            );
                          }}
                          className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-purple-500 h-9 text-sm font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    {/* Remove Action */}
                    <div className="md:col-span-1 flex items-center justify-end pt-5 md:pt-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={items.length <= 1}
                        onClick={() => handleRemoveLine(index)}
                        className="h-9 w-9 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Live Difference Badge */}
                  {item.productId && (
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-400">
                          System: <strong className="text-zinc-200 font-mono">{item.theoreticalQty}</strong>
                        </span>
                        <span className="text-zinc-400">➔</span>
                        <span className="text-zinc-400">
                          Counted: <strong className="text-zinc-200 font-mono">{countVal}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">Difference:</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                            diff > 0
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : diff < 0
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {diff > 0 ? (
                            <>
                              <TrendingUp className="h-3 w-3" />
                              +{diff} {item.uom}
                            </>
                          ) : diff < 0 ? (
                            <>
                              <TrendingDown className="h-3 w-3" />
                              {diff} {item.uom}
                            </>
                          ) : (
                            `0 ${item.uom} (In Balance)`
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/operations/adjustments">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium min-w-[160px] shadow-lg shadow-purple-500/20"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Draft...
              </>
            ) : (
              <>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Save Adjustment Draft
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
