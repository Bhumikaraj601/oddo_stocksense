"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Boxes,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";

interface LocationItem {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
  _count?: { stocks: number };
}

interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  address?: string | null;
  isActive: boolean;
  locations: LocationItem[];
  _count: {
    locations: number;
    reorderRules: number;
  };
  createdAt: string;
}

export default function WarehousesSettingsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER";

  // State
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingWarehouse, setEditingWarehouse] = React.useState<WarehouseItem | null>(null);
  const [formLoading, setFormLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  // Fetch Warehouses
  const fetchWarehouses = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
      });
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/warehouses?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setWarehouses(json.data || []);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalCount(json.meta.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load warehouses", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  React.useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Debounced search handling
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setName("");
    setCode("");
    setDescription("");
    setAddress("");
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (wh: WarehouseItem) => {
    setEditingWarehouse(wh);
    setName(wh.name);
    setCode(wh.code);
    setDescription(wh.description || "");
    setAddress(wh.address || "");
    setIsActive(wh.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        address: address.trim() || null,
        isActive,
      };

      const url = editingWarehouse
        ? `/api/warehouses/${editingWarehouse.id}`
        : "/api/warehouses";
      const method = editingWarehouse ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to save warehouse");
      }

      setModalOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete / Deactivate
  const handleDelete = async (wh: WarehouseItem) => {
    const confirmMessage = `Are you sure you want to remove or deactivate "${wh.name}"? If it contains historical stock or operations, it will be safely deactivated instead of deleted.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/warehouses/${wh.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Failed to remove warehouse");
        return;
      }
      if (data.data?.message) {
        alert(data.data.message);
      }
      fetchWarehouses();
    } catch (err) {
      console.error("Delete warehouse error", err);
      alert("Failed to delete warehouse");
    }
  };

  // Calculate high-level summary KPIs
  const totalLocations = warehouses.reduce((acc, wh) => acc + (wh._count?.locations || 0), 0);
  const activeWarehouses = warehouses.filter((wh) => wh.isActive).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Warehouses & Facilities"
          description="Manage multi-warehouse storage facilities, internal distribution zones, and location structures."
        />
        {canManage && (
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-zinc-900/60 border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Total Facilities</p>
            <h3 className="text-2xl font-bold text-zinc-100">{totalCount}</h3>
            <p className="text-xs text-emerald-400/90 font-medium mt-0.5">
              {activeWarehouses} Active Facilities
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-zinc-900/60 border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Storage Locations</p>
            <h3 className="text-2xl font-bold text-zinc-100">{totalLocations}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Racks, Bins & Work Centers</p>
          </div>
        </Card>

        <Card className="p-5 bg-zinc-900/60 border-zinc-800 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Multi-Warehouse Architecture</p>
            <h3 className="text-base font-semibold text-zinc-200 mt-0.5">Location-Scoped Stock</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Automated Ledger Integration</p>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-zinc-900/60 border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by facility name, code, address..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9 bg-zinc-950/60 border-zinc-700/80 focus:ring-emerald-500/30 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
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
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Warehouses Table */}
      <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-4 px-6">Facility Name</th>
                <th className="py-4 px-6">Code</th>
                <th className="py-4 px-6">Address & Notes</th>
                <th className="py-4 px-6">Locations Structure</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Loading warehouses from PostgreSQL...
                  </td>
                </tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Building2 className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-300 font-medium text-base">No warehouses found</p>
                    <p className="text-zinc-400 text-xs mt-1">
                      {search || statusFilter !== "ALL"
                        ? "Try clearing your search query or changing the status filter."
                        : "Get started by adding your first warehouse facility."}
                    </p>
                    {canManage && (
                      <Button
                        onClick={handleOpenCreate}
                        variant="outline"
                        size="sm"
                        className="mt-4 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Create Warehouse
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                warehouses.map((wh) => (
                  <tr
                    key={wh.id}
                    className="hover:bg-zinc-800/40 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-emerald-400 shrink-0">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <Link
                            href={`/settings/warehouses/${wh.id}`}
                            className="font-medium text-zinc-100 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                          >
                            {wh.name}
                            <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                          </Link>
                          {wh.description && (
                            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                              {wh.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded font-mono text-xs font-semibold bg-zinc-800 border border-zinc-700/80 text-zinc-200">
                        {wh.code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-1.5 max-w-xs">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-zinc-300">
                          {wh.address || "No physical address specified"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-200">
                          {wh._count?.locations || 0} configured location{wh._count?.locations !== 1 ? "s" : ""}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {wh.locations?.slice(0, 3).map((loc) => (
                            <span
                              key={loc.id}
                              className="text-[10px] px-1.5 py-0.5 bg-zinc-800/90 text-zinc-400 border border-zinc-700/50 rounded"
                            >
                              {loc.name}
                            </span>
                          ))}
                          {wh.locations?.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800/90 text-zinc-400 rounded">
                              +{wh.locations.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={wh.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/settings/warehouses/${wh.id}`}
                          className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-md transition-colors"
                          title="Manage Locations & View Inventory"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {canManage && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(wh)}
                              className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-md transition-colors"
                              title="Edit Warehouse"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(wh)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                              title="Deactivate / Delete Warehouse"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
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
              Showing {warehouses.length} of {totalCount} warehouses
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

      {/* Modal: Add / Edit Warehouse */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
                {editingWarehouse ? "Edit Warehouse Facility" : "Create New Warehouse"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Warehouse Name <span className="text-red-400">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Main Distribution Center, Mumbai Hub"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-950/60 border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Warehouse Code <span className="text-red-400">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. WH-001, MAIN, WH-MUM"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="bg-zinc-950/60 border-zinc-700 font-mono uppercase"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Unique system identifier for document references and ledger movements.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Physical Address
                </label>
                <Input
                  placeholder="e.g. 104 Industrial Area, Sector 5, Mumbai"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-zinc-950/60 border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Description / Operational Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Special storage capabilities, temperature zones, primary logistics contact..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="wh-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/30 h-4 w-4"
                />
                <label htmlFor="wh-active" className="text-xs text-zinc-300 font-medium">
                  Active Facility (Selectable in receiving, deliveries, and transfers)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={formLoading}
                  className="border-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold"
                >
                  {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingWarehouse ? "Save Changes" : "Create Warehouse"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
