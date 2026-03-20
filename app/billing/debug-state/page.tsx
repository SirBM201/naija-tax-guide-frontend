"use client";

import React, { useEffect, useState } from "react";
import { apiJson, isApiError } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

type DebugStateResp = {
  ok?: boolean;
  account_id?: string;
  subscription?: {
    id?: string;
    account_id?: string;
    plan_code?: string;
    status?: string;
    is_active?: boolean;
    started_at?: string | null;
    expires_at?: string | null;
    current_period_end?: string | null;
    provider?: string | null;
    provider_ref?: string | null;
    grace_until?: string | null;
    trial_until?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    pending_plan_code?: string | null;
    pending_starts_at?: string | null;
  } | null;
  subscription_error?: any;
  subscription_summary?: {
    has_subscription?: boolean;
    is_active_now?: boolean;
    has_pending_change?: boolean;
    current_plan_code?: string | null;
    pending_plan_code?: string | null;
    pending_starts_at?: string | null;
    status?: string | null;
    is_active?: boolean;
    started_at?: string | null;
    expires_at?: string | null;
    current_period_end?: string | null;
    provider?: string | null;
    provider_ref?: string | null;
  } | null;
  subscription_guard_snapshot?: {
    ok?: boolean;
    account_id?: string;
    subscription?: any;
    plan?: any;
    plan_code?: string | null;
    daily_answers_limit?: number;
    ai_credits_total?: number;
    active_now?: boolean;
    access?: {
      allowed?: boolean;
      reason?: string;
      status?: string;
      upgrade_required?: boolean;
    };
    error?: string;
    root_cause?: string;
    fix?: string;
    details?: any;
  } | null;
  checkout_email?: string | null;
  checkout_email_error?: any;
  credit_balance?: {
    ok?: boolean;
    exists?: boolean;
    balance?: number;
    updated_at?: string | null;
    account_id?: string;
    error?: string;
    root_cause?: string;
    fix?: string;
    details?: any;
  } | null;
  daily_usage_today?: {
    ok?: boolean;
    account_id?: string;
    day?: string;
    count?: number;
    error?: string;
    root_cause?: string;
    fix?: string;
    details?: any;
  } | null;
  debug?: any;
  error?: string;
};

function formatValue(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function formatDate(v: any) {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function boolTone(v: boolean | undefined) {
  return v ? "good" : "warn";
}

function accessTone(access: DebugStateResp["subscription_guard_snapshot"]["access"] | undefined) {
  return access?.allowed ? "good" : "warn";
}

function creditTone(balance: DebugStateResp["credit_balance"] | null | undefined) {
  if (!balance?.ok) return "warn";
  return Number(balance.balance || 0) > 0 ? "good" : "warn";
}

export default function BillingDebugStatePage() {
  const router = useRouter();
  const { refreshSession } = useAuth();

  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState("Loading monetization debug state...");
  const [raw, setRaw] = useState<DebugStateResp | any>(null);

  const loadState = async () => {
    setBusy(true);
    setStatus("Loading monetization debug state...");
    try {
      await refreshSession();

      const data = await apiJson<DebugStateResp>("/billing/debug-state", {
        method: "GET",
        timeoutMs: 20000,
        useAuthToken: false,
      });

      setRaw(data);
      setStatus("Debug state loaded.");
    } catch (err: any) {
      if (isApiError(err)) {
        setStatus(`Debug state load failed (${err.status})`);
        setRaw(err.data ?? null);
      } else {
        setStatus("Debug state load failed");
        setRaw(String(err?.message || err));
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sub = raw?.subscription || null;
  const summary = raw?.subscription_summary || null;
  const guard = raw?.subscription_guard_snapshot || null;
  const credits = raw?.credit_balance || null;
  const usage = raw?.daily_usage_today || null;
  const access = guard?.access || null;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(900px 700px at 20% 10%, rgba(120,140,255,0.22), transparent 60%), rgba(7,10,18,1)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 42, fontWeight: 950, color: "white", letterSpacing: -1 }}>
              Billing Debug State
            </div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.70)" }}>{status}</div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={loadState}
              disabled={busy}
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontWeight: 900,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              Refresh
            </button>

            <button
              onClick={() => router.push("/billing")}
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Open Billing
            </button>

            <button
              onClick={() => router.push("/plans")}
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Open Plans
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 14,
          }}
        >
          <InfoCard label="Account ID" value={formatValue(raw?.account_id)} />
          <InfoCard label="Plan Code" value={formatValue(sub?.plan_code || guard?.plan_code)} />
          <InfoCard
            label="Guard Access Allowed"
            value={String(Boolean(access?.allowed))}
            tone={accessTone(access || undefined)}
          />
          <InfoCard
            label="Active Now"
            value={String(Boolean(summary?.is_active_now ?? guard?.active_now))}
            tone={boolTone(Boolean(summary?.is_active_now ?? guard?.active_now))}
          />
          <InfoCard
            label="Credit Balance"
            value={formatValue(credits?.balance)}
            tone={creditTone(credits)}
          />
          <InfoCard
            label="Daily Usage Today"
            value={formatValue(usage?.count)}
            tone={usage?.ok ? "good" : "warn"}
          />
        </div>

        <Section title="Guard Decision">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            <InfoCard
              label="Allowed"
              value={String(Boolean(access?.allowed))}
              tone={accessTone(access || undefined)}
            />
            <InfoCard label="Reason" value={formatValue(access?.reason)} tone={accessTone(access || undefined)} />
            <InfoCard label="Status" value={formatValue(access?.status)} />
            <InfoCard
              label="Upgrade Required"
              value={String(Boolean(access?.upgrade_required))}
              tone={access?.upgrade_required ? "warn" : "good"}
            />
            <InfoCard
              label="Plan Code"
              value={formatValue(guard?.plan_code)}
            />
            <InfoCard
              label="Daily Answers Limit"
              value={formatValue(guard?.daily_answers_limit)}
            />
            <InfoCard
              label="Plan Credits Total"
              value={formatValue(guard?.ai_credits_total)}
            />
          </div>
        </Section>

        <Section title="Subscription Snapshot">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            <InfoCard label="Subscription ID" value={formatValue(sub?.id)} />
            <InfoCard label="Plan Code" value={formatValue(sub?.plan_code)} />
            <InfoCard label="Status" value={formatValue(sub?.status)} tone={boolTone(Boolean(summary?.is_active_now))} />
            <InfoCard label="Is Active" value={String(Boolean(sub?.is_active))} tone={boolTone(Boolean(sub?.is_active))} />
            <InfoCard label="Started At" value={formatDate(sub?.started_at)} />
            <InfoCard label="Expires At" value={formatDate(sub?.expires_at)} />
            <InfoCard label="Current Period End" value={formatDate(sub?.current_period_end)} />
            <InfoCard label="Grace Until" value={formatDate(sub?.grace_until)} />
            <InfoCard label="Trial Until" value={formatDate(sub?.trial_until)} />
            <InfoCard label="Pending Plan Code" value={formatValue(sub?.pending_plan_code)} />
            <InfoCard label="Pending Starts At" value={formatDate(sub?.pending_starts_at)} />
            <InfoCard label="Provider" value={formatValue(sub?.provider)} />
            <InfoCard label="Provider Ref" value={formatValue(sub?.provider_ref)} />
            <InfoCard label="Updated At" value={formatDate(sub?.updated_at)} />
          </div>

          {raw?.subscription_error ? (
            <DebugBlock title="Subscription Error" data={raw.subscription_error} />
          ) : null}
        </Section>

        <Section title="Subscription Summary">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            <InfoCard
              label="Has Subscription"
              value={String(Boolean(summary?.has_subscription))}
              tone={summary?.has_subscription ? "good" : "warn"}
            />
            <InfoCard
              label="Is Active Now"
              value={String(Boolean(summary?.is_active_now))}
              tone={boolTone(Boolean(summary?.is_active_now))}
            />
            <InfoCard
              label="Has Pending Change"
              value={String(Boolean(summary?.has_pending_change))}
              tone={summary?.has_pending_change ? "warn" : "good"}
            />
            <InfoCard label="Current Plan Code" value={formatValue(summary?.current_plan_code)} />
            <InfoCard label="Pending Plan Code" value={formatValue(summary?.pending_plan_code)} />
            <InfoCard label="Pending Starts At" value={formatDate(summary?.pending_starts_at)} />
          </div>
        </Section>

        <Section title="Checkout Email">
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              border: raw?.checkout_email
                ? "1px solid rgba(80,220,140,0.22)"
                : "1px solid rgba(255,180,80,0.22)",
              background: raw?.checkout_email ? "rgba(80,220,140,0.08)" : "rgba(255,180,80,0.08)",
              color: "white",
              fontWeight: 800,
            }}
          >
            {raw?.checkout_email ? `Resolved checkout email: ${raw.checkout_email}` : "Checkout email is missing."}
          </div>

          {raw?.checkout_email_error ? <DebugBlock title="Checkout Email Error" data={raw.checkout_email_error} /> : null}
        </Section>

        <Section title="Credit Balance">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            <InfoCard label="Lookup OK" value={String(Boolean(credits?.ok))} tone={credits?.ok ? "good" : "warn"} />
            <InfoCard label="Balance Row Exists" value={String(Boolean(credits?.exists))} tone={credits?.exists ? "good" : "warn"} />
            <InfoCard label="Balance" value={formatValue(credits?.balance)} tone={creditTone(credits)} />
            <InfoCard label="Updated At" value={formatDate(credits?.updated_at)} />
          </div>

          {credits && !credits.ok ? <DebugBlock title="Credit Error" data={credits} /> : null}
        </Section>

        <Section title="Daily Usage Today">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            <InfoCard label="Lookup OK" value={String(Boolean(usage?.ok))} tone={usage?.ok ? "good" : "warn"} />
            <InfoCard label="Day" value={formatValue(usage?.day)} />
            <InfoCard label="Count" value={formatValue(usage?.count)} tone={usage?.ok ? "good" : "warn"} />
          </div>

          {usage && !usage.ok ? <DebugBlock title="Daily Usage Error" data={usage} /> : null}
        </Section>

        <Section title="Raw Response (Debug)">
          <pre
            style={{
              margin: 0,
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              color: "rgba(255,255,255,0.86)",
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(raw, null, 2)}
          </pre>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: 22,
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        padding: 22,
      }}
    >
      <div style={{ color: "white", fontWeight: 900, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function DebugBlock({
  title,
  data,
}: {
  title: string;
  data: any;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: "white", fontWeight: 900, marginBottom: 10 }}>{title}</div>
      <pre
        style={{
          margin: 0,
          padding: 16,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.22)",
          color: "rgba(255,255,255,0.86)",
          whiteSpace: "pre-wrap",
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function InfoCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
}) {
  let border = "1px solid rgba(255,255,255,0.08)";
  let bg = "rgba(0,0,0,0.18)";

  if (tone === "good") {
    border = "1px solid rgba(80,220,140,0.22)";
    bg = "rgba(80,220,140,0.08)";
  } else if (tone === "warn") {
    border = "1px solid rgba(255,180,80,0.22)";
    bg = "rgba(255,180,80,0.08)";
  }

  return (
    <div
      style={{
        borderRadius: 16,
        border,
        background: bg,
        padding: 16,
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 13 }}>{label}</div>
      <div style={{ color: "white", fontWeight: 900, marginTop: 6, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}