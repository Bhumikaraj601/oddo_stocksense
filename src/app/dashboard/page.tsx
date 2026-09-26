"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  AlertTriangle,
  PackageX,
  ArrowDownToLine,
  ArrowUpFromLine,
  Shuffle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus,
  Loader2,
  RefreshCw,
  Boxes,
} from "lucide-react";
import Link from "next/link";
import { formatNumber, formatDate } from "@/lib/utils";

interface DashboardData {
  kpis: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    pendingReceipts: number;
    pendingDeliveries: number;
    internalTransfersCount: number;
  };
  recentMovements: Array<{
    id: string;
    reference: string;
    operationType: string;
    quantity: number;
    uom: string;
    createdAt: string;
    product: { id: string; name: string; sku: string };
    sourceLocation: { id: string; name: string; warehouse?: { name: string } } | null;
    destinationLocation: { id: string; name: string; warehouse?: { name: string } } | null;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const kpis = data?.kpis || {
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    internalTransfersCount: 0,
  };

  const combinedLowAndOutOfStock = kpis.lowStockCount + kpis.outOfStockCount;

  return (
    <div className="space-y-8">
      {/* Top Page Header */}
      <PageHeader
        title="Inventory Overview"
        description="StockSense modular inventory management foundation & real-time operation monitor."
      >
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          disabled={isLoading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/operations/move-history">
            <Layers className="w-4 h-4" />
            Stock Ledger
          </Link>
        </Button>
        <Button asChild variant="default" size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link href="/products/new">
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </Button>
      </PageHeader>

      {/* Low Stock Warning Banner if reorders are needed */}
      {combinedLowAndOutOfStock > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {combinedLowAndOutOfStock} {combinedLowAndOutOfStock === 1 ? "Product Requires" : "Products Require"} Stock Replenishment
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {kpis.outOfStockCount} out of stock (0 on-hand) &bull; {kpis.lowStockCount} below minimum safety threshold.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40 shrink-0">
            <Link href="/products/low-stock" className="gap-1.5 text-xs font-semibold">
              View Low Stock Alerts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* 6 Required KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link href="/products" className="transition-transform hover:-translate-y-0.5">
          <KpiCard
            title="Total Products"
            value={isLoading ? "..." : formatNumber(kpis.totalProducts)}
            description="Active catalog SKUs"
            icon={Package}
            variant="default"
          />
        </Link>

        <Link href="/products/low-stock" className="transition-transform hover:-translate-y-0.5">
          <KpiCard
            title="Low / Out of Stock"
            value={isLoading ? "..." : formatNumber(combinedLowAndOutOfStock)}
            description={`${kpis.outOfStockCount} out of stock, ${kpis.lowStockCount} low`}
            icon={AlertTriangle}
            variant={combinedLowAndOutOfStock > 0 ? "warning" : "default"}
          />
        </Link>

        <Link href="/products?stockStatus=OUT_OF_STOCK" className="transition-transform hover:-translate-y-0.5">
          <KpiCard
            title="Out of Stock"
            value={isLoading ? "..." : formatNumber(kpis.outOfStockCount)}
            description="0 on-hand stock"
            icon={PackageX}
            variant={kpis.outOfStockCount > 0 ? "danger" : "default"}
          />
        </Link>

        <Link href="/operations/receipts" className="transition-transform hover:-translate-y-0.5">
          <KpiCard
            title="Pending Receipts"
            value={isLoading ? "..." : formatNumber(kpis.pendingReceipts)}
            description="Incoming shipments"
            icon={ArrowDownToLine}
            variant="info"
          />
        </Link>

        <Link href="/operations/deliveries" className="transition-transform hover:-translate-y-0.5">
          <KpiCard
            title="Pending Deliveries"
            value={isLoading ? "..." : formatNumber(kpis.pendingDeliveries)}
            description="Outgoing customer orders"
            icon={ArrowUpFromLine}
            variant="info"
          />
        </Link>

        <Link href="/operations/transfers" className="transition-transform hover:-translate-y-0.5">
          <KpiCard
            title="Internal Transfers"
            value={isLoading ? "..." : formatNumber(kpis.internalTransfersCount)}
            description="Warehouse movements"
            icon={Shuffle}
            variant="default"
          />
        </Link>
      </div>

      {/* Operations Quick Access & Activity Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Stock Movements Audit Trail */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Recent Inventory Movements (Move History)
                </CardTitle>
                <CardDescription className="text-xs">
                  Traceability for receipts, deliveries, transfers, and adjustments.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-indigo-600 gap-1">
                <Link href="/operations/move-history">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                  <p className="text-xs">Loading latest movements...</p>
                </div>
              ) : !data?.recentMovements || data.recentMovements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Boxes className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">No stock movements recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-y border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Reference</th>
                        <th className="px-4 py-3">Product & SKU</th>
                        <th className="px-4 py-3">Route / Locations</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.recentMovements.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-3.5 font-medium font-mono text-indigo-600 dark:text-indigo-400">
                            {item.reference}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{item.product.name}</p>
                            <p className="text-[11px] font-mono text-slate-400">{item.product.sku}</p>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                            <p className="truncate max-w-[180px]">
                              {item.sourceLocation ? `${item.sourceLocation.warehouse?.name ? item.sourceLocation.warehouse.name + " / " : ""}${item.sourceLocation.name}` : "External / Vendor"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              ➔ {item.destinationLocation ? `${item.destinationLocation.warehouse?.name ? item.destinationLocation.warehouse.name + " / " : ""}${item.destinationLocation.name}` : "External / Customer"}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 font-semibold font-mono text-slate-900 dark:text-slate-100">
                            {formatNumber(item.quantity)} {item.uom}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={item.operationType} />
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                            {formatDate(item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Quick Operation Triggers */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Quick Operations
              </CardTitle>
              <CardDescription className="text-xs">
                Jump directly to core warehouse workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Link
                href="/products/low-stock"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      Low Stock Alerts
                    </p>
                    <p className="text-[11px] text-slate-500">{combinedLowAndOutOfStock} items need reordering</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/operations/receipts"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 border border-sky-100 dark:border-sky-900">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Incoming Receipts
                    </p>
                    <p className="text-[11px] text-slate-500">Receive supplier stock</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/operations/deliveries"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                    <ArrowUpFromLine className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Delivery Orders
                    </p>
                    <p className="text-[11px] text-slate-500">Dispatch outgoing goods</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/operations/transfers"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400 border border-violet-100 dark:border-violet-900">
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Internal Transfers
                    </p>
                    <p className="text-[11px] text-slate-500">Relocate between locations</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/operations/adjustments"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Stock Adjustments
                    </p>
                    <p className="text-[11px] text-slate-500">Physical count audit</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
