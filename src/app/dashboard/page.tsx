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
  Database,
  ArrowRight,
  ShieldCheck,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Placeholder foundation KPI metrics for Phase 1
  const kpis = {
    totalProducts: "128",
    lowStock: "14",
    outOfStock: "3",
    pendingReceipts: "8",
    pendingDeliveries: "12",
    internalTransfers: "5",
  };

  const placeholderMovements = [
    {
      id: "1",
      reference: "REC-2026-0042",
      product: "Raw Steel Ingot 50kg",
      sku: "RAW-STL-050",
      source: "Vendor (Acme Supplies)",
      destination: "Main Warehouse / Rack A1",
      quantity: "+ 250 Units",
      type: "RECEIPT",
      status: "DONE",
      date: "Today, 09:30 AM",
    },
    {
      id: "2",
      reference: "DEL-2026-0019",
      product: "Hydraulic Pump Motor 2HP",
      sku: "ENG-PMP-2HP",
      source: "Main Warehouse / Rack B3",
      destination: "Customer (BuildCorp Ltd)",
      quantity: "- 40 Units",
      type: "DELIVERY",
      status: "READY",
      date: "Today, 08:15 AM",
    },
    {
      id: "3",
      reference: "TRA-2026-0008",
      product: "Heavy Duty Bearings 100mm",
      sku: "BRG-HD-100",
      source: "Central Storage / Bay 2",
      destination: "Assembly Floor / Line 1",
      quantity: "60 Units",
      type: "INTERNAL_TRANSFER",
      status: "WAITING",
      date: "Yesterday",
    },
    {
      id: "4",
      reference: "ADJ-2026-0004",
      product: "Silicon Thermal Paste 50g",
      sku: "CMP-PST-050",
      source: "Electronics Storage",
      destination: "Inventory Loss (Scrap)",
      quantity: "- 5 Units",
      type: "ADJUSTMENT",
      status: "DONE",
      date: "Sep 24, 2026",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Page Header */}
      <PageHeader
        title="Inventory Overview"
        description="StockSense modular inventory management foundation & real-time operation monitor."
      >
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/operations/ledger">
            <Layers className="w-4 h-4" />
            Stock Ledger
          </Link>
        </Button>
        <Button asChild variant="default" size="sm" className="gap-2">
          <Link href="/products">
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </Button>
      </PageHeader>

      {/* Phase 1 Architecture Readiness Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Phase 1 Active
              </span>
              <span className="text-xs text-indigo-200 font-medium">
                Foundation & Architecture Configured
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              StockSense Modular Core Initialized
            </h2>
            <p className="text-xs text-indigo-200/90 leading-relaxed">
              PostgreSQL schema, Prisma ORM, Zod validation models, and layered
              service/repository architecture are set up. Ready for Phase 2 functional workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="bg-white text-indigo-950 hover:bg-indigo-50 font-semibold"
            >
              <Link href="/api/health" target="_blank" className="gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                Test API Health
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 6 Required KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Total Products"
          value={kpis.totalProducts}
          description="In active catalog"
          icon={Package}
          variant="default"
        />
        <KpiCard
          title="Low Stock"
          value={kpis.lowStock}
          description="Below reorder min"
          icon={AlertTriangle}
          variant="warning"
        />
        <KpiCard
          title="Out of Stock"
          value={kpis.outOfStock}
          description="Needs replenishment"
          icon={PackageX}
          variant="danger"
        />
        <KpiCard
          title="Pending Receipts"
          value={kpis.pendingReceipts}
          description="Incoming shipments"
          icon={ArrowDownToLine}
          variant="info"
        />
        <KpiCard
          title="Pending Deliveries"
          value={kpis.pendingDeliveries}
          description="Outgoing orders"
          icon={ArrowUpFromLine}
          variant="info"
        />
        <KpiCard
          title="Internal Transfers"
          value={kpis.internalTransfers}
          description="Warehouse movements"
          icon={Shuffle}
          variant="default"
        />
      </div>

      {/* Operations Quick Access & Activity Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Stock Movements Audit Trail */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Recent Inventory Movements (Ledger)
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time traceability for receipts, deliveries, and adjustments.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-indigo-600 gap-1">
                <Link href="/operations/ledger">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-y border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Reference</th>
                      <th className="px-4 py-3">Product & SKU</th>
                      <th className="px-4 py-3">Route / Locations</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {placeholderMovements.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-indigo-600 dark:text-indigo-400">
                          {item.reference}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{item.product}</p>
                          <p className="text-[11px] text-slate-400">{item.sku}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                          <p className="truncate max-w-[180px]">{item.source}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">➔ {item.destination}</p>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
