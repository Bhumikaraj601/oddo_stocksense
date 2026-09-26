"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
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
  Trash2,
  Power,
  ShieldAlert,
} from "lucide-react";
import { UNITS_OF_MEASURE, UnitOfMeasure } from "@/lib/constants";

interface CategoryOption {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // Form State
  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [uom, setUom] = React.useState<UnitOfMeasure>("PCS");
  const [isActive, setIsActive] = React.useState(true);

  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Load Product and Categories
  React.useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch("/api/categories"),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.success && Array.isArray(catData.data)) {
            setCategories(catData.data);
          }
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.success && prodData.data) {
            const p = prodData.data;
            setName(p.name);
            setSku(p.sku);
            setDescription(p.description || "");
            setCategoryId(p.categoryId);
            setUom(p.uom as UnitOfMeasure);
            setIsActive(p.isActive);
          } else {
            setError("Failed to load product data.");
          }
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        setError("Network error loading product.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!sku.trim()) {
      setError("SKU is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          description: description.trim() || null,
          categoryId,
          uom,
          isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to update product.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("Product updated successfully!");
      setIsSubmitting(false);
      setTimeout(() => {
        router.push(`/products/${productId}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setError("Network error occurred.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this product? If historical stock or ledger records exist, it will be safely deactivated instead of deleted."
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.data?.message || "Product removed.");
        router.push("/products");
        router.refresh();
      } else {
        setError(data.error?.message || "Failed to remove product.");
        setIsDeleting(false);
      }
    } catch (err) {
      setError("Network error during product deletion.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <p className="text-xs">Loading product for editing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Edit: ${name || "Product"}`}
        description={`Update product specifications, SKU, or active status for ${sku}.`}
      >
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href={`/products/${productId}`}>
            <ArrowLeft className="w-4 h-4" />
            Cancel & Back
          </Link>
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Update Error</p>
            <p className="text-[11px] mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Success</p>
            <p className="text-[11px] mt-0.5 opacity-90">{successMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              Product Details
            </CardTitle>
            <CardDescription className="text-xs">
              Modify master catalog fields. Changing SKU requires unique naming.
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
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  SKU / Code <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="h-9 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
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
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description / Specifications
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Product Active Status
                </p>
                <p className="text-[11px] text-slate-500">
                  Deactivating prevents this product from being selected in new operations.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isActive ? "Active in Catalog" : "Deactivated"}
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            variant="outline"
            size="sm"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Remove Product
          </Button>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href={`/products/${productId}`}>Cancel</Link>
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold min-w-[130px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
