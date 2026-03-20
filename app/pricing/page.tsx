// app/pricing/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import AppShell from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiJson, isApiError } from "@/lib/api";

type Plan = {
  plan_code: string;
  name: string;
  duration_days: number;
  active: boolean;
  price?: number;
};

type PlansResponse = {
  ok?: boolean;
  plans?: Plan[];
  error?: string;
  message?: string;
};

type CheckoutResponse = {
  ok?: boolean;
  authorization_url?: string;
  reference?: string;
  access_code?: string;
  plan?: any;
  account_id?: string;
  error?: string;
  message?: string;
};

type WebMeResp = {
  ok?: boolean;
  account_id?: string;
  error?: string;
  debug?: any;
};

export default function PricingPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { token } = useAuth();

  const [me, setMe] = useState<WebMeResp | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [email, setEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const accountId = useMemo(() => (me?.account_id || "").trim(), [me]);

  // Load identity
  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      setError(null);
      try {
        const json = await apiJson<WebMeResp>("/web/auth/me", { method: "GET", timeoutMs: 20000 }, token);
        if (!cancelled) setMe(json);
      } catch (e: any) {
        const msg = isApiError(e) ? e.message : (e?.message || "Failed to load identity");
        if (!cancelled) setError(msg);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Load plans
  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setLoadingPlans(true);
      setError(null);

      try {
        const json = await apiJson<PlansResponse>("/billing/plans?active_only=1", { method: "GET", timeoutMs: 20000 }, token);
        const list = json?.plans || [];
        if (!cancelled) setPlans(list.filter((p) => p.active));
      } catch (e: any) {
        const msg = isApiError(e) ? e.message : (e?.message || "Failed to load plans");
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    }

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Start payment
  async function startPayment(planCode: string) {
    if (!email.trim()) {
      setError("Email is required for Paystack.");
      return;
    }

    if (!accountId) {
      setError("Missing account_id from /web/auth/me. Please login again and retry.");
      return;
    }

    setLoadingPlan(planCode);
    setError(null);

    try {
      const data = await apiJson<CheckoutResponse>(
        "/billing/checkout",
        {
          method: "POST",
          timeoutMs: 25000,
          body: {
            plan_code: planCode,
            email: email.trim().toLowerCase(),
          },
        },
        token
      );

      const url = data?.authorization_url;
      if (!url) throw new Error(data?.error || data?.message || "Missing Paystack authorization_url");

      window.location.href = url;
    } catch (e: any) {
      const msg = isApiError(e) ? e.message : (e?.message || "Unable to start payment");
      setError(msg);
      alert(msg);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <AppShell
      title="Pricing"
      subtitle="Choose a subscription plan. Your account_id is detected after login; you only enter email for Paystack."
      rightSlot={
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={pill}>
            <span style={{ opacity: 0.75 }}>Account:</span>{" "}
            <span style={{ fontWeight: 950 }}>{accountId ? shortId(accountId) : "…"}</span>
          </div>
        </div>
      }
    >
      <div style={grid}>
        <div style={card}>
          <div style={cardTitle}>Paystack Email</div>

          <label style={labelStyle}>Email (required by Paystack)</label>
          <input placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

          <div style={note}>
            Your <code style={code}>account_id</code> is detected automatically after login.
          </div>

          {error ? <div style={errorBoxStyle}>{error}</div> : null}
        </div>

        <div style={card}>
          <div style={cardTitle}>Available Plans</div>

          {loadingPlans ? (
            <div style={empty}>Loading plans…</div>
          ) : plans.length === 0 ? (
            <div style={empty}>No active plans found.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {plans.map((plan) => {
                const busy = loadingPlan === plan.plan_code;

                return (
                  <div key={plan.plan_code} style={planCard}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 950 }}>{plan.name}</div>
                      <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                        Duration: <span style={{ fontWeight: 900 }}>{plan.duration_days} days</span>
                      </div>

                      {typeof plan.price === "number" ? (
                        <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                          Price: <span style={{ fontWeight: 900 }}>₦{plan.price.toLocaleString()}</span>
                        </div>
                      ) : null}
                    </div>

                    <button
                      disabled={!!loadingPlan}
                      style={{
                        ...payBtn,
                        opacity: !!loadingPlan && !busy ? 0.55 : 1,
                        cursor: !!loadingPlan ? "not-allowed" : "pointer",
                      }}
                      onClick={() => startPayment(plan.plan_code)}
                    >
                      {busy ? "Processing…" : "Pay Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div style={card}>
        <div style={cardTitle}>Notes</div>
        <div style={note}>
          After payment, Paystack redirects back with <code style={code}>reference</code>. Dashboard verifies it via{" "}
          <code style={code}>/billing/verify</code> and refreshes <code style={code}>/billing/me</code>.
        </div>
      </div>
    </AppShell>
  );
}

// ---------- styles ----------
const grid: React.CSSProperties = { display: "grid", gap: 14, gridTemplateColumns: "1fr 1.2fr", alignItems: "start" };

const card: React.CSSProperties = {
  borderRadius: 22,
  padding: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  backdropFilter: "blur(10px)",
};

const cardTitle: React.CSSProperties = { fontWeight: 950, marginBottom: 10, opacity: 0.9 };

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, opacity: 0.85, marginBottom: 6 };

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.35)",
  color: "white",
  outline: "none",
};

const planCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 18,
  padding: 16,
  background: "rgba(0,0,0,0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const payBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(135deg, rgba(34,197,94,0.20), rgba(99,102,241,0.18))",
  color: "#fff",
  fontWeight: 950,
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(244,63,94,0.25)",
  background: "rgba(244,63,94,0.10)",
  color: "rgba(255,255,255,0.92)",
  whiteSpace: "pre-wrap",
};

const note: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.20)",
  opacity: 0.85,
  fontSize: 12,
  lineHeight: 1.5,
};

const empty: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  border: "1px dashed rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.20)",
  opacity: 0.85,
  fontSize: 13,
  lineHeight: 1.5,
};

const code: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
};

const pill: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  fontSize: 12,
};

function shortId(id: string) {
  if (!id) return "";
  return id.length <= 12 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}