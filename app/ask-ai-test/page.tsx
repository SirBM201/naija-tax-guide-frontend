"use client";

import React, { useEffect, useState } from "react";
import { apiJson, isApiError } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

type AskResp = {
  ok?: boolean;
  answer?: string;
  from_cache?: boolean;
  account_id?: string;
  subscription?: any;
  plan_code?: string | null;
  usage_charged?: boolean;
  credits_consumed?: number;
  debug?: any;
  error?: string;
  root_cause?: string;
  fix?: string;
  details?: any;
};

type DebugStateResp = {
  ok?: boolean;
  account_id?: string;
  subscription?: any;
  subscription_summary?: any;
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
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
      <div style={{ color: "white", fontWeight: 900, fontSize: 18 }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 6, color: "rgba(255,255,255,0.65)", fontSize: 14 }}>{subtitle}</div>
      ) : null}
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}

function JsonBlock({ data }: { data: any }) {
  return (
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
  );
}

function AlertPanel({
  title,
  message,
  tone,
  actions,
}: {
  title: string;
  message: string;
  tone: "warn" | "good";
  actions?: React.ReactNode;
}) {
  const border =
    tone === "good"
      ? "1px solid rgba(80,220,140,0.24)"
      : "1px solid rgba(255,180,80,0.24)";

  const background =
    tone === "good"
      ? "rgba(80,220,140,0.08)"
      : "rgba(255,180,80,0.08)";

  return (
    <div
      style={{
        marginBottom: 18,
        borderRadius: 18,
        border,
        background,
        padding: 18,
      }}
    >
      <div style={{ color: "white", fontWeight: 900, fontSize: 18 }}>{title}</div>
      <div style={{ marginTop: 8, color: "rgba(255,255,255,0.88)", lineHeight: 1.7 }}>
        {message}
      </div>
      {actions ? <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>{actions}</div> : null}
    </div>
  );
}

export default function AskAiTestPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();

  const [status, setStatus] = useState("Loading test page...");
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("What is taxable income?");
  const [lang, setLang] = useState("en");

  const [beforeState, setBeforeState] = useState<DebugStateResp | any>(null);
  const [afterState, setAfterState] = useState<DebugStateResp | any>(null);
  const [askResp, setAskResp] = useState<AskResp | any>(null);

  const loadDebugState = async (target: "before" | "after") => {
    const data = await apiJson<DebugStateResp>("/billing/debug-state", {
      method: "GET",
      timeoutMs: 20000,
      useAuthToken: false,
    });

    if (target === "before") setBeforeState(data);
    else setAfterState(data);

    return data;
  };

  const loadInitial = async () => {
    setBusy(true);
    setStatus("Loading monetization state...");
    try {
      await refreshSession();
      await loadDebugState("before");
      setStatus("Ready to test Ask AI.");
    } catch (err: any) {
      if (isApiError(err)) {
        setStatus(`Initial load failed (${err.status})`);
        setBeforeState(err.data ?? null);
      } else {
        setStatus("Initial load failed");
        setBeforeState(String(err?.message || err));
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAskTest = async () => {
    setBusy(true);
    setStatus("Running Ask AI test...");
    setAskResp(null);
    setAfterState(null);

    try {
      await refreshSession();
      await loadDebugState("before");

      const data = await apiJson<AskResp>("/ask", {
        method: "POST",
        timeoutMs: 60000,
        useAuthToken: false,
        body: {
          question,
          lang,
          channel: "web",
        },
      });

      setAskResp(data);
      await loadDebugState("after");

      if (data?.ok) {
        setStatus("Ask AI test completed successfully.");
      } else {
        setStatus(`Ask AI returned an application error (${data?.error || "unknown_error"})`);
      }
    } catch (err: any) {
      if (isApiError(err)) {
        setAskResp(err.data ?? null);
        try {
          await loadDebugState("after");
        } catch {
          // ignore
        }
        setStatus(`Ask AI failed (${err.status})`);
      } else {
        setAskResp({ ok: false, error: "request_failed", root_cause: String(err?.message || err) });
        setStatus("Ask AI failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const guardBefore = beforeState?.subscription_guard_snapshot?.access;
  const creditsBefore = beforeState?.credit_balance;
  const usageBefore = beforeState?.daily_usage_today;

  const creditsAfter = afterState?.credit_balance;
  const usageAfter = afterState?.daily_usage_today;

  const askError = String(askResp?.error || "").trim().toLowerCase();
  const currentBalance =
    askResp?.details?.balance ??
    askResp?.details?.credit_balance ??
    beforeState?.credit_balance?.balance ??
    afterState?.credit_balance?.balance ??
    0;

  const actionButtonStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(900px 700px at 20% 10%, rgba(120,140,255,0.22), transparent 60%), rgba(7,10,18,1)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
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
              Ask AI Test
            </div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.70)" }}>
              End-to-end paid AI testing for auth, subscription, credits, cache, and daily usage.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Dashboard
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
              Billing
            </button>

            <button
              onClick={() => router.push("/plans")}
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,180,80,0.12)",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Plans
            </button>

            <button
              onClick={() => router.push("/billing/debug-state")}
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
              Billing Debug
            </button>

            <button
              onClick={loadInitial}
              disabled={busy}
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                fontWeight: 900,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              Refresh State
            </button>
          </div>
        </div>

        <Section title="Test Status">
          <div style={{ color: "rgba(255,255,255,0.90)", fontSize: 18 }}>{status}</div>
        </Section>

        <Section title="Before Ask State" subtitle="This is the monetization state before the current test run.">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            <InfoCard
              label="Guard Allowed"
              value={String(Boolean(guardBefore?.allowed))}
              tone={guardBefore?.allowed ? "good" : "warn"}
            />
            <InfoCard
              label="Guard Reason"
              value={formatValue(guardBefore?.reason)}
              tone={guardBefore?.allowed ? "good" : "warn"}
            />
            <InfoCard label="Plan Code" value={formatValue(beforeState?.subscription_guard_snapshot?.plan_code)} />
            <InfoCard
              label="Credit Balance"
              value={formatValue(creditsBefore?.balance)}
              tone={Number(creditsBefore?.balance || 0) > 0 ? "good" : "warn"}
            />
            <InfoCard
              label="Usage Today"
              value={formatValue(usageBefore?.count)}
              tone={usageBefore?.ok ? "good" : "warn"}
            />
            <InfoCard label="Daily Limit" value={formatValue(beforeState?.subscription_guard_snapshot?.daily_answers_limit)} />
          </div>
        </Section>

        <Section title="Ask AI Request">
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ display: "block", color: "white", fontWeight: 800, marginBottom: 8 }}>
                Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.22)",
                  color: "white",
                  padding: 16,
                  fontSize: 15,
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ maxWidth: 260 }}>
              <label style={{ display: "block", color: "white", fontWeight: 800, marginBottom: 8 }}>
                Language
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.22)",
                  color: "white",
                  padding: 14,
                  fontSize: 15,
                  outline: "none",
                }}
              >
                <option value="en">English</option>
                <option value="pcm">Pidgin</option>
                <option value="yo">Yoruba</option>
                <option value="ig">Igbo</option>
                <option value="ha">Hausa</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={runAskTest}
                disabled={busy || !question.trim()}
                style={{
                  padding: "14px 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(120,140,255,0.16)",
                  color: "white",
                  fontWeight: 900,
                  cursor: busy || !question.trim() ? "not-allowed" : "pointer",
                }}
              >
                {busy ? "Running Test..." : "Run Ask AI Test"}
              </button>
            </div>
          </div>
        </Section>

        <Section title="Ask AI Result" subtitle="This is the direct response returned by /ask.">
          {askError === "insufficient_credits" ? (
            <AlertPanel
              tone="warn"
              title="AI credits exhausted"
              message={`Your current AI credit balance is ${formatValue(
                currentBalance
              )}, so this question cannot be processed right now. Please top up AI credits or move to a plan with more included credits before asking another question.`}
              actions={
                <>
                  <button onClick={() => router.push("/billing")} style={actionButtonStyle}>
                    Open Billing
                  </button>
                  <button onClick={() => router.push("/plans")} style={actionButtonStyle}>
                    Open Plans
                  </button>
                </>
              }
            />
          ) : null}

          {askError === "subscription_required" ? (
            <AlertPanel
              tone="warn"
              title="Active subscription required"
              message="This account does not currently have an active subscription for paid AI access. Please activate or upgrade a plan before asking AI questions."
              actions={
                <>
                  <button onClick={() => router.push("/plans")} style={actionButtonStyle}>
                    Open Plans
                  </button>
                  <button onClick={() => router.push("/billing")} style={actionButtonStyle}>
                    Open Billing
                  </button>
                </>
              }
            />
          ) : null}

          {askError === "daily_limit_reached" ? (
            <AlertPanel
              tone="warn"
              title="Daily AI limit reached"
              message="This account has reached the daily question limit for the current plan. Please wait for the next day or move to a higher plan with a larger daily allowance."
              actions={
                <>
                  <button onClick={() => router.push("/plans")} style={actionButtonStyle}>
                    Open Plans
                  </button>
                  <button onClick={() => router.push("/billing/debug-state")} style={actionButtonStyle}>
                    View Debug State
                  </button>
                </>
              }
            />
          ) : null}

          {askResp?.ok ? (
            <AlertPanel
              tone="good"
              title="Ask AI completed successfully"
              message={
                askResp?.from_cache
                  ? "This answer was served from cache. Credits should not be consumed, but daily usage can still increase."
                  : "This answer was generated successfully. Usage and credit deductions should now be reflected in the after-state section below."
              }
            />
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <InfoCard label="OK" value={formatValue(askResp?.ok)} tone={askResp?.ok ? "good" : "warn"} />
            <InfoCard
              label="From Cache"
              value={formatValue(askResp?.from_cache)}
              tone={askResp?.from_cache ? "good" : "default"}
            />
            <InfoCard label="Plan Code" value={formatValue(askResp?.plan_code)} />
            <InfoCard
              label="Usage Charged"
              value={formatValue(askResp?.usage_charged)}
              tone={askResp?.usage_charged ? "good" : "warn"}
            />
            <InfoCard
              label="Credits Consumed"
              value={formatValue(askResp?.credits_consumed)}
              tone={Number(askResp?.credits_consumed || 0) > 0 ? "warn" : "good"}
            />
            <InfoCard label="Error" value={formatValue(askResp?.error)} tone={askResp?.error ? "warn" : "good"} />
          </div>

          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              padding: 16,
              color: "white",
              minHeight: 120,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {askResp?.answer || "No answer returned yet."}
          </div>

          <div style={{ marginTop: 16 }}>
            <JsonBlock data={askResp} />
          </div>
        </Section>

        <Section title="After Ask State" subtitle="Use this to confirm credits and usage changed correctly after the request.">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            <InfoCard
              label="Credit Balance After"
              value={formatValue(creditsAfter?.balance)}
              tone={Number(creditsAfter?.balance || 0) > 0 ? "good" : "warn"}
            />
            <InfoCard label="Credit Updated At" value={formatDate(creditsAfter?.updated_at)} />
            <InfoCard label="Usage Today After" value={formatValue(usageAfter?.count)} tone={usageAfter?.ok ? "good" : "warn"} />
            <InfoCard label="Usage Day" value={formatValue(usageAfter?.day)} />
            <InfoCard
              label="Guard Allowed After"
              value={formatValue(afterState?.subscription_guard_snapshot?.access?.allowed)}
              tone={afterState?.subscription_guard_snapshot?.access?.allowed ? "good" : "warn"}
            />
            <InfoCard
              label="Guard Reason After"
              value={formatValue(afterState?.subscription_guard_snapshot?.access?.reason)}
              tone={afterState?.subscription_guard_snapshot?.access?.allowed ? "good" : "warn"}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <JsonBlock data={afterState} />
          </div>
        </Section>
      </div>
    </div>
  );
}