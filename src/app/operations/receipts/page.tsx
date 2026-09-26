"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  Plus,
  Search,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Filter,
  ArrowRight,
  Package,
  Layers,
  Check,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";

interface ReceiptItemSummary {
  id: string;
  quantityReceived: number;
  uom: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  location?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface ReceiptSummary {
  id: string;
  referenceNumber: string;
  supplierName: string;
  status: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";
  scheduledDate?: string | null;
  createdAt: string;
  notes?: string | null;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
  validatedBy?: {
    id: string;
    name: string;
  } | null;
  items: ReceiptItemSummary[];
  _count?: {
    items: number;
  };
}

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

export default function ReceiptsPage() {
  const { user } = useAuth();
  const canCreate = Boolean(user);

  // States
  const [receipts, setReceipts] = React.useState<ReceiptSummary[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // Load Warehouses for Filter
  React.useEffect(() => {
    async function loadWarehouses() {
      try {
        const res = await fetch("/api/warehouses?limit=100");
        if (res.ok) {
          const json = await res.json();
          setWarehouses(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load warehouses for filter", err);
      }
    }
    loadWarehouses();
  }, []);

  // Fetch Receipts
  const fetchReceipts = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        warehouseId: warehouseFilter,
      });
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/receipts?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setReceipts(json.data || []);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalCount(json.meta.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load receipts", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, warehouseFilter, search]);

  React.useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // KPI Calculations
  const draftCount = receipts.filter((r) => r.status === "DRAFT").length;
  const readyCount = receipts.filter((r) => r.status === "READY").length;
  const doneCount = receipts.filter((r) => r.status === "DONE").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Incoming Stock Receipts"
          description="Record incoming purchase shipments from suppliers, manage verification workflows, and commit stock increases to inventory."
        />
        {canCreate && (
          <Button
            asChild
            className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/20"
          >
            <Link href="/operations/receipts/new">
              <Plus className="h-4 w-4 mr-2" />
              New Receipt
            </Link>
          </Button>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900/60 border-zinc-800 flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <ArrowDownToLine className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Total Receipts</p>
            <h3 className="text-xl font-bold text-zinc-100">{totalCount}</h3>
            <p className="text-[11px] text-zinc-400">All recorded shipments</p>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/60 border-zinc-800 flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Ready for Validation</p>
            <h3 className="text-xl font-bold text-amber-400">{readyCount}</h3>
            <p className="text-[11px] text-zinc-400">Actionable shipments</p>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/60 border-zinc-800 flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Received & Done</p>
            <h3 className="text-xl font-bold text-emerald-400">{doneCount}</h3>
            <p className="text-[11px] text-zinc-400">Stock added to ledger</p>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/60 border-zinc-800 flex items-center gap-3.5">
          <div className="p-3 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Draft Receipts</p>
            <h3 className="text-xl font-bold text-zinc-300">{draftCount}</h3>
            <p className="text-[11px] text-zinc-400">No stock change yet</p>
          </div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 bg-zinc-900/60 border-zinc-800 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by receipt number, supplier, SKU, product..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9 bg-zinc-950/60 border-zinc-700/80 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-zinc-950/60 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="READY">Ready</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Warehouse:</span>
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setPage(1);
              }}
              className="bg-zinc-950/60 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Receipts Table */}
      <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-4 px-6">Receipt No.</th>
                <th className="py-4 px-6">Supplier</th>
                <th className="py-4 px-6">Destination Facility</th>
                <th className="py-4 px-6">Items Received</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Created Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Loading receipts from PostgreSQL...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <ArrowDownToLine className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-300 font-medium text-base">No receipts found</p>
                    <p className="text-zinc-400 text-xs mt-1">
                      {search || statusFilter !== "ALL" || warehouseFilter !== "ALL"
                        ? "Try clearing filters or adjusting your search query."
                        : "Create a new receipt to record incoming goods from suppliers."}
                    </p>
                    {canCreate && (
                      <Button asChild size="sm" className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold">
                        <Link href="/operations/receipts/new">
                          <Plus className="h-4 w-4 mr-1.5" /> Create New Receipt
                        </Link>
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                receipts.map((rcpt) => (
                  <tr
                    key={rcpt.id}
                    className="hover:bg-zinc-800/40 transition-colors group"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-zinc-100">
                      <Link
                        href={`/operations/receipts/${rcpt.id}`}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                      >
                        {rcpt.referenceNumber}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-medium text-zinc-200">
                      {rcpt.supplierName}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{rcpt.warehouse?.name || "General Facility"}</span>
                        {rcpt.warehouse?.code && (
                          <span className="text-[11px] font-mono text-zinc-400">
                            ({rcpt.warehouse.code})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-zinc-200">
                          {rcpt.items?.length || 0} line item{rcpt.items?.length !== 1 ? "s" : ""}
                        </span>
                        <div className="text-[11px] text-zinc-400 line-clamp-1">
                          {rcpt.items?.map((it) => `${it.product?.name} (${it.quantityReceived} ${it.uom})`).join(", ")}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={rcpt.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-zinc-400">
                      {new Date(rcpt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/operations/receipts/${rcpt.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="py-4 px-6 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing {receipts.length} of {totalCount} receipts
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 text-xs border-zinc-700"
              >
                Previous
              </Button>
              <span className="text-zinc-300 font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 text-xs border-zinc-700"
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
