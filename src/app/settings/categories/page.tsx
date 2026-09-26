"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Boxes,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  _count: { products: number };
  createdAt: string;
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const isManager = user?.role === "INVENTORY_MANAGER" || user?.role === "ADMIN";

  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [actionMessage, setActionMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [nameInput, setNameInput] = React.useState("");
  const [descInput, setDescInput] = React.useState("");
  const [parentIdInput, setParentIdInput] = React.useState("");
  const [isActiveInput, setIsActiveInput] = React.useState(true);
  const [isModalSubmitting, setIsModalSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  const fetchCategories = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedId(null);
    setNameInput("");
    setDescInput("");
    setParentIdInput("");
    setIsActiveInput(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setModalMode("edit");
    setSelectedId(cat.id);
    setNameInput(cat.name);
    setDescInput(cat.description || "");
    setParentIdInput(cat.parentId || "");
    setIsActiveInput(cat.isActive);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!nameInput.trim()) {
      setModalError("Category name is required.");
      return;
    }

    setIsModalSubmitting(true);

    try {
      const payload = {
        name: nameInput.trim(),
        description: descInput.trim() || null,
        parentId: parentIdInput || null,
        isActive: isActiveInput,
      };

      const url = modalMode === "create" ? "/api/categories" : `/api/categories/${selectedId}`;
      const method = modalMode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setModalError(data.error?.message || "Failed to save category.");
        setIsModalSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      setIsModalSubmitting(false);
      setActionMessage({
        type: "success",
        text: `Category "${nameInput.trim()}" ${modalMode === "create" ? "created" : "updated"} successfully.`,
      });
      fetchCategories();
    } catch (err) {
      setModalError("Network error occurred.");
      setIsModalSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: CategoryItem) => {
    const newStatus = !cat.isActive;
    setActionMessage(null);

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: `Category "${cat.name}" has been ${newStatus ? "activated" : "deactivated"}.`,
        });
        fetchCategories();
      } else {
        setActionMessage({
          type: "error",
          text: data.error?.message || "Failed to update status.",
        });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error occurred." });
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete category "${cat.name}"? If products belong to this category, it will be safely deactivated instead.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: data.data?.message || "Category removed.",
        });
        fetchCategories();
      } else {
        setActionMessage({
          type: "error",
          text: data.error?.message || "Failed to delete category.",
        });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error occurred." });
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Product Categories"
        description="Organize catalog products into hierarchical classifications and reporting categories."
      >
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/products">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </Button>

        {isManager && (
          <Button
            onClick={openCreateModal}
            size="sm"
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        )}
      </PageHeader>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`rounded-xl p-3 flex items-center justify-between text-xs animate-in fade-in-50 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
              : "bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100 ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name or description..."
              className="pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-900"
            />
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            Total Categories: <span className="font-semibold text-slate-900 dark:text-slate-100">{categories.length}</span>
          </p>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-600" />
              Category Classification Directory
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs">Loading categories from database...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                No Categories Found
              </h3>
              <p className="text-xs text-slate-500">
                {search ? "No categories match your search query." : "No categories configured yet."}
              </p>
              {isManager && (
                <Button
                  onClick={openCreateModal}
                  size="sm"
                  className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Category Name</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Parent Category</th>
                    <th className="px-4 py-3 text-center">Products</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredCategories.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        <span className="flex items-center gap-2">
                          <FolderTree className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {c.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-[240px] truncate">
                        {c.description || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {c.parent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {c.parent.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">Root</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          href={`/products?categoryId=${c.id}`}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                          title="View products in this category"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          {c._count?.products || 0}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={c.isActive ? "success" : "secondary"}
                          className="text-[10px] px-2 py-0.5"
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-1">
                        {isManager && (
                          <>
                            <Button
                              onClick={() => openEditModal(c)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-indigo-600"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              onClick={() => handleToggleActive(c)}
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${
                                c.isActive
                                  ? "text-slate-400 hover:text-rose-600"
                                  : "text-slate-400 hover:text-emerald-600"
                              }`}
                              title={c.isActive ? "Deactivate Category" : "Activate Category"}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              onClick={() => handleDelete(c)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-rose-600"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-50">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-600" />
                {modalMode === "create" ? "Create Category" : "Edit Category"}
              </CardTitle>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleModalSubmit}>
              <CardContent className="space-y-4 pt-4 text-xs">
                {modalError && (
                  <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2 text-rose-800 dark:text-rose-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Raw Materials"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Parent Category (Optional)
                  </label>
                  <select
                    value={parentIdInput}
                    onChange={(e) => setParentIdInput(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None (Top-level Root Category)</option>
                    {categories
                      .filter((c) => c.id !== selectedId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Optional details regarding items in this category..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {modalMode === "edit" && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isActiveInput}
                      onChange={(e) => setIsActiveInput(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Active Category
                    </span>
                  </label>
                )}
              </CardContent>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/30">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isModalSubmitting}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {isModalSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                    </>
                  ) : modalMode === "create" ? (
                    "Create Category"
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
