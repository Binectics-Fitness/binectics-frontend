"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { Button } from "@/components/Button";
import DashboardLoading from "@/components/DashboardLoading";

interface PaymentConfig {
  gateway: string;
  public_key: string;
  is_active: boolean;
}

const GATEWAY_LABELS: Record<string, string> = {
  paystack: "Paystack",
  stripe: "Stripe",
  flutterwave: "Flutterwave",
};

export default function PaymentSettingsPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const orgId = currentOrg?._id;

  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form state for adding/editing a gateway
  const [formGateway, setFormGateway] = useState("paystack");
  const [formPublicKey, setFormPublicKey] = useState("");
  const [formSecretKey, setFormSecretKey] = useState("");
  const [editing, setEditing] = useState(false);

  const loadConfigs = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await marketplaceService.getPaymentConfigs(orgId);
      if (res.success && res.data) {
        setConfigs(res.data);
      }
    } catch {
      setErrorMsg("Failed to load payment settings");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) void loadConfigs();
  }, [orgId, loadConfigs]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    if (!formPublicKey.trim() || !formSecretKey.trim()) {
      setErrorMsg("Both public key and secret key are required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await marketplaceService.upsertPaymentConfig(orgId, {
        gateway: formGateway,
        public_key: formPublicKey.trim(),
        secret_key: formSecretKey.trim(),
        is_active: true,
      });

      if (res.success) {
        setSuccessMsg(
          `${GATEWAY_LABELS[formGateway] || formGateway} configuration saved successfully!`,
        );
        setFormPublicKey("");
        setFormSecretKey("");
        setEditing(false);
        await loadConfigs();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(res.message || "Failed to save payment configuration");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (gateway: string) => {
    if (!orgId) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await marketplaceService.deletePaymentConfig(orgId, gateway);
      if (res.success) {
        setSuccessMsg(
          `${GATEWAY_LABELS[gateway] || gateway} configuration removed.`,
        );
        await loadConfigs();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(res.message || "Failed to remove configuration");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  const handleEdit = (cfg: PaymentConfig) => {
    setFormGateway(cfg.gateway);
    setFormPublicKey(cfg.public_key);
    setFormSecretKey("");
    setEditing(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  if (orgLoading || loading) return <DashboardLoading />;

  if (!orgId) {
    return (
      <div className="p-6">
        <p className="text-foreground-secondary">
          No organization found. Please set up your organization first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Payment Settings
        </h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Configure your own payment gateway keys to receive payments directly,
          or use the platform&apos;s default integration.
        </p>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {/* Current Configurations */}
      {configs.length > 0 && (
        <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">
            Active Gateways
          </h2>
          <div className="space-y-3">
            {configs.map((cfg) => (
              <div
                key={cfg.gateway}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {GATEWAY_LABELS[cfg.gateway] || cfg.gateway}
                  </p>
                  <p className="text-sm text-foreground-secondary truncate">
                    Public Key: {cfg.public_key.substring(0, 20)}...
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      cfg.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {cfg.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(cfg)}
                    className="px-3 py-1.5 text-sm font-medium text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cfg.gateway)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
        <h2 className="font-display text-lg font-bold text-foreground mb-4">
          {editing ? "Update Gateway" : "Add Payment Gateway"}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Gateway
            </label>
            <select
              value={formGateway}
              onChange={(e) => setFormGateway(e.target.value)}
              className="w-full h-12 px-4 border border-neutral-200 rounded-lg text-foreground bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              disabled={editing}
            >
              <option value="paystack">Paystack</option>
              <option value="stripe">Stripe</option>
              <option value="flutterwave">Flutterwave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Public Key
            </label>
            <input
              type="text"
              value={formPublicKey}
              onChange={(e) => setFormPublicKey(e.target.value)}
              placeholder={`e.g. pk_live_xxxxxxxx`}
              className="w-full h-12 px-4 border border-neutral-200 rounded-lg text-foreground bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Secret Key
            </label>
            <input
              type="password"
              value={formSecretKey}
              onChange={(e) => setFormSecretKey(e.target.value)}
              placeholder={
                editing
                  ? "Enter new secret key to update"
                  : "e.g. sk_live_xxxxxxxx"
              }
              className="w-full h-12 px-4 border border-neutral-200 rounded-lg text-foreground bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoComplete="off"
            />
            <p className="text-xs text-foreground-tertiary mt-1">
              Your secret key is stored securely and never displayed after
              saving.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Save"}
            </Button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormPublicKey("");
                  setFormSecretKey("");
                  setFormGateway("paystack");
                }}
                className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="bg-accent-blue-50 border border-accent-blue-200 rounded-xl p-6">
        <h3 className="font-display text-base font-bold text-foreground mb-2">
          How it works
        </h3>
        <ul className="space-y-2 text-sm text-foreground-secondary">
          <li className="flex gap-2">
            <span className="text-accent-blue-500 shrink-0">•</span>
            When you add your own Paystack keys, payments for your plans go
            directly to your Paystack account.
          </li>
          <li className="flex gap-2">
            <span className="text-accent-blue-500 shrink-0">•</span>
            If no keys are configured, the platform&apos;s default payment
            integration is used.
          </li>
          <li className="flex gap-2">
            <span className="text-accent-blue-500 shrink-0">•</span>
            You can find your API keys in your Paystack dashboard under
            Settings → API Keys & Webhooks.
          </li>
          <li className="flex gap-2">
            <span className="text-accent-blue-500 shrink-0">•</span>
            Set your webhook URL to:{" "}
            <code className="bg-white px-1 py-0.5 rounded text-xs">
              {process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}/webhooks/paystack
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
}
