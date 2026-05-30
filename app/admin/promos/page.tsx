"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { SectionStack } from "@/components/page-layout";

type PromoCodeRow = {
  id?: string;
  code?: string;
  name?: string;
  status?: string;
  promo_type?: string;
  benefit_type?: string;
  discount_percent?: string | number;
  reward_amount_ngn?: string | number;
  owner_account_id?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  used_count?: number;
  paid_conversion_count?: number;
};

type PromoRewardRow = {
  id?: string;
  promo_code?: string;
  beneficiary_name?: string | null;
  reward_amount_ngn?: string | number;
  status?: string;
  hold_days?: number;
  plan_code?: string;
  payment_reference?: string;
  available_at?: string;
};

type PromoRedemptionRow = {
  id?: string;
  promo_code?: string;
  account_id?: string;
  status?: string;
  source?: string;
  plan_code?: string;
  payment_reference?: string;
  discount_amount_kobo?: number;
  final_amount_kobo?: number;
};

function formatNaira(value: unknown): string {
  const n = Number(value || 0);
  return `₦${n.toLocaleString()}`;
}

function safeText(value: unknown, fallback = "---"): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 14,
    display: "grid",
    gap: 8,
    minWidth: 0,
    overflowWrap: "anywhere",
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "10px 12px",
    background: "var(--surface)",
    color: "var(--text)",
    minWidth: 0,
  };
}

async function adminFetch<T>(path: string, adminKey: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  }

  return data as T;
}

export default function AdminPromosPage() {
  const [adminKey, setAdminKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [codes, setCodes] = useState<PromoCodeRow[]>([]);
  const [redemptions, setRedemptions] = useState<PromoRedemptionRow[]>([]);
  const [rewards, setRewards] = useState<PromoRewardRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [newCode, setNewCode] = useState("TAXWITHBM");
  const [newName, setNewName] = useState("BMS / Launch Partner");
  const [discountPercent, setDiscountPercent] = useState("20");
  const [rewardAmount, setRewardAmount] = useState("500");
  const [ownerAccountId, setOwnerAccountId] = useState("");
  const [ownerName, setOwnerName] = useState("BMS / Launch Partner");
  const [ownerEmail, setOwnerEmail] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ntg_admin_key") || "";
      if (saved) setAdminKey(saved);
    } catch {
      // ignore
    }
  }, []);

  const stats = useMemo(() => {
    const used = codes.reduce((sum, row) => sum + Number(row.used_count || 0), 0);
    const paid = codes.reduce((sum, row) => sum + Number(row.paid_conversion_count || 0), 0);
    const pendingReward = rewards
      .filter((row) => String(row.status || "").toLowerCase() === "pending")
      .reduce((sum, row) => sum + Number(row.reward_amount_ngn || 0), 0);

    return { used, paid, pendingReward };
  }, [codes, rewards]);

  async function loadAll() {
    if (!adminKey.trim()) {
      setError("Enter your ADMIN_API_KEY first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      localStorage.setItem("ntg_admin_key", adminKey.trim());

      const [codesRes, redemptionsRes, rewardsRes] = await Promise.all([
        adminFetch<{ rows: PromoCodeRow[] }>("/promo/admin/codes?limit=100", adminKey),
        adminFetch<{ rows: PromoRedemptionRow[] }>("/promo/admin/redemptions?limit=100", adminKey),
        adminFetch<{ rows: PromoRewardRow[] }>("/promo/admin/rewards?limit=100", adminKey),
      ]);

      setCodes(codesRes.rows || []);
      setRedemptions(redemptionsRes.rows || []);
      setRewards(rewardsRes.rows || []);
      setMessage("Promo admin data loaded successfully.");
    } catch (e: any) {
      setError(e?.message || "Unable to load promo admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCode() {
    if (!adminKey.trim()) {
      setError("Enter your ADMIN_API_KEY first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await adminFetch("/promo/admin/codes", adminKey, {
        method: "POST",
        body: JSON.stringify({
          code: newCode,
          name: newName,
          status: "active",
          promo_type: "influencer",
          benefit_type: "percent_discount",
          discount_percent: discountPercent,
          reward_type: "cash",
          reward_amount_ngn: rewardAmount,
          owner_account_id: ownerAccountId || null,
          owner_name: ownerName || null,
          owner_email: ownerEmail || null,
        }),
      });

      setMessage(`Promo code ${newCode.toUpperCase()} saved successfully.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Unable to save promo code.");
    } finally {
      setLoading(false);
    }
  }

  async function assignOwner(code: string) {
    if (!adminKey.trim()) {
      setError("Enter your ADMIN_API_KEY first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await adminFetch(`/promo/admin/codes/${encodeURIComponent(code)}/assign-owner`, adminKey, {
        method: "POST",
        body: JSON.stringify({
          owner_account_id: ownerAccountId || null,
          owner_name: ownerName || null,
          owner_email: ownerEmail || null,
        }),
      });

      setMessage(`Owner assigned to ${code}.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Unable to assign owner.");
    } finally {
      setLoading(false);
    }
  }

  async function markRewardStatus(rewardId: string, status: string) {
    if (!adminKey.trim()) {
      setError("Enter your ADMIN_API_KEY first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await adminFetch(`/promo/admin/rewards/${encodeURIComponent(rewardId)}/mark-status`, adminKey, {
        method: "POST",
        body: JSON.stringify({ status }),
      });

      setMessage(`Reward marked as ${status}.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || `Unable to mark reward as ${status}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Promo Admin"
      subtitle="Create influencer promo codes, assign owners, monitor conversions, and manage promo rewards."
      actions={
        <button onClick={loadAll} disabled={loading} style={shellButtonPrimary()}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      }
    >
      <SectionStack>
        {error ? <Banner tone="danger" title="Promo admin error" subtitle={error} /> : null}
        {message ? <Banner tone="good" title="Promo admin update" subtitle={message} /> : null}

        <WorkspaceSectionCard
          title="Admin access"
          subtitle="Enter your backend ADMIN_API_KEY. It is saved only in this browser local storage."
        >
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12 }}>
            <input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="ADMIN_API_KEY"
              type="password"
              style={inputStyle()}
            />
            <button onClick={loadAll} disabled={loading} style={shellButtonPrimary()}>
              Connect
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Promo snapshot" subtitle="Quick high-level promo performance summary.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div style={cardStyle()}>
              <strong>Total promo signups</strong>
              <span style={{ fontSize: 24, fontWeight: 900 }}>{stats.used}</span>
            </div>
            <div style={cardStyle()}>
              <strong>Paid conversions</strong>
              <span style={{ fontSize: 24, fontWeight: 900 }}>{stats.paid}</span>
            </div>
            <div style={cardStyle()}>
              <strong>Pending rewards</strong>
              <span style={{ fontSize: 24, fontWeight: 900 }}>{formatNaira(stats.pendingReward)}</span>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Create or update promo code"
          subtitle="Best launch setup: user gets the visible discount, influencer gets fixed reward after successful payment."
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="Promo code" style={inputStyle()} />
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Promo name" style={inputStyle()} />
            <input value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="Discount percent" style={inputStyle()} />
            <input value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} placeholder="Reward amount NGN" style={inputStyle()} />
            <input value={ownerAccountId} onChange={(e) => setOwnerAccountId(e.target.value)} placeholder="Owner account ID (optional)" style={inputStyle()} />
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" style={inputStyle()} />
            <input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="Owner email" style={inputStyle()} />
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={saveCode} disabled={loading} style={shellButtonPrimary()}>
              Save Promo Code
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Promo codes" subtitle="Assign owner account IDs when a real influencer/partner is onboarded.">
          <div style={{ display: "grid", gap: 12 }}>
            {codes.length === 0 ? (
              <div style={cardStyle()}>No promo codes loaded yet.</div>
            ) : (
              codes.map((row) => (
                <div key={row.id || row.code} style={cardStyle()}>
                  <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                    <strong>{safeText(row.code)}</strong>
                    <span>{safeText(row.status)}</span>
                  </div>
                  <div>User discount: {safeText(row.discount_percent, "0")}%</div>
                  <div>Influencer reward: {formatNaira(row.reward_amount_ngn)}</div>
                  <div>Owner: {safeText(row.owner_name || row.owner_email || row.owner_account_id, "Not assigned")}</div>
                  <div>Signups: {Number(row.used_count || 0)} | Paid: {Number(row.paid_conversion_count || 0)}</div>
                  <button onClick={() => assignOwner(String(row.code || ""))} disabled={loading} style={shellButtonSecondary()}>
                    Assign Current Owner Fields
                  </button>
                </div>
              ))
            )}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Recent redemptions" subtitle="Signup captures and checkout qualification records.">
          <div style={{ display: "grid", gap: 12 }}>
            {redemptions.length === 0 ? (
              <div style={cardStyle()}>No redemptions loaded yet.</div>
            ) : (
              redemptions.map((row) => (
                <div key={row.id} style={cardStyle()}>
                  <strong>{safeText(row.promo_code)} — {safeText(row.status)}</strong>
                  <div>Account: {safeText(row.account_id)}</div>
                  <div>Plan: {safeText(row.plan_code)}</div>
                  <div>Payment: {safeText(row.payment_reference)}</div>
                  <div>Discount: {formatNaira(Number(row.discount_amount_kobo || 0) / 100)} | Paid: {formatNaira(Number(row.final_amount_kobo || 0) / 100)}</div>
                </div>
              ))
            )}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Promo rewards"
          subtitle="Manage promo reward lifecycle. Keep rewards pending during the hold period before payment."
        >
          <div style={{ display: "grid", gap: 12 }}>
            {rewards.length === 0 ? (
              <div style={cardStyle()}>No rewards loaded yet.</div>
            ) : (
              rewards.map((row) => (
                <div key={row.id} style={cardStyle()}>
                  <strong>{safeText(row.promo_code)} — {safeText(row.status)}</strong>
                  <div>Beneficiary: {safeText(row.beneficiary_name)}</div>
                  <div>Reward: {formatNaira(row.reward_amount_ngn)}</div>
                  <div>Plan: {safeText(row.plan_code)}</div>
                  <div>Reference: {safeText(row.payment_reference)}</div>
                  <div>Available: {safeText(row.available_at)}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => row.id && markRewardStatus(row.id, "approved")} disabled={loading} style={shellButtonSecondary()}>
                      Approve
                    </button>
                    <button onClick={() => row.id && markRewardStatus(row.id, "processing")} disabled={loading} style={shellButtonSecondary()}>
                      Processing
                    </button>
                    <button onClick={() => row.id && markRewardStatus(row.id, "paid")} disabled={loading} style={shellButtonPrimary()}>
                      Mark Paid
                    </button>
                    <button onClick={() => row.id && markRewardStatus(row.id, "failed")} disabled={loading} style={shellButtonSecondary()}>
                      Failed
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
