"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowDownToLine,
  Building2,
  MapPin,
  Package,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Check,
  History,
  FileText,
  Boxes,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

interface ReceiptItemDetail {
  id: string;
  quantityExpected: number;
  quantityReceived: number;
  uom: string;
  product: {
    id: string;
    name: string;
    sku: string;
    uom: string;
    category?: { name: string } | null;
  };
  location?: {
    id: string;
    name: string;
    code: string;
    warehouse?: { name: string; code: string } | null;
  } | null;
}

interface ReceiptDetail {
  id: string;
  referenceNumber: string;
  supplierName: string;
  supplierId?: string | null;
  supplier?: {
    id: string;
    name: string;
    code?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  warehouseId?: string | null;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  } | null;
  destinationLocationId?: string | null;
  destinationLocation?: {
    id: string;
    name: string;
    code: string;
  } | null;
  status: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";
  scheduledDate?: string | null;
  notes?: string | null;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  validatedById?: string | null;
  validatedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  validatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ReceiptItemDetail[];
}

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();

  const isManager = user?.role === "INVENTORY_MANAGER" || user?.role === "ADMIN";

  // States
  const [receipt, setReceipt] = React.useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Action States
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [validateModalOpen, setValidateModalOpen] = React.useState(false);

  const fetchReceipt = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/receipts/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Receipt not found");
        throw new Error("Failed to load receipt details");
      }
      const json = await res.json();
      setReceipt(json.data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  // Handle Mark Ready
  const handleMarkReady = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/receipts/${id}/ready`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to mark receipt as ready");
      }
      fetchReceipt();
    } catch (err: any) {
      setActionError(err.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Validate Receipt (Atomic stock allocation)
  const handleValidateReceipt = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/receipts/${id}/validate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to validate receipt");
      }
      setValidateModalOpen(false);
      fetchReceipt();
    } catch (err: any) {
      setActionError(err.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Receipt
  const handleCancelReceipt = async () => {
    if (!window.confirm("Are you sure you want to cancel this receipt?")) return;
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/receipts/${id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to cancel receipt");
      }
      fetchReceipt();
    } catch (err: any) {
      setActionError(err.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-400 mb-3" />
        <p className="text-sm text-zinc-400">Loading receipt details from PostgreSQL...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-100">Receipt Not Found</h2>
        <p className="text-sm text-zinc-400">
          {error || "The requested receipt could not be found in the database."}
        </p>
        <Link href="/operations/receipts">
          <Button variant="outline" className="border-zinc-700">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Receipts
          </Button>
        </Link>
      </div>
    );
  }

  const totalQuantity = receipt.items.reduce((sum, it) => sum + it.quantityReceived, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/operations/receipts"
          className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Receipts
        </Link>
      </div>

      {actionError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Action Failed</p>
            <p className="text-xs text-red-300 mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {/* Completion Banner if DONE */}
      {receipt.status === "DONE" && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-300">
                Shipment Formally Validated & Received
              </p>
              <p className="text-xs text-emerald-400/80 mt-0.5">
                Quantities have been automatically credited to destination warehouse stock and logged in the immutable Stock Ledger.
              </p>
            </div>
          </div>
          <Link
            href={`/operations/ledger?search=${encodeURIComponent(receipt.referenceNumber)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold shrink-0 transition-colors"
          >
            <History className="h-3.5 w-3.5" />
            View in Ledger
          </Link>
        </div>
      )}

      {/* Header Overview Card */}
      <Card className="p-6 bg-zinc-900/60 border-zinc-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
              <ArrowDownToLine className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold font-mono text-zinc-100">
                  {receipt.referenceNumber}
                </h1>
                <StatusBadge status={receipt.status} />
              </div>
              <p className="text-sm text-zinc-300 font-medium mt-1">
                Vendor: <span className="text-zinc-100 font-semibold">{receipt.supplierName}</span>
              </p>
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status: DRAFT */}
            {receipt.status === "DRAFT" && (
              <>
                <Button
                  onClick={handleMarkReady}
                  disabled={actionLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-xs shadow-lg shadow-amber-500/20"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Clock className="h-3.5 w-3.5 mr-1.5" />}
                  Mark as Ready
                </Button>
                {isManager && (
                  <Button
                    onClick={handleCancelReceipt}
                    disabled={actionLoading}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                  >
                    Cancel Receipt
                  </Button>
                )}
              </>
            )}

            {/* Status: READY */}
            {receipt.status === "READY" && (
              <>
                {isManager ? (
                  <Button
                    onClick={() => setValidateModalOpen(true)}
                    disabled={actionLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/25"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Validate Receipt
                  </Button>
                ) : (
                  <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                    Awaiting Manager Validation
                  </span>
                )}
                {isManager && (
                  <Button
                    onClick={handleCancelReceipt}
                    disabled={actionLoading}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                  >
                    Cancel Receipt
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-400 font-medium">Destination Facility</span>
            <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{receipt.warehouse?.name || "General Facility"}</span>
            </div>
            {receipt.warehouse?.code && (
              <span className="font-mono text-[10px] text-zinc-400">({receipt.warehouse.code})</span>
            )}
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-400 font-medium">Recorded By</span>
            <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
              <User className="h-3.5 w-3.5 text-blue-400" />
              <span>{receipt.createdBy.name}</span>
            </div>
            <span className="text-[10px] text-zinc-400">{new Date(receipt.createdAt).toLocaleString()}</span>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-400 font-medium">Validation Status</span>
            {receipt.validatedBy ? (
              <>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{receipt.validatedBy.name}</span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  {receipt.validatedAt ? new Date(receipt.validatedAt).toLocaleString() : "Completed"}
                </span>
              </>
            ) : (
              <p className="text-zinc-400 mt-1">Pending Validation</p>
            )}
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-zinc-400 font-medium">Scheduled / Delivery Date</span>
            <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>{receipt.scheduledDate ? new Date(receipt.scheduledDate).toLocaleDateString() : "Not specified"}</span>
            </div>
          </div>
        </div>

        {receipt.notes && (
          <div className="p-3 bg-zinc-950/40 border border-zinc-800/60 rounded-xl text-xs">
            <span className="text-zinc-400 font-medium">Operational Notes / Bill of Lading:</span>
            <p className="text-zinc-200 mt-0.5">{receipt.notes}</p>
          </div>
        )}
      </Card>

      {/* Line Items Table */}
      <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-400" />
            Received Product Items ({receipt.items.length} Lines)
          </h3>
          <span className="text-xs text-zinc-400 font-medium">
            Total Units: <strong className="text-emerald-400">{totalQuantity.toLocaleString()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-6">SKU</th>
                <th className="py-3.5 px-6">Destination Location</th>
                <th className="py-3.5 px-6 text-right">Received Quantity</th>
                <th className="py-3.5 px-6 text-center">UOM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {receipt.items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-6">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="font-medium text-zinc-100 hover:text-emerald-400 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    {item.product.category && (
                      <p className="text-[11px] text-zinc-400 mt-0.5">{item.product.category.name}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="font-mono text-xs px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
                      {item.product.sku}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-1.5 text-zinc-200">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{item.location?.name || "Warehouse Default"}</span>
                      {item.location?.code && (
                        <span className="text-xs text-zinc-400 font-mono">({item.location.code})</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-right font-bold text-emerald-400 text-base">
                    {item.quantityReceived.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="text-xs text-zinc-400 font-medium px-2 py-0.5 bg-zinc-800/80 rounded border border-zinc-700/50">
                      {item.uom}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-400">Destination Warehouse: {receipt.warehouse?.name || "Default"}</span>
          <span className="text-zinc-200 font-semibold">
            Total Received:{" "}
            <span className="text-emerald-400 font-bold text-sm">
              {totalQuantity.toLocaleString()}
            </span>{" "}
            units
          </span>
        </div>
      </Card>

      {/* Modal: Validate Receipt Confirmation */}
      {validateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400 border-b border-zinc-800 pb-3">
              <CheckCircle2 className="h-6 w-6" />
              <h3 className="text-base font-bold text-zinc-100">Validate Receipt?</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This will add the received quantities (<strong>{totalQuantity.toLocaleString()} units</strong>) directly into the specified warehouse locations and create permanent audit entries in the Stock Ledger.
            </p>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 space-y-1">
              <p>• Receipt status will transition to <strong>DONE</strong>.</p>
              <p>• Stock changes are atomically applied in a single database transaction.</p>
              <p>• This action cannot be undone directly.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValidateModalOpen(false)}
                disabled={actionLoading}
                className="border-zinc-700 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={actionLoading}
                onClick={handleValidateReceipt}
                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Validate Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
