"use client";

import * as React from "react";
import Link from "next/link";
import {
  History,
  Search,
  Building2,
  Calendar,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  Shuffle,
  SlidersHorizontal,
  MapPin,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  User,
  Filter,
  Package,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MovementRecord {
  id: string;
  reference: string;
  operationType: "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER" | "ADJUSTMENT";
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    uom: string;
    category?: { name: string } | null;
  };
  sourceLocationId?: string | null;
  sourceLocation?: {
    id: string;
    name: string;
    code: string;
    warehouse?: { name: string; code: string } | null;
  } | null;
  destinationLocationId?: string | null;
  destinationLocation?: {
    id: string;
    name: string;
    code: string;
    warehouse?: { name: string; code: string } | null;
  } | null;
  quantity: number;
  uom: string;
  performedById?: string | null;
  performedBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  notes?: string | null;
  createdAt: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface StatsSummary {
  total: number;
  receipts: number;
  deliveries: number;
  transfers: number;
  adjustments: number;
}

export default function MoveHistoryPage() {
  // State
  const [movements, setMovements] = React.useState<MovementRecord[]>([]);
  const [products, setProducts] = React.useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseOption[]>([]);
  const [stats, setStats] = React.useState<StatsSummary>({
    total: 0,
    receipts: 0,
    deliveries: 0,
    transfers: 0,
    adjustments: 0,
  });

  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState("ALL");
  const [selectedOperation, setSelectedOperation] = React.useState("ALL");
  const [selectedWarehouse, setSelectedWarehouse] = React.useState("ALL");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Pagination
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // Load Filter Options (Products, Warehouses, Stats)
  React.useEffect(() => {
    async function loadOptions() {
      try {
        const [prodRes, whRes, statsRes] = await Promise.all([
          fetch("/api/products?limit=100"),
          fetch("/api/warehouses?limit=100"),
          fetch("/api/ledger?stats=true"),
        ]);

        if (prodRes.ok) {
          const json = await prodRes.json();
          setProducts(json.data || []);
        }
        if (whRes.ok) {
          const json = await whRes.json();
          setWarehouses(json.data || []);
        }
        if (statsRes.ok) {
          const json = await statsRes.json();
          if (json.data) {
            setStats(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load ledger options:", err);
      }
    }
    loadOptions();
  }, []);

  // Fetch Movements
  const fetchMovements = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search.trim()) params.set("search", search.trim());
      if (selectedProduct !== "ALL") params.set("productId", selectedProduct);
      if (selectedOperation !== "ALL") params.set("operationType", selectedOperation);
      if (selectedWarehouse !== "ALL") params.set("warehouseId", selectedWarehouse);
      if (startDate) params.set("startDate", new Date(startDate).toISOString());
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        params.set("endDate", endD.toISOString());
      }

      const res = await fetch(`/api/ledger?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setMovements(json.data || []);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalCount(json.meta.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch movements:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedProduct, selectedOperation, selectedWarehouse, startDate, endDate]);

  React.useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMovements();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedProduct("ALL");
    setSelectedOperation("ALL");
    setSelectedWarehouse("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Resolve Reference link route
  const getReferenceLink = (reference: string) => {
    if (reference.startsWith("REC-")) return `/operations/receipts?search=${reference}`;
    if (reference.startsWith("DEL-")) return `/operations/deliveries?search=${reference}`;
    if (reference.startsWith("TRF-")) return `/operations/transfers?search=${reference}`;
    if (reference.startsWith("ADJ-")) return `/operations/adjustments?search=${reference}`;
    return "#";
  };

  // Operation Type Badge Renderer
  const renderOperationBadge = (type: MovementRecord["operationType"]) => {
    switch (type) {
      case "RECEIPT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowDownToLine className="h-3 w-3" />
            Receipt
          </span>
        );
      case "DELIVERY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ArrowUpFromLine className="h-3 w-3" />
            Delivery
          </span>
        );
      case "INTERNAL_TRANSFER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Shuffle className="h-3 w-3" />
            Transfer
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <SlidersHorizontal className="h-3 w-3" />
            Adjustment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-300">
            {type}
          </span>
        );
    }
  };

  // Directional Quantity Renderer
  const renderQuantityDisplay = (record: MovementRecord) => {
    const qty = record.quantity;
    const uom = record.uom || record.product.uom || "Units";

    switch (record.operationType) {
      case "RECEIPT":
        return (
          <span className="font-mono font-bold text-emerald-400 flex items-center justify-end gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            +{Math.abs(qty)} {uom}
          </span>
        );
      case "DELIVERY":
        return (
          <span className="font-mono font-bold text-amber-400 flex items-center justify-end gap-1">
            <TrendingDown className="h-3.5 w-3.5" />
            -{Math.abs(qty)} {uom}
          </span>
        );
      case "INTERNAL_TRANSFER":
        return (
          <span className="font-mono font-bold text-blue-400 flex items-center justify-end gap-1">
            <ArrowRight className="h-3.5 w-3.5" />
            {Math.abs(qty)} {uom}
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span
            className={`font-mono font-bold flex items-center justify-end gap-1 ${
              qty > 0 ? "text-emerald-400" : qty < 0 ? "text-red-400" : "text-zinc-400"
            }`}
          >
            {qty > 0 ? (
              <>
                <TrendingUp className="h-3.5 w-3.5" />+{qty} {uom}
              </>
            ) : qty < 0 ? (
              <>
                <TrendingDown className="h-3.5 w-3.5" />
                {qty} {uom}
              </>
            ) : (
              `0 ${uom}`
            )}
          </span>
        );
      default:
        return (
          <span className="font-mono font-bold text-zinc-200">
            {qty} {uom}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <PageHeader
        title="Stock Movement History & Ledger"
        description="Centralized, immutable audit trail of all receipts, deliveries, internal transfers, and physical count adjustments."
      />

      {/* KPI Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Movements", value: stats.total || totalCount, key: "ALL", icon: Layers, color: "text-zinc-400" },
          { label: "Receipts", value: stats.receipts, key: "RECEIPT", icon: ArrowDownToLine, color: "text-emerald-400" },
          { label: "Deliveries", value: stats.deliveries, key: "DELIVERY", icon: ArrowUpFromLine, color: "text-amber-400" },
          { label: "Transfers", value: stats.transfers, key: "INTERNAL_TRANSFER", icon: Shuffle, color: "text-blue-400" },
          { label: "Adjustments", value: stats.adjustments, key: "ADJUSTMENT", icon: SlidersHorizontal, color: "text-purple-400" },
        ].map((tab) => {
          const isActive = selectedOperation === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedOperation(tab.key);
                setPage(1);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? "bg-zinc-800/90 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                  : "bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-800/40 hover:border-zinc-700 text-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={isActive ? "text-zinc-200" : "text-zinc-400"}>{tab.label}</span>
                <Icon className={`h-4 w-4 ${tab.color}`} />
              </div>
              <div className="mt-2 text-xl font-bold text-zinc-100">{tab.value}</div>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-zinc-900/60 border-zinc-800/80 backdrop-blur-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by SKU, product name, or reference (e.g. REC-, TRF-)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500"
              />
            </div>

            {/* Product Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by Product"
                className="w-full h-9 rounded-lg px-3 bg-zinc-950/60 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="ALL">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedWarehouse}
                onChange={(e) => {
                  setSelectedWarehouse(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by Warehouse"
                className="w-full h-9 rounded-lg px-3 bg-zinc-950/60 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="ALL">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Action Buttons */}
            <div className="md:col-span-2 flex items-center gap-2">
              <Button
                type="submit"
                variant="outline"
                className="flex-1 border-zinc-700 bg-zinc-800/60 hover:bg-zinc-750 text-zinc-200"
              >
                Filter
              </Button>
              {(search ||
                selectedProduct !== "ALL" ||
                selectedOperation !== "ALL" ||
                selectedWarehouse !== "ALL" ||
                startDate ||
                endDate) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="text-zinc-400 hover:text-zinc-200 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Date Range Sub-Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 whitespace-nowrap">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 bg-zinc-950/60 border-zinc-800 text-zinc-200 text-xs focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 whitespace-nowrap">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 bg-zinc-950/60 border-zinc-800 text-zinc-200 text-xs focus:border-indigo-500"
              />
            </div>
          </div>
        </form>
      </Card>

      {/* Ledger Records Table */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-zinc-400">Loading stock movement ledger...</p>
          </div>
        ) : movements.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <History className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium text-zinc-200">
                {search ||
                selectedProduct !== "ALL" ||
                selectedOperation !== "ALL" ||
                selectedWarehouse !== "ALL" ||
                startDate ||
                endDate
                  ? "No movements match your filters."
                  : "No stock movements found."}
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Stock movements are automatically recorded in the ledger when receipts, deliveries, transfers, or adjustments are validated.
              </p>
            </div>
            {(search ||
              selectedProduct !== "ALL" ||
              selectedOperation !== "ALL" ||
              selectedWarehouse !== "ALL" ||
              startDate ||
              endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="border-zinc-700 bg-zinc-800 text-zinc-300"
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800/80">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {movements.map((movement) => {
                  const refUrl = getReferenceLink(movement.reference);

                  return (
                    <tr
                      key={movement.id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Date / Time */}
                      <td className="py-3.5 px-4 text-zinc-300 text-xs whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200">
                            {new Date(movement.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {new Date(movement.createdAt).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4 text-zinc-200">
                        <div className="flex flex-col">
                          <Link
                            href={`/products/${movement.productId}`}
                            className="font-semibold text-zinc-100 hover:text-indigo-400 transition-colors flex items-center gap-1"
                          >
                            <Package className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span>{movement.product.name}</span>
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                            <span>{movement.product.sku}</span>
                            {movement.product.category && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-500">
                                  {movement.product.category.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Operation Type */}
                      <td className="py-3.5 px-4">
                        {renderOperationBadge(movement.operationType)}
                      </td>

                      {/* Reference */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <Link
                          href={refUrl}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <span>{movement.reference}</span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      </td>

                      {/* Source Location */}
                      <td className="py-3.5 px-4 text-zinc-300 text-xs">
                        {movement.sourceLocation ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-zinc-200 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                              {movement.sourceLocation.name}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {movement.sourceLocation.warehouse?.name || "Warehouse"} (
                              {movement.sourceLocation.code})
                            </span>
                          </div>
                        ) : movement.operationType === "RECEIPT" ? (
                          <span className="text-zinc-500 italic text-[11px]">
                            Vendor / Supplier
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-mono">-</span>
                        )}
                      </td>

                      {/* Destination Location */}
                      <td className="py-3.5 px-4 text-zinc-300 text-xs">
                        {movement.destinationLocation ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-zinc-200 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                              {movement.destinationLocation.name}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {movement.destinationLocation.warehouse?.name || "Warehouse"} (
                              {movement.destinationLocation.code})
                            </span>
                          </div>
                        ) : movement.operationType === "DELIVERY" ? (
                          <span className="text-zinc-500 italic text-[11px]">
                            Customer / Outbound
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-mono">-</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-right">
                        {renderQuantityDisplay(movement)}
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 text-zinc-300 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-zinc-500 shrink-0" />
                          <span>
                            {movement.performedBy?.name || "System Admin"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        {!loading && movements.length > 0 && (
          <div className="p-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 bg-zinc-950/40">
            <div>
              Showing <span className="font-semibold text-zinc-200">{(page - 1) * 20 + 1}</span> to{" "}
              <span className="font-semibold text-zinc-200">
                {Math.min(page * 20, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-zinc-200">{totalCount}</span> movements
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-zinc-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
