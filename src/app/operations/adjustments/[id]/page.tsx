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
  SlidersHorizontal,
  AlertCircle,
  Loader2,
  Check,
  XCircle,
  MapPin,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdjustmentItemDetail {
  id: string;
  productId: string;
  theoreticalQty: number;
  countedQty: number;
  differenceQty: number;
  uom: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category?: { name: string };
  };
}

interface AdjustmentDetail {
  id: string;
  referenceNumber: string;
  status: "DRAFT" | "DONE" | "CANCELED";
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string | null;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  } | null;
  location: {
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
  items: AdjustmentItemDetail[];
}

export default function AdjustmentDetailPage() {
  const params = useParams();
  const adjustmentId = params?.id as string;

  const [adjustment, setAdjustment] = React.useState<AdjustmentDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Modals
  const [showValidateModal, setShowValidateModal] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);

  const fetchAdjustment = React.useCallback(async () => {
    if (!adjustmentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/adjustments/${adjustmentId}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed to load inventory adjustment");
      }
      const json = await res.json();
      setAdjustment(json.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch adjustment details.");
    } finally {
      setLoading(false);
    }
  }, [adjustmentId]);

  React.useEffect(() => {
    fetchAdjustment();
  }, [fetchAdjustment]);

  // Handle Validate (Authoritative Stock Overwrite + Ledger Sync)
  const handleValidate = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/adjustments/${adjustmentId}/validate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to validate inventory adjustment");
      }
      setShowValidateModal(false);
      setSuccessMessage(
        "Inventory adjustment validated successfully! Physical counts have updated system stock balances and differences were recorded in the Stock Ledger."
      );
      await fetchAdjustment();
    } catch (err: any) {
      setErrorMessage(err.message || "Error validating adjustment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel
  const handleCancel = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/adjustments/${adjustmentId}/cancel`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to cancel adjustment");
      }
      setShowCancelModal(false);
      setSuccessMessage("Inventory adjustment has been canceled.");
      await fetchAdjustment();
    } catch (err: any) {
      setErrorMessage(err.message || "Error canceling adjustment.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-400">Loading adjustment details...</p>
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-100">Adjustment not found</h2>
        <Link href="/operations/adjustments">
          <Button variant="outline" className="text-zinc-300">
            Back to Adjustments
          </Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { key: "DRAFT", label: "Draft Count", desc: "Physical Count Recorded" },
    { key: "DONE", label: "Validated & Applied", desc: "Stock Updated & Ledger Synced" },
  ];

  const currentStepIdx = adjustment.status === "DONE" ? 1 : 0;

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Bar & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                {adjustment.referenceNumber}
              </span>
              <StatusBadge status={adjustment.status} />
            </div>
            <h1 className="text-xl font-bold text-zinc-100 mt-1 flex items-center gap-2">
              <span>Inventory Count at {adjustment.location.name}</span>
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {adjustment.status === "DRAFT" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="border-zinc-700 bg-zinc-900 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
              >
                Cancel Draft
              </Button>
              <Button
                size="sm"
                onClick={() => setShowValidateModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Validate Adjustment
              </Button>
            </>
          )}

          {adjustment.status === "DONE" && (
            <Link href="/operations/ledger">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
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
            <p className="font-semibold">Stock Reconciled Successfully</p>
            <p className="mt-0.5 text-xs text-emerald-300/90">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Workflow Stepper */}
      {adjustment.status !== "CANCELED" && (
        <Card className="p-4 bg-zinc-900/60 border-zinc-800/80">
          <div className="grid grid-cols-2 gap-3">
            {steps.map((step, idx) => {
              const isCompleted = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    isCurrent
                      ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                      : isCompleted
                      ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-300"
                      : "bg-zinc-950/40 border-zinc-800/40 text-zinc-500"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isCompleted
                        ? "bg-purple-500 text-zinc-950"
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
        {/* Location & Warehouse Info */}
        <Card className="p-5 bg-zinc-900/60 border-zinc-800/80 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 border-b border-zinc-800/80 pb-2">
            <MapPin className="h-4 w-4 text-purple-400" />
            Adjustment Location
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-zinc-400 block">Warehouse</span>
              <p className="font-semibold text-zinc-100 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                {adjustment.warehouse?.name || "Main Warehouse"}
              </p>
              <p className="text-xs text-zinc-500 font-mono">
                {adjustment.warehouse?.code || "WH-01"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-zinc-400 block">Bin / Location</span>
              <p className="font-semibold text-purple-300">{adjustment.location.name}</p>
              <p className="text-xs text-zinc-500 font-mono">
                {adjustment.location.code}
              </p>
            </div>
          </div>
          {adjustment.reason && (
            <div className="pt-2 border-t border-zinc-800/60">
              <span className="text-xs text-zinc-400 block">Discrepancy Reason / Note:</span>
              <p className="text-xs text-zinc-200 italic mt-0.5">{adjustment.reason}</p>
            </div>
          )}
        </Card>

        {/* Audit & Records */}
        <Card className="p-5 bg-zinc-900/60 border-zinc-800/80 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 border-b border-zinc-800/80 pb-2">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            Audit & System Records
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-zinc-400 block">Created By</span>
              <span className="font-medium text-zinc-200">{adjustment.createdBy.name}</span>
              <span className="text-[11px] text-zinc-500 block">
                {new Date(adjustment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">Validated By</span>
              <span className="font-medium text-purple-400">
                {adjustment.validatedBy ? adjustment.validatedBy.name : "Pending"}
              </span>
              <span className="text-[11px] text-zinc-500 block">
                {adjustment.validatedAt
                  ? new Date(adjustment.validatedAt).toLocaleDateString()
                  : ""}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Items Table with Differences */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 overflow-hidden">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-400" />
            Stock Adjustments Breakdown ({adjustment.items.length})
          </h2>
          <span className="text-xs text-zinc-400">
            Authoritative count rule: <strong>Counted Stock ➔ New System Stock</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800/80">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-right">System Stock</th>
                <th className="py-3 px-4 text-right">Counted Stock</th>
                <th className="py-3 px-4 text-right">Adjustment Difference</th>
                <th className="py-3 px-4 text-right">UOM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {adjustment.items.map((item, idx) => {
                const diff = item.differenceQty;
                return (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-100">
                      {item.product.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">
                      {item.product.sku}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-zinc-400">
                      {item.theoreticalQty}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-100 text-base">
                      {item.countedQty}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-xs ${
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
                            +{diff}
                          </>
                        ) : diff < 0 ? (
                          <>
                            <TrendingDown className="h-3 w-3" />
                            {diff}
                          </>
                        ) : (
                          "0 (Exact)"
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-400">
                      {item.uom}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Validate Modal */}
      {showValidateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-zinc-100">Validate Inventory Adjustment?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This operation will set the system stock balance at{" "}
                <strong>{adjustment.location.name}</strong> directly to the physical counted quantities. Differences will be recorded in the Stock Ledger as audited adjustments.
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
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Applying Adjustment...
                  </>
                ) : (
                  "Confirm & Apply Adjustment"
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
              <h3 className="text-lg font-bold text-zinc-100">Cancel Draft Adjustment?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to cancel adjustment <strong>{adjustment.referenceNumber}</strong>? No inventory stock balances will be modified.
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
