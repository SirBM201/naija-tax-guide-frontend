"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/api";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, MetricCard, formatCurrency, formatDate } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { buildWorkspaceAlerts } from "@/lib/workspace-alerts";

type BillingHistoryRow = {
  reference?: string;
  event_type?: string;
  status?: string;
  amount_ngn?: number;
  currency?: string;
  paid_at?: string | null;
  created_at?: string | null;
  plan_code?: string | null;
  plan_name?: string | null;
  payment_method?: string | null;
  channel_type?: string | null;
  gateway_response?: string | null;
  source?: string | null;
};

type BillingHistoryResponse = {
  ok?: boolean;
  account_id?: string;
  history?: {
    ok?: boolean;
    count?: number;
    rows?: BillingHistoryRow[];
    latest_success?: BillingHistoryRow | null;
    db_warning?: string | null;
  } | null;
};

function safeText(value: unknown, fallback = "—"): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
      ? ""
      : String(value).trim();
  return text || fallback;
}

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return ["1", "true", "yes", "active", "paid", "enabled"].includes(raw);
  }
  return false;
}

function snapshotItemStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 16,
    display: "grid",
    gap: 6,
  };
}

function infoTextStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    color: "var(--text-muted)",
    fontWeight: 700,
  };
}

function valueTextStyle(): React.CSSProperties {
  return {
    fontSize: 16,
    fontWeight: 800,
    color: "var(--text)",
    wordBreak: "break-word",
  };
}

function billingStateLabel(args: {
  active: boolean;
  pendingPlanCode: string;
}) {
  if (!args.active) return "Inactive";
  if (args.pendingPlanCode) return "Pending Change";
  return "Active";
}

function renewalLabel(args: {
  autoRenew: boolean;
  active: boolean;
}) {
  if (!args.active) return "Not active";
  return args.autoRenew ? "Auto renew enabled" : "Manual renewal";
}

function nextBillingAction(args: {
  active: boolean;
  pendingPlanCode: string;
  checkoutEmail: string;
  autoRenew: boolean;
}) {
  if (!args.checkoutEmail || args.checkoutEmail === "Not currently available") {
    return "Review billing email";
  }
  if (!args.active) return "Activate or renew subscription";
  if (args.pendingPlanCode) return "Review scheduled plan change";
  if (!args.autoRenew) return "Monitor renewal manually";
  return "Billing looks stable";
}

function paymentTone(status: string): "default" | "good" | "warn" | "danger" {
  const raw = (status || "").trim().toLowerCase();
  if (["success", "paid", "active"].includes(raw)) return "good";
  if (["pending", "processing", "queued"].includes(raw)) return "warn";
  if (["failed", "abandoned", "reversed", "cancelled", "canceled"].includes(raw)) return "danger";
  return "default";
}

function paymentLabel(status: string): string {
  const raw = (status || "").trim().toLowerCase();
  if (!raw) return "Unknown";
  return raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function paymentEventLabel(eventType: string): string {
  const raw = (eventType || "").trim().toLowerCase();
  if (!raw) return "Payment Event";
  if (raw === "charge.success") return "Charge Success";
  if (raw === "verify") return "Redirect Verify";
  if (raw === "subscription_snapshot") return "Subscription Snapshot";
  return raw.replace(/[_.-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function paymentMethodLabel(value: string): string {
  const raw = (value || "").trim();
  if (!raw) return "Not currently available";
  return raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function BillingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    profile,
    usage,
    subscription,
    channelLinks,
    billing,
    credits,
    refreshAll,
  } = useWorkspaceState();

  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyData, setHistoryData] = useState<BillingHistoryResponse | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setHistoryBusy(true);
      setHistoryError(null);
      const data = await apiJson<BillingHistoryResponse>("/billing/history", {
        method: "GET",
        query: { limit: 12 },
        timeoutMs: 20000,
        useAuthToken: false,
      });
      setHistoryData(data);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Could not load billing history.");
    } finally {
      setHistoryBusy(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const allAlerts = useMemo(
    () =>
      buildWorkspaceAlerts({
        profile,
        usage,
        subscription,
        channelLinks,
        billing,
        credits,
      }),
    [profile, usage, subscription, channelLinks, billing, credits]
  );

  const primaryAlert =
    allAlerts.find(
      (alert) =>
        /billing|subscription|payment|plan/i.test(alert.title) ||
        /billing|subscription|payment|plan/i.test(alert.subtitle)
    ) || allAlerts[0] || null;

  const checkoutEmail = safeText(
    billing?.checkout_email || profile?.email || user?.email || "Not currently available"
  );

  const planName = safeText(
    subscription?.plan_name ||
      billing?.plan_name ||
      subscription?.plan_code ||
      billing?.plan_code ||
      "No active plan"
  );

  const planCode = safeText(
    subscription?.plan_code || billing?.plan_code || "Not currently available"
  );

  const status = safeText(subscription?.status || billing?.status || "Unknown");

  const active = truthyValue(
    subscription?.active || billing?.active || status.toLowerCase() === "active"
  );

  const autoRenew = truthyValue(billing?.auto_renew || subscription?.auto_renew);

  const startsAt = safeText(subscription?.starts_at || billing?.starts_at || "", "");
  const expiresAt = safeText(subscription?.expires_at || billing?.expires_at || "", "");

  const pendingPlanCode = safeText(
    subscription?.pending_plan_code || billing?.pending_plan_code || "",
    ""
  );

  const pendingStartsAt = safeText(
    subscription?.pending_starts_at || billing?.pending_starts_at || "",
    ""
  );

  const latestHistoryRow = historyData?.history?.latest_success || historyData?.history?.rows?.[0] || null;

  const lastPaymentRef = safeText(
    billing?.payment_reference ||
      billing?.last_payment_reference ||
      latestHistoryRow?.reference ||
      "",
    ""
  );

  const paymentMethod = safeText(
    billing?.payment_method ||
      billing?.provider ||
      billing?.provider_name ||
      latestHistoryRow?.payment_method ||
      "",
    ""
  );

  const billingAny = billing as any;

  const creditBalance = Number(credits?.balance ?? billingAny?.credit_balance ?? 0);
  const creditUpdatedAt = safeText(
    credits?.updated_at || billingAny?.credit_updated_at || "",
    ""
  );
  const usageToday = safeText(
    usage?.count ?? billingAny?.daily_usage_count ?? usage?.daily_usage ?? "",
    ""
  );

  const historyRows = historyData?.history?.rows || [];
  const historyCount = Number(historyData?.history?.count || historyRows.length || 0);
  const latestPaymentDate = safeText(
    latestHistoryRow?.paid_at || latestHistoryRow?.created_at || "",
    ""
  );

  const billingState = billingStateLabel({
    active,
    pendingPlanCode,
  });

  const renewalState = renewalLabel({
    autoRenew,
    active,
  });

  const nextAction = nextBillingAction({
    active,
    pendingPlanCode,
    checkoutEmail,
    autoRenew,
  });

  return (
    <AppShell
      title="Billing"
      subtitle="Review your subscription state, renewal status, payment details, credits visibility, and the next billing action your account may need."
      actions={
        <>
          <button
            onClick={() => {
              refreshAll();
              void loadHistory();
            }}
            style={shellButtonPrimary()}
          >
            Refresh Billing
          </button>
          <button onClick={() => router.push("/plans")} style={shellButtonSecondary()}>
            Manage Plans
          </button>
        </>
      }
    >
      <SectionStack>
        {primaryAlert ? (
          <Banner
            tone={primaryAlert.tone}
            title={primaryAlert.title}
            subtitle={primaryAlert.subtitle}
          />
        ) : null}

        <WorkspaceSectionCard
          title="Subscription summary"
          subtitle="The clearest view of your current plan, billing state, renewal mode, and what action may be needed next."
        >
          <CardsGrid min={220}>
            <MetricCard
              label="Current Plan"
              value={planName}
              tone={active ? "good" : "warn"}
              helper={`Status: ${status}`}
            />
            <MetricCard
              label="Billing State"
              value={billingState}
              tone={
                billingState === "Active"
                  ? "good"
                  : billingState === "Pending Change"
                  ? "warn"
                  : "danger"
              }
              helper="High-level subscription state currently visible in the workspace."
            />
            <MetricCard
              label="Renewal Mode"
              value={renewalState}
              tone={active ? (autoRenew ? "good" : "warn") : "default"}
              helper="Shows whether the active subscription appears set for automatic renewal."
            />
            <MetricCard
              label="Next Action"
              value={nextAction}
              tone={!active ? "danger" : pendingPlanCode ? "warn" : "good"}
              helper="Recommended billing action based on the currently visible account state."
            />
          </CardsGrid>
        </WorkspaceSectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(300px, 0.9fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <WorkspaceSectionCard
            title="Subscription timeline"
            subtitle="Review the dates and scheduled changes that shape your visible subscription lifecycle."
          >
            <CardsGrid min={220}>
              <MetricCard
                label="Started"
                value={startsAt ? formatDate(startsAt) : "Not currently available"}
                helper="Start date currently visible for this subscription."
              />
              <MetricCard
                label="Expires"
                value={expiresAt ? formatDate(expiresAt) : "Not currently available"}
                helper="Expiry date currently visible in the workspace."
              />
              <MetricCard
                label="Pending Plan"
                value={pendingPlanCode || "No pending plan change"}
                tone={pendingPlanCode ? "warn" : "default"}
                helper={
                  pendingPlanCode
                    ? `Starts: ${pendingStartsAt ? formatDate(pendingStartsAt) : "Not currently available"}`
                    : "No pending plan change is currently visible."
                }
              />
              <MetricCard
                label="Plan Code"
                value={planCode}
                helper="Useful when matching workspace plan state with billing-side logic."
              />
            </CardsGrid>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Payment details"
            subtitle="A short operational view of the payment details that matter for review, support, or reconciliation."
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div style={snapshotItemStyle()}>
                <div style={infoTextStyle()}>Billing Email</div>
                <div style={valueTextStyle()}>{checkoutEmail}</div>
              </div>

              <div style={snapshotItemStyle()}>
                <div style={infoTextStyle()}>Payment Method</div>
                <div style={valueTextStyle()}>{paymentMethod || "Not currently available"}</div>
              </div>

              <div style={snapshotItemStyle()}>
                <div style={infoTextStyle()}>Last Payment Reference</div>
                <div style={valueTextStyle()}>{lastPaymentRef || "Not currently available"}</div>
              </div>

              <div style={snapshotItemStyle()}>
                <div style={infoTextStyle()}>Account Active</div>
                <div style={valueTextStyle()}>{active ? "Yes" : "No"}</div>
              </div>
            </div>
          </WorkspaceSectionCard>
        </div>

        <WorkspaceSectionCard
          title="Payment history"
          subtitle="Review your visible billing records, references, amounts, and status without leaving the billing workspace."
        >
          <CardsGrid min={220}>
            <MetricCard
              label="Visible Payments"
              value={String(historyCount)}
              tone={historyCount > 0 ? "good" : "default"}
              helper="Number of payment records currently visible for this account."
            />
            <MetricCard
              label="Latest Payment Date"
              value={latestPaymentDate ? formatDate(latestPaymentDate) : "Not currently available"}
              helper="Most recent payment date currently visible in billing history."
            />
            <MetricCard
              label="Latest Reference"
              value={lastPaymentRef || "Not currently available"}
              helper="Useful when matching support messages or Paystack confirmations."
            />
          </CardsGrid>

          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            {historyBusy ? (
              <Banner
                tone="default"
                title="Loading billing history"
                subtitle="Recent payment records are being loaded now."
              />
            ) : historyError ? (
              <Banner
                tone="warn"
                title="Billing history unavailable"
                subtitle={historyError}
              />
            ) : historyRows.length === 0 ? (
              <Banner
                tone="default"
                title="No billing history visible yet"
                subtitle="When payment records are available for this account, they will appear here."
              />
            ) : (
              historyRows.map((row, index) => (
                <div
                  key={`${row.reference || "payment"}-${index}`}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    background: "var(--surface)",
                    padding: 16,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 900, fontSize: 17, color: "var(--text)" }}>
                        {row.plan_name || row.plan_code || "Payment Record"}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
                        {paymentEventLabel(row.event_type || "")}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 999,
                        border: "1px solid var(--border)",
                        padding: "8px 12px",
                        fontWeight: 800,
                        fontSize: 13,
                        background:
                          paymentTone(String(row.status || "")) === "good"
                            ? "var(--success-bg)"
                            : paymentTone(String(row.status || "")) === "warn"
                            ? "var(--warn-bg)"
                            : paymentTone(String(row.status || "")) === "danger"
                            ? "var(--danger-bg)"
                            : "var(--surface-muted)",
                      }}
                    >
                      {paymentLabel(String(row.status || ""))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div style={snapshotItemStyle()}>
                      <div style={infoTextStyle()}>Amount</div>
                      <div style={valueTextStyle()}>
                        {formatCurrency(Number(row.amount_ngn || 0), String(row.currency || "NGN"))}
                      </div>
                    </div>

                    <div style={snapshotItemStyle()}>
                      <div style={infoTextStyle()}>Reference</div>
                      <div style={valueTextStyle()}>{row.reference || "Not currently available"}</div>
                    </div>

                    <div style={snapshotItemStyle()}>
                      <div style={infoTextStyle()}>Payment Date</div>
                      <div style={valueTextStyle()}>
                        {row.paid_at ? formatDate(row.paid_at) : row.created_at ? formatDate(row.created_at) : "Not currently available"}
                      </div>
                    </div>

                    <div style={snapshotItemStyle()}>
                      <div style={infoTextStyle()}>Method</div>
                      <div style={valueTextStyle()}>{paymentMethodLabel(row.payment_method || "")}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div style={snapshotItemStyle()}>
                      <div style={infoTextStyle()}>Channel</div>
                      <div style={valueTextStyle()}>
                        {paymentMethodLabel(row.channel_type || row.source || "")}
                      </div>
                    </div>

                    <div style={snapshotItemStyle()}>
                      <div style={infoTextStyle()}>Gateway Note</div>
                      <div style={valueTextStyle()}>
                        {safeText(row.gateway_response || "No additional gateway note")}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Credits and usage"
          subtitle="Credits and daily usage can explain why access feels limited even when payment looks valid."
        >
          <CardsGrid min={220}>
            <MetricCard
              label="Credits"
              value={String(creditBalance)}
              tone={creditBalance > 0 ? "good" : "warn"}
              helper="Visible AI credit balance currently available in the workspace."
            />
            <MetricCard
              label="Credits Updated"
              value={creditUpdatedAt ? formatDate(creditUpdatedAt) : "Not currently available"}
              helper="Useful when checking whether payment or credit updates have already landed."
            />
            <MetricCard
              label="Usage Today"
              value={usageToday || "Not currently available"}
              helper="Daily visible usage can help explain why access may feel restricted."
            />
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Recommended next actions"
          subtitle="Use these routes to continue billing review or escalate correctly."
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button onClick={() => router.push("/plans")} style={shellButtonPrimary()}>
              Open Plans
            </button>
            <button onClick={() => router.push("/credits")} style={shellButtonSecondary()}>
              Open Credits
            </button>
            <button onClick={() => router.push("/support")} style={shellButtonSecondary()}>
              Open Support
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Before raising a billing complaint"
          subtitle="These are the most useful checks before opening a support request."
        >
          <div
            style={{
              display: "grid",
              gap: 18,
              color: "var(--text)",
              fontSize: 16,
              lineHeight: 1.9,
            }}
          >
            <ul
              style={{
                margin: 0,
                paddingLeft: 22,
                display: "grid",
                gap: 12,
                lineHeight: 1.8,
              }}
            >
              <li>Confirm the selected plan is the one you intended to activate.</li>
              <li>Check whether payment is successful, failed, or still pending before retrying.</li>
              <li>Match the payment reference with the visible billing history before contacting support.</li>
              <li>Use Support if the visible billing result remains inconsistent after a reasonable wait.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
