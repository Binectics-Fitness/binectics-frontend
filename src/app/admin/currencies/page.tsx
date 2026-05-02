"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { adminService } from "@/lib/api/admin";
import type { PlatformCurrency } from "@/lib/api/utility";
import { toast } from "@/components/Toast";

interface DraftCurrency extends PlatformCurrency {
  _isNew?: boolean;
}

const EMPTY_NEW: DraftCurrency = {
  code: "",
  name: "",
  symbol: "",
  is_active: true,
  _isNew: true,
};

export default function AdminCurrenciesPage() {
  const { isLoading: authLoading, isAuthorized } = useRoleGuard(
    UserRole.ADMIN,
  );

  const [currencies, setCurrencies] = useState<DraftCurrency[]>([]);
  const [original, setOriginal] = useState<PlatformCurrency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [newCurrency, setNewCurrency] = useState<DraftCurrency>(EMPTY_NEW);

  useEffect(() => {
    if (!isAuthorized) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const res = await adminService.getSupportedCurrencies();
      if (cancelled) return;
      if (res.success && res.data) {
        setCurrencies(res.data);
        setOriginal(res.data);
      } else {
        setPageError(res.message || "Failed to load currencies");
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthorized]);

  const filtered = useMemo(() => {
    if (filter === "active") return currencies.filter((c) => c.is_active);
    if (filter === "inactive") return currencies.filter((c) => !c.is_active);
    return currencies;
  }, [currencies, filter]);

  const isDirty = useMemo(() => {
    if (currencies.length !== original.length) return true;
    return currencies.some((c, i) => {
      const o = original[i];
      return (
        !o ||
        c.code !== o.code ||
        c.name !== o.name ||
        c.symbol !== o.symbol ||
        c.is_active !== o.is_active
      );
    });
  }, [currencies, original]);

  const updateRow = (index: number, patch: Partial<DraftCurrency>) => {
    setCurrencies((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  };

  const removeRow = (index: number) => {
    setCurrencies((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAll = (active: boolean) => {
    setCurrencies((prev) => prev.map((c) => ({ ...c, is_active: active })));
  };

  const handleAddNew = () => {
    const code = newCurrency.code.trim().toUpperCase();
    const name = newCurrency.name.trim();
    const symbol = newCurrency.symbol.trim();
    if (!code || !name || !symbol) {
      toast.error("Please fill in code, name, and symbol");
      return;
    }
    if (!/^[A-Z]{3}$/.test(code)) {
      toast.error("Code must be a 3-letter ISO 4217 code (e.g. USD)");
      return;
    }
    if (currencies.some((c) => c.code === code)) {
      toast.error(`${code} is already in the list`);
      return;
    }
    setCurrencies((prev) => [
      ...prev,
      { code, name, symbol, is_active: newCurrency.is_active },
    ]);
    setNewCurrency(EMPTY_NEW);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setPageError("");
    const payload: PlatformCurrency[] = currencies.map((c) => ({
      code: c.code.trim().toUpperCase(),
      name: c.name.trim(),
      symbol: c.symbol.trim(),
      is_active: c.is_active,
    }));
    const res = await adminService.updateSupportedCurrencies(payload);
    if (res.success && res.data) {
      setCurrencies(res.data);
      setOriginal(res.data);
      toast.success("Currencies updated.");
    } else {
      toast.error(res.message || "Failed to update currencies");
      setPageError(res.message || "Failed to update currencies");
    }
    setIsSaving(false);
  };

  const handleDiscard = () => {
    setCurrencies(original);
  };

  if (authLoading || isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const activeCount = currencies.filter((c) => c.is_active).length;
  const inactiveCount = currencies.length - activeCount;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="md:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Supported Currencies
            </h1>
            <p className="text-sm text-foreground/60">
              Activate or deactivate the currencies available across the
              platform. Inactive currencies will not appear in plan creation,
              org settings, or checkout dropdowns.
            </p>
          </div>

          {pageError && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-800">{pageError}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-xs font-medium text-foreground/60">Total</p>
              <p className="text-2xl font-black text-foreground mt-1">
                {currencies.length}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-xs font-medium text-foreground/60">Active</p>
              <p className="text-2xl font-black text-primary-600 mt-1">
                {activeCount}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-xs font-medium text-foreground/60">Inactive</p>
              <p className="text-2xl font-black text-foreground/60 mt-1">
                {inactiveCount}
              </p>
            </div>
          </div>

          {/* Add new currency */}
          <section className="mb-6 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] sm:p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Add a currency
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input
                type="text"
                value={newCurrency.code}
                onChange={(e) =>
                  setNewCurrency((p) => ({
                    ...p,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                maxLength={3}
                placeholder="Code (e.g. USD)"
                className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
              />
              <input
                type="text"
                value={newCurrency.name}
                onChange={(e) =>
                  setNewCurrency((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Name (e.g. US Dollar)"
                className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue-500 sm:col-span-2"
              />
              <input
                type="text"
                value={newCurrency.symbol}
                onChange={(e) =>
                  setNewCurrency((p) => ({ ...p, symbol: e.target.value }))
                }
                placeholder="Symbol (e.g. $)"
                className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
              />
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  checked={newCurrency.is_active}
                  onChange={(e) =>
                    setNewCurrency((p) => ({
                      ...p,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-accent-blue-500 focus:ring-accent-blue-500"
                />
                Active
              </label>
              <button
                type="button"
                onClick={handleAddNew}
                className="h-10 rounded-lg bg-accent-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-blue-600"
              >
                Add to list
              </button>
            </div>
          </section>

          {/* Filter tabs + bulk actions */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
              {(["all", "active", "inactive"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFilter(opt)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                    filter === opt
                      ? "bg-accent-blue-500 text-white"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50"
              >
                Activate all
              </button>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50"
              >
                Deactivate all
              </button>
            </div>
          </div>

          {/* Currency table */}
          <div className="overflow-hidden rounded-xl bg-white shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wide">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wide">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-foreground/60"
                      >
                        No currencies match this filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const idx = currencies.indexOf(c);
                      return (
                        <tr key={`${c.code}-${idx}`} className="hover:bg-neutral-50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={c.code}
                              onChange={(e) =>
                                updateRow(idx, {
                                  code: e.target.value.toUpperCase(),
                                })
                              }
                              maxLength={3}
                              className="w-20 px-2 py-1.5 border border-neutral-200 rounded text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) =>
                                updateRow(idx, { name: e.target.value })
                              }
                              className="w-full min-w-[180px] px-2 py-1.5 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={c.symbol}
                              onChange={(e) =>
                                updateRow(idx, { symbol: e.target.value })
                              }
                              className="w-20 px-2 py-1.5 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                updateRow(idx, { is_active: !c.is_active })
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                c.is_active
                                  ? "bg-primary-500"
                                  : "bg-neutral-300"
                              }`}
                              aria-label={
                                c.is_active ? "Deactivate" : "Activate"
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  c.is_active
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save bar */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground/60">
              {isDirty
                ? "You have unsaved changes."
                : "All changes saved."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={!isDirty || isSaving}
                className="h-11 rounded-lg border border-neutral-200 bg-white px-5 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="h-11 rounded-lg bg-accent-blue-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
