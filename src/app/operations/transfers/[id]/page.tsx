"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Shuffle,
  AlertCircle,
  Loader2,
  Check,
  XCircle,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TransferItemDetail {
  id: string;
  productId: string;
  quantity: number;
  uom: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category?: { name: string };
  };
}

interface TransferDetail {
  id: string;
  referenceNumber: string;
  status: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";
  scheduledDate?: string | null;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string | null;
  notes?: string | null;
  sourceWarehouse?: {
    id: string;
    name: string;
    code: string;
  } | null;
  sourceLocation: {
    id: string;
    name: string;
    code: string;
  };
  destinationWarehouse?: {
    id: string;
    name: string;
    code: string;
  } | null;
  destinationLocation: {
    id: string;
    name: string;
    code: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  validatedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  items: TransferItemDetail[];
}

export default function TransferDetailPage() {
  const params = useParams();
  const transferId = params?.id as string;

  const [transfer, setTransfer] = React.useState<TransferDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Modals
  const [showValidateModal, setShowValidateModal] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);

  const fetchTransfer = React.useCallback(async () => {
    if (!transferId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/transfers/${transferId}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed to load internal transfer");
      }
      const json = await res.json();
      setTransfer(json.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch transfer details.");
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  React.useEffect(() => {
    fetchTransfer();
  }, [fetchTransfer]);

  // Handle Mark Ready
  const handleMarkReady = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/transfers/${transferId}/ready`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to mark transfer as READY");
      }
      setSuccessMessage("Internal transfer is now READY to be executed.");
      await fetchTransfer();
    } catch (err: any) {
      setErrorMessage(err.message || "Error updating transfer.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Validate (Atomic Stock Move)
  const handleValidate = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/transfers/${transferId}/validate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to validate internal transfer");
      }
      setShowValidateModal(false);
      setSuccessMessage(
        "Internal stock transfer completed successfully! Stock has been deducted from source and added to destination."
      );
      await fetchTransfer();
    } catch (err: any) {
      setErrorMessage(err.message || "Error validating transfer.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel
  const handleCancel = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/transfers/${transferId}/cancel`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to cancel transfer");
      }
      setShowCancelModal(false);
      setSuccessMessage("Internal transfer has been canceled.");
      await fetchTransfer();
    } catch (err: any) {
      setErrorMessage(err.message || "Error canceling transfer.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-zinc-400">Loading transfer details...</p>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-100">Transfer not found</h2>
        <Link href="/operations/transfers">
          <Button variant="outline" className="text-zinc-300">
            Back to Transfers
          </Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { key: "DRAFT", label: "Draft", desc: "Transfer Prepared" },
    { key: "READY", label: "Ready", desc: "Stock Verified" },
    { key: "DONE", label: "Validated / Moved", desc: "Stock Relocated" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "DRAFT":
        return 0;
      case "WAITING":
      case "READY":
        return 1;
      case "DONE":
        return 2;
      default:
        return -1;
    }
  };

  const currentStepIdx = getStepIndex(transfer.status);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Bar & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/operations/transfers">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {transfer.referenceNumber}
              </span>
              <StatusBadge status={transfer.status} />
            </div>
            <h1 className="text-xl font-bold text-zinc-100 mt-1 flex items-center gap-2">
              <span>{transfer.sourceLocation.name}</span>
              <span className="text-zinc-500">➔</span>
              <span>{transfer.destinationLocation.name}</span>
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {transfer.status === "DRAFT" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="border-zinc-700 bg-zinc-900 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={handleMarkReady}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1.5" />
                )}
                Mark as Ready
              </Button>
            </>
          )}

          {(transfer.status === "READY" || transfer.status === "WAITING") && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="border-zinc-700 bg-zinc-900 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => setShowValidateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Validate & Move Stock
              </Button>
            </>
          )}

          {transfer.status === "DONE" && (
            <Link href="/operations/ledger">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                View in Stock Ledger
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Operation Error</p>
            <p className="mt-0.5 text-xs text-red-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Operation Completed</p>
            <p className="mt-0.5 text-xs text-emerald-300/90">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Stepper */}
      {transfer.status !== "CANCELED" && (
        <Card className="p-4 bg-zinc-900/60 border-zinc-800/80">
          <div className="grid grid-cols-3 gap-3">
            {steps.map((step, idx) => {
              const isCompleted = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    isCurrent
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : isCompleted
                      ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-300"
                      : "bg-zinc-950/40 border-zinc-800/40 text-zinc-500"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isCompleted
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{step.label}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source & Destination */}
        <Card className="p-5 bg-zinc-900/60 border-zinc-800/80 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 border-b border-zinc-800/80 pb-2">
            <Shuffle className="h-4 w-4 text-emerald-400" />
            Transfer Movement Route
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-zinc-400 block flex items-center gap-1">
                <MapPin className="h-3 w-3 text-amber-400" />
                Source (From)
              </span>
              <p className="font-semibold text-zinc-100">{transfer.sourceLocation.name}</p>
              <p className="text-xs text-zinc-400 font-mono">
                {transfer.sourceWarehouse?.name || "Warehouse"} ({transfer.sourceLocation.code})
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-zinc-400 block flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-400" />
                Destination (To)
              </span>
              <p className="font-semibold text-zinc-100">{transfer.destinationLocation.name}</p>
              <p className="text-xs text-zinc-400 font-mono">
                {transfer.destinationWarehouse?.name || "Warehouse"} ({transfer.destinationLocation.code})
              </p>
            </div>
          </div>
        </Card>

        {/* Audit & Notes */}
        <Card className="p-5 bg-zinc-900/60 border-zinc-800/80 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 border-b border-zinc-800/80 pb-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Audit & System Records
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-zinc-400 block">Created By</span>
              <span className="font-medium text-zinc-200">{transfer.createdBy.name}</span>
              <span className="text-[11px] text-zinc-400 block">
                {new Date(transfer.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">Validated By</span>
              <span className="font-medium text-emerald-400">
                {transfer.validatedBy ? transfer.validatedBy.name : "Pending"}
              </span>
              <span className="text-[11px] text-zinc-400 block">
                {transfer.validatedAt
                  ? new Date(transfer.validatedAt).toLocaleDateString()
                  : ""}
              </span>
            </div>
          </div>
          {transfer.notes && (
            <div className="pt-1 border-t border-zinc-800/60">
              <span className="text-xs text-zinc-400 block">Notes:</span>
              <p className="text-xs text-zinc-300 italic">{transfer.notes}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Items Table */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 overflow-hidden">
        <div className="p-4 border-b border-zinc-800/80">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-400" />
            Transferred Products ({transfer.items.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800/80">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-right">Transfer Quantity</th>
                <th className="py-3 px-4 text-right">Unit of Measure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {transfer.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-100">
                    {item.product.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">
                    {item.product.sku}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-base">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                    {item.uom}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Validate Modal */}
      {showValidateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-100">Validate Internal Transfer?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This will atomically deduct stock from <strong>{transfer.sourceLocation.name}</strong> and add it to <strong>{transfer.destinationLocation.name}</strong> while keeping total stock balanced.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowValidateModal(false)}
                className="border-zinc-700 bg-zinc-800 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={actionLoading}
                onClick={handleValidate}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Confirm & Move Stock"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <XCircle className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-100">Cancel Internal Transfer?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to cancel transfer <strong>{transfer.referenceNumber}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                className="border-zinc-700 bg-zinc-800 text-zinc-300"
              >
                Go Back
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={actionLoading}
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold"
              >
                {actionLoading ? "Canceling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
