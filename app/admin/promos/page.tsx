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
  account_id?: string | null;
  beneficiary_account_id?: string | null;
  beneficiary_name?: string | null;
  paying_account_id?: string;
  reward_amount_ngn?: string | number;
  status?: string;
  hold_days?: number;
  plan_code?: string;
  payment_reference?: string;
  available_at?: string;
  created_at?: string;
};

type PromoRedemptionRow = {
  id?: string;
  promo_code?: string;
  account_id?: string;
  status?: string;
  source?: string;
  plan_code?: string;
  payment_reference?: string;
  original_amount_kobo?: number;
  discount_amount_kobo?: number;
  final_amount_kobo?: number;
  qualified_at?: string;
};

function money(value: unknown): string {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "₦0";
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function koboToNaira(value: unknown): string {
  return money(Number(value || 0) / 100);
}

function text(value: unknown, fallback = "—"): string {
  const s = String(value ?? "").trim();
  return s || fallback;
}

function dateText(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
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

function gridStyle(min = 210): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
    gap: 12,
  };
}

function cardStyle(tone: "default" | "good" | "warn" | "danger" = "default"): React.CSSProperties {
  const border =
    tone === "good"
      ? "rgba(34,197,94,.35)"
      : tone === "warn"
      ? "rgba(245,158,11,.4)"
      : tone === "danger"
      ? "rgba(239,68,68,.35)"
      : "var(--border)";

  return {
    border: `1px solid ${border}`,
    borderRadius: 18,
    background: "var(--surface)",
    padding: 14,
    display: "grid",
    gap: 8,
    minWidth: 0,
    overflowWrap: "anywhere",
  };
}

function badgeStyle(status?: string): React.CSSProperties {
  const s = String(status || "").toLowerCase();
  const bg =
    s === "active" || s === "qualified" || s === "paid" || s === "approved"
      ? "rgba(34,197,94,.15)"
      : s === "pending" || s === "processing" || s === "applied"
      ? "rgba(245,158,11,.16)"
      : s === "failed" || s === "reversed" || s === "cancelled"
      ? "rgba(239,68,68,.16)"
      : "rgba(99,102,241,.14)";

  return {
    display: "inline-flex",
    width: "fit-content",
    borderRadius: 999,
    padding: "5px 10px",
    background: bg,
    border: "1px solid var(--border)",
    fontSize: 12,
    fontWeight: 800,
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

  const bodyText = await res.text();
  let data: any = null;

  try {
    data = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    data = bodyText;
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  }

  return data as T;
}

function copy(value: string, setMessage: (value: string) => void) {
  navigator.clipboard
    ?.writeText(value)
    .then(() => setMessage("Copied to clipboard."))
    .catch(() => setMessage("Could not copy automatically. Please copy manually."));
}

export default function AdminPromosPage() {
  const [adminKey, setAdminKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [codes, setCodes] = useState<PromoCodeRow[]>([]);
  const [redemptions, setRedemptions] = useState<PromoRedemptionRow[]>([]);
  const [rewards, setRewards] = useState<PromoRewardRow[]>([]);

  const [filterCode, setFilterCode] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [newCode, setNewCode] = useState("TAXWITHBM");
  const [newName, setNewName] = useState("BMS / Launch Partner");
  const [discountPercent, setDiscountPercent] = useState("20");
  const [rewardAmount, setRewardAmount] = useState("500");
  const [ownerAccountId, setOwnerAccountId] = useState("");
  const [ownerName, setOwnerName] = useState("BMS / Launch Partner");
  const [ownerEmail, setOwnerEmail] = useState("");

  useEffect(() => {
    try {
      setAdminKey(localStorage.getItem("ntg_admin_key") || "");
    } catch {
      // ignore
    }
  }, []);

  const stats = useMemo(() => {
    const used = codes.reduce((sum, row) => sum + Number(row.used_count || 0), 0);
    const paid = codes.reduce((sum, row) => sum + Number(row.paid_conversion_count || 0), 0);
    const pending = rewards
      .filter((row) => String(row.status || "").toLowerCase() === "pending")
      .reduce((sum, row) => sum + Number(row.reward_amount_ngn || 0), 0);
    const approved = rewards
      .filter((row) => String(row.status || "").toLowerCase() === "approved")
      .reduce((sum, row) => sum + Number(row.reward_amount_ngn || 0), 0);
    const paidRewards = rewards
      .filter((row) => String(row.status || "").toLowerCase() === "paid")
      .reduce((sum, row) => sum + Number(row.reward_amount_ngn || 0), 0);

    return { used, paid, pending, approved, paidRewards };
  }, [codes, rewards]);

  const filteredCodes = useMemo(() => {
    const code = filterCode.trim().toUpperCase();
    const status = filterStatus.trim().toLowerCase();
    return codes.filter((row) => {
      const codeOk = !code || String(row.code || "").toUpperCase().includes(code);
      const statusOk = !status || String(row.status || "").toLowerCase() === status;
      return codeOk && statusOk;
    });
  }, [codes, filterCode, filterStatus]);

  const filteredRedemptions = useMemo(() => {
    const code = filterCode.trim().toUpperCase();
    const status = filterStatus.trim().toLowerCase();
    return redemptions.filter((row) => {
      const codeOk = !code || String(row.promo_code || "").toUpperCase().includes(code);
      const statusOk = !status || String(row.status || "").toLowerCase() === status;
      return codeOk && statusOk;
    });
  }, [redemptions, filterCode, filterStatus]);

  const filteredRewards = useMemo(() => {
    const code = filterCode.trim().toUpperCase();
    const status = filterStatus.trim().toLowerCase();
    return rewards.filter((row) => {
      const codeOk = !code || String(row.promo_code || "").toUpperCase().includes(code);
      const statusOk = !status || String(row.status || "").toLowerCase() === status;
      return codeOk && statusOk;
    });
  }, [rewards, filterCode, filterStatus]);

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
        adminFetch<{ rows: PromoCodeRow[] }>("/promo/admin/codes?limit=200", adminKey.trim()),
        adminFetch<{ rows: PromoRedemptionRow[] }>("/promo/admin/redemptions?limit=200", adminKey.trim()),
        adminFetch<{ rows: PromoRewardRow[] }>("/promo/admin/rewards?limit=200", adminKey.trim()),
      ]);

      setCodes(codesRes.rows || []);
      setRedemptions(redemptionsRes.rows || []);
      setRewards(rewardsRes.rows || []);
      setConnected(true);
      setMessage("Promo admin data loaded successfully.");
    } catch (e: any) {
      setConnected(false);
      setError(e?.message || "Unable to load promo admin data.");
    } finally {
      setLoading(false);
    }
  }

  function clearKey() {
    setAdminKey("");
    setConnected(false);
    setCodes([]);
    setRedemptions([]);
    setRewards([]);
    setError("");
    setMessage("Admin key cleared from this browser.");
    try {
      localStorage.removeItem("ntg_admin_key");
    } catch {
      // ignore
    }
  }

  function loadCodeIntoForm(row: PromoCodeRow) {
    setNewCode(String(row.code || ""));
    setNewName(String(row.name || row.owner_name || row.code || ""));
    setDiscountPercent(String(row.discount_percent || "0"));
    setRewardAmount(String(row.reward_amount_ngn || "0"));
    setOwnerAccountId(String(row.owner_account_id || ""));
    setOwnerName(String(row.owner_name || ""));
    setOwnerEmail(String(row.owner_email || ""));
    setMessage(`Loaded ${row.code} into the editor.`);
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
      const payload = {
        code: newCode.trim().toUpperCase(),
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
      };

      await adminFetch("/promo/admin/codes", adminKey.trim(), {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage(`Promo code ${payload.code} saved successfully.`);
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
      await adminFetch(`/promo/admin/codes/${encodeURIComponent(code)}/assign-owner`, adminKey.trim(), {
        method: "POST",
        body: JSON.stringify({
          owner_account_id: ownerAccountId || null,
          owner_name: ownerName || null,
          owner_email: ownerEmail || null,
        }),
      });

      setMessage(`Owner assigned to ${code}. Run the Batch 35D owner backfill SQL if older reward rows need updating.`);
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
      await adminFetch(`/promo/admin/rewards/${encodeURIComponent(rewardId)}/mark-status`, adminKey.trim(), {
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
          subtitle="Enter your backend ADMIN_API_KEY. Use this page only on your own device."
        >
          <div style={gridStyle(180)}>
            <input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="ADMIN_API_KEY"
              type="password"
              style={inputStyle()}
            />
            <button onClick={loadAll} disabled={loading} style={shellButtonPrimary()}>
              {connected ? "Reconnect" : "Connect"}
            </button>
            <button onClick={clearKey} disabled={loading} style={shellButtonSecondary()}>
              Clear Saved Key
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            Status: {connected ? "Connected" : "Not connected"} • Key length: {adminKey.length}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Promo snapshot" subtitle="Quick high-level promo performance summary.">
          <div style={gridStyle(170)}>
            <div style={cardStyle("good")}>
              <strong>Total promo signups</strong>
              <span style={{ fontSize: 26, fontWeight: 900 }}>{stats.used}</span>
            </div>
            <div style={cardStyle("good")}>
              <strong>Paid conversions</strong>
              <span style={{ fontSize: 26, fontWeight: 900 }}>{stats.paid}</span>
            </div>
            <div style={cardStyle("warn")}>
              <strong>Pending rewards</strong>
              <span style={{ fontSize: 26, fontWeight: 900 }}>{money(stats.pending)}</span>
            </div>
            <div style={cardStyle()}>
              <strong>Approved rewards</strong>
              <span style={{ fontSize: 26, fontWeight: 900 }}>{money(stats.approved)}</span>
            </div>
            <div style={cardStyle()}>
              <strong>Paid rewards</strong>
              <span style={{ fontSize: 26, fontWeight: 900 }}>{money(stats.paidRewards)}</span>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Create or update promo code"
          subtitle="Launch policy: user gets the visible discount; influencer gets fixed reward after successful payment and hold period."
        >
          <div style={gridStyle(210)}>
            <input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="Promo code" style={inputStyle()} />
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Promo display name" style={inputStyle()} />
            <input value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="User discount percent" style={inputStyle()} />
            <input value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} placeholder="Influencer reward NGN" style={inputStyle()} />
            <input value={ownerAccountId} onChange={(e) => setOwnerAccountId(e.target.value)} placeholder="Owner account ID (optional)" style={inputStyle()} />
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" style={inputStyle()} />
            <input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="Owner email" style={inputStyle()} />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button onClick={saveCode} disabled={loading} style={shellButtonPrimary()}>
              Save Promo Code
            </button>
            <button
              onClick={() => {
                setNewCode("");
                setNewName("");
                setDiscountPercent("20");
                setRewardAmount("500");
                setOwnerAccountId("");
                setOwnerName("");
                setOwnerEmail("");
              }}
              disabled={loading}
              style={shellButtonSecondary()}
            >
              Clear Form
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Filters" subtitle="Filter promo codes, redemptions, and rewards.">
          <div style={gridStyle(180)}>
            <input value={filterCode} onChange={(e) => setFilterCode(e.target.value)} placeholder="Filter by promo code" style={inputStyle()} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle()}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="applied">Applied</option>
              <option value="qualified">Qualified</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Promo codes" subtitle="Assign owner account IDs when a real influencer or partner is onboarded.">
          <div style={{ display: "grid", gap: 12 }}>
            {filteredCodes.length === 0 ? (
              <div style={cardStyle()}>No promo codes loaded yet.</div>
            ) : (
              filteredCodes.map((row) => {
                const promoCode = String(row.code || "");
                const signupLink = `https://www.naijataxguides.com/signup?promo=${encodeURIComponent(promoCode)}`;
                const hubLink = `https://www.naijataxguides.com/promo/${encodeURIComponent(promoCode)}`;
                const ownerAssigned = Boolean(row.owner_account_id || row.owner_name || row.owner_email);

                return (
                  <div key={row.id || row.code} style={cardStyle(ownerAssigned ? "good" : "warn")}>
                    <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 18 }}>{text(row.code)}</strong>
                      <span style={badgeStyle(row.status)}>{text(row.status)}</span>
                    </div>
                    <div style={gridStyle(155)}>
                      <div>User discount: <strong>{text(row.discount_percent, "0")}%</strong></div>
                      <div>Influencer reward: <strong>{money(row.reward_amount_ngn)}</strong></div>
                      <div>Signups: <strong>{Number(row.used_count || 0)}</strong></div>
                      <div>Paid: <strong>{Number(row.paid_conversion_count || 0)}</strong></div>
                      <div>Owner: <strong>{text(row.owner_name || row.owner_email || row.owner_account_id, "Not assigned")}</strong></div>
                      <div>Type: <strong>{text(row.promo_type)}</strong></div>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.78 }}>Signup: {signupLink}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => loadCodeIntoForm(row)} disabled={loading} style={shellButtonSecondary()}>Load Into Form</button>
                      <button onClick={() => assignOwner(promoCode)} disabled={loading} style={shellButtonSecondary()}>Assign Current Owner Fields</button>
                      <button onClick={() => copy(signupLink, setMessage)} style={shellButtonSecondary()}>Copy Signup Link</button>
                      <button onClick={() => copy(hubLink, setMessage)} style={shellButtonSecondary()}>Copy Promo Hub</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Recent redemptions" subtitle="Signup captures and checkout qualification records.">
          <div style={{ display: "grid", gap: 12 }}>
            {filteredRedemptions.length === 0 ? (
              <div style={cardStyle()}>No redemptions loaded yet.</div>
            ) : (
              filteredRedemptions.map((row) => (
                <div key={row.id} style={cardStyle(row.status === "qualified" ? "good" : "warn")}>
                  <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                    <strong>{text(row.promo_code)}</strong>
                    <span style={badgeStyle(row.status)}>{text(row.status)}</span>
                  </div>
                  <div style={gridStyle(170)}>
                    <div>Account: <strong>{text(row.account_id)}</strong></div>
                    <div>Plan: <strong>{text(row.plan_code)}</strong></div>
                    <div>Original: <strong>{koboToNaira(row.original_amount_kobo)}</strong></div>
                    <div>Discount: <strong>{koboToNaira(row.discount_amount_kobo)}</strong></div>
                    <div>Paid: <strong>{koboToNaira(row.final_amount_kobo)}</strong></div>
                    <div>Qualified: <strong>{dateText(row.qualified_at)}</strong></div>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.78 }}>Payment: {text(row.payment_reference)}</div>
                </div>
              ))
            )}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Promo rewards" subtitle="Keep rewards pending during the hold period. Approve and mark paid only after manual review.">
          <div style={{ display: "grid", gap: 12 }}>
            {filteredRewards.length === 0 ? (
              <div style={cardStyle()}>No rewards loaded yet.</div>
            ) : (
              filteredRewards.map((row) => {
                const status = String(row.status || "").toLowerCase();
                const ready = status === "pending" && row.available_at && new Date(row.available_at).getTime() <= Date.now();

                return (
                  <div key={row.id} style={cardStyle(status === "paid" ? "good" : ready ? "warn" : "default")}>
                    <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                      <strong>{text(row.promo_code)}</strong>
                      <span style={badgeStyle(row.status)}>{text(row.status)}</span>
                    </div>
                    <div style={gridStyle(170)}>
                      <div>Beneficiary: <strong>{text(row.beneficiary_name || row.beneficiary_account_id || row.account_id, "Not assigned")}</strong></div>
                      <div>Reward: <strong>{money(row.reward_amount_ngn)}</strong></div>
                      <div>Plan: <strong>{text(row.plan_code)}</strong></div>
                      <div>Available: <strong>{dateText(row.available_at)}</strong></div>
                      <div>Paid by account: <strong>{text(row.paying_account_id)}</strong></div>
                      <div>Payment: <strong>{text(row.payment_reference)}</strong></div>
                    </div>
                    {ready ? <div style={badgeStyle("processing")}>Hold period complete — ready for admin review</div> : null}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => row.id && markRewardStatus(row.id, "approved")} disabled={loading} style={shellButtonSecondary()}>Approve</button>
                      <button onClick={() => row.id && markRewardStatus(row.id, "processing")} disabled={loading} style={shellButtonSecondary()}>Processing</button>
                      <button onClick={() => row.id && markRewardStatus(row.id, "paid")} disabled={loading} style={shellButtonPrimary()}>Mark Paid</button>
                      <button onClick={() => row.id && markRewardStatus(row.id, "failed")} disabled={loading} style={shellButtonSecondary()}>Failed</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Non-promo full-price QA" subtitle="Use this checklist before launch to confirm users without promo still pay normal price.">
          <div style={cardStyle()}>
            <strong>Expected result for normal signup without promo</strong>
            <div>1. No row should exist in promo_redemptions for that account.</div>
            <div>2. Checkout metadata should show promo_applied = false.</div>
            <div>3. discount_amount_kobo should be 0.</div>
            <div>4. final_amount_kobo should equal original_amount_kobo.</div>
            <div>5. No promo_rewards row should be created for that payment.</div>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
