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

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      setError(null);
      try {
        const json = await apiJson<WebMeResp>(
          "/web/auth/me",
          { method: "GET", timeoutMs: 20000 },
          token
        );
        if (!cancelled) setMe(json);
      } catch (e: any) {
        const msg = isApiError(e)
          ? e.message
          : e?.message || "Failed to load identity";
        if (!cancelled) setError(msg);
      }
    }

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setLoadingPlans(true);
      setError(null);

      try {
        const json = await apiJson<PlansResponse>(
          "/billing/plans?active_only=1",
          { method: "GET", timeoutMs: 20000 },
          token
        );
        const list = json?.plans || [];
        if (!cancelled) setPlans(list.filter((plan) => plan.active));
      } catch (e: any) {
        const msg = isApiError(e)
          ? e.message
          : e?.message || "Failed to load plans";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    }

    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, [token]);

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
      if (!url) {
        throw new Error(data?.error || data?.message || "Missing Paystack authorization_url");
      }

      window.location.href = url;
    } catch (e: any) {
      const msg = isApiError(e)
        ? e.message
        : e?.message || "Unable to start payment";
      setError(msg);
      alert(msg);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <AppShell
      title="Pricing"
      subtitle="Choose a subscription plan. Your account is already detected after login. Only the Paystack email is needed here."
      rightSlot={
        <div style={rightSlotWrap}>
          <div style={pill}>
            <span style={{ opacity: 0.75 }}>Account:</span>
            <span style={{ fontWeight: 950, wordBreak: "break-all" }}>
              {accountId ? shortId(accountId) : "…"}
            </span>
          </div>
        </div>
      }
    >
      <div style={grid}>
        <div style={card}>
          <div style={cardTitle}>Paystack Email</div>
          <div style={cardText}>
            Enter the email Paystack should use for this payment. Your logged-in
            account is already linked in the background.
          </div>

          <label htmlFor="pricing-email" style={labelStyle}>
            Email address
          </label>
          <input
            id="pricing-email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            inputMode="email"
            autoComplete="email"
          />

          <div style={note}>
            Your <code style={code}>account_id</code> is detected automatically
            after login, so you do not need to enter it here.
          </div>

          {error ? <div style={errorBoxStyle}>{error}</div> : null}
        </div>

        <div style={card}>
          <div style={cardTitle}>Available Plans</div>
          <div style={cardText}>
            Pick the plan that fits your current usage and continue to Paystack.
          </div>

          {loadingPlans ? (
            <div style={empty}>Loading plans…</div>
          ) : plans.length === 0 ? (
            <div style={empty}>No active plans found.</div>
          ) : (
            <div style={plansWrap}>
              {plans.map((plan) => {
                const busy = loadingPlan === plan.plan_code;

                return (
                  <div key={plan.plan_code} style={planCard}>
                    <div style={{ minWidth: 0 }}>
                      <div style={planName}>{plan.name}</div>

                      <div style={planMetaWrap}>
                        <div style={planMetaItem}>
                          Duration:
                          <span style={planMetaValue}>{plan.duration_days} days</span>
                        </div>

                        {typeof plan.price === "number" ? (
                          <div style={planMetaItem}>
                            Price:
                            <span style={planMetaValue}>
                              ₦{plan.price.toLocaleString()}
                            </span>
                          </div>
                        ) : null}
                      </div>
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
        <div style={cardTitle}>What happens next</div>
        <div style={note}>
          After payment, Paystack redirects back with a reference. The app then
          verifies that reference through <code style={code}>/billing/verify</code>
          and refreshes your billing state automatically.
        </div>
      </div>
    </AppShell>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  alignItems: "start",
};

const rightSlotWrap: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  minWidth: 0,
};

const card: React.CSSProperties = {
  borderRadius: 22,
  padding: 18,
  border: "1px solid var(--border)",
  background: "var(--panel-bg)",
  boxShadow: "var(--shadow-soft)",
  minWidth: 0,
};

const cardTitle: React.CSSProperties = {
  fontWeight: 950,
  fontSize: 20,
  lineHeight: 1.2,
  color: "var(--text)",
};

const cardText: React.CSSProperties = {
  marginTop: 8,
  color: "var(--text-muted)",
  lineHeight: 1.7,
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "var(--text-soft)",
  marginTop: 16,
  marginBottom: 8,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 15px",
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  outline: "none",
  fontSize: 16,
  minWidth: 0,
};

const plansWrap: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 14,
};

const planCard: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 16,
  background: "var(--surface)",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  alignItems: "center",
  gap: 14,
  minWidth: 0,
};

const planName: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 950,
  color: "var(--text)",
  lineHeight: 1.35,
  wordBreak: "break-word",
};

const planMetaWrap: React.CSSProperties = {
  display: "grid",
  gap: 6,
  marginTop: 8,
};

const planMetaItem: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  alignItems: "center",
  fontSize: 13,
  color: "var(--text-muted)",
  lineHeight: 1.5,
};

const planMetaValue: React.CSSProperties = {
  fontWeight: 900,
  color: "var(--text)",
  wordBreak: "break-word",
};

const payBtn: React.CSSProperties = {
  padding: "13px 16px",
  borderRadius: 14,
  border: "1px solid var(--accent-border)",
  background: "linear-gradient(180deg, rgba(99,102,241,0.96), rgba(79,70,229,0.92))",
  color: "#fff",
  fontWeight: 950,
  fontSize: 14,
  width: "100%",
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(244,63,94,0.25)",
  background: "rgba(244,63,94,0.10)",
  color: "var(--text)",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  lineHeight: 1.6,
};

const note: React.CSSProperties = {
  marginTop: 14,
  padding: 13,
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "var(--surface-soft)",
  color: "var(--text-soft)",
  fontSize: 13,
  lineHeight: 1.7,
  wordBreak: "break-word",
};

const empty: React.CSSProperties = {
  padding: 14,
  marginTop: 14,
  borderRadius: 16,
  border: "1px dashed var(--border-strong)",
  background: "var(--surface-soft)",
  color: "var(--text-muted)",
  fontSize: 13,
  lineHeight: 1.6,
};

const code: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
};

const pill: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--surface-soft)",
  fontSize: 12,
  display: "inline-flex",
  gap: 6,
  alignItems: "center",
  minWidth: 0,
  flexWrap: "wrap",
};

function shortId(id: string) {
  if (!id) return "";
  return id.length <= 12 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}
