"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import {
  Banner,
  MetricCard,
  formatCurrency,
  formatDate,
  toneSurface,
} from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { buildWorkspaceAlerts } from "@/lib/workspace-alerts";
import { useAuth } from "@/lib/auth";
import { apiJson, isApiError } from "@/lib/api";

type BillingCycle = "monthly" | "quarterly" | "yearly";

type BasePlan = {
  code: string;
  name: string;
  audience: string;
  description: string;
  monthly_price_ngn: number;
  monthly_credits: number;
  support_level: string;
  recommended?: boolean;
};

type DisplayPlan = {
  code: string;
  base_code: string;
  cycle: BillingCycle;
  name: string;
  audience: string;
  description: string;
  price_ngn: number;
  credits_included: number;
  support_level: string;
  recommended?: boolean;
  cycle_label: string;
  savings_note: string;
};

type ChangePlanResp = {
  ok?: boolean;
  action?: string;
  message?: string;
  authorization_url?: string;
  access_code?: string;
  reference?: string;
  error?: string;
  root_cause?: string;
  details?: any;
  fix?: string;
  target_plan?: any;
  subscription?: any;
  subscription_summary?: any;
};

const BASE_PLANS: BasePlan[] = [
  {
    code: "starter",
    name: "Starter",
    audience: "Best for individuals, salary earners, and first-time users.",
    description:
      "Simple AI-guided tax help for lighter personal tax questions and early-stage users.",
    monthly_price_ngn: 5000,
    monthly_credits: 100,
    support_level: "Standard support",
  },
  {
    code: "professional",
    name: "Professional",
    audience: "Best for freelancers, consultants, creators, and SMEs.",
    description:
      "Stronger monthly usage capacity for users who need more regular tax guidance and compliance support.",
    monthly_price_ngn: 12000,
    monthly_credits: 300,
    support_level: "Priority support",
    recommended: true,
  },
  {
    code: "business",
    name: "Business",
    audience: "Best for heavier usage, business support, and ongoing tax guidance needs.",
    description:
      "Higher usage capacity and stronger support for businesses or users who expect more continuous activity.",
    monthly_price_ngn: 25000,
    monthly_credits: 800,
    support_level: "Priority support + account review",
  },
];

const CYCLE_META: Record<
  BillingCycle,
  {
    label: string;
    months: number;
    multiplier: number;
    savings_note: string;
  }
> = {
  monthly: {
    label: "Monthly",
    months: 1,
    multiplier: 1,
    savings_note: "Flexible monthly billing.",
  },
  quarterly: {
    label: "Quarterly",
    months: 3,
    multiplier: 2.8,
    savings_note: "Lower effective price than monthly.",
  },
  yearly: {
    label: "Yearly",
    months: 12,
    multiplier: 10.2,
    savings_note: "Best value for longer-term use.",
  },
};

function safeText(value: unknown, fallback = "—"): string {
  if (typeof value === "string") {
    const clean = value.trim();
    return clean || fallback;
  }
  if (value == null) return fallback;
  const clean = String(value).trim();
  return clean || fallback;
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

function planCardStyle(active: boolean, recommended: boolean): React.CSSProperties {
  return {
    borderRadius: 22,
    border: active
      ? "1px solid var(--accent-border)"
      : recommended
      ? "1px solid var(--gold)"
      : "1px solid var(--border)",
    background: active ? "var(--accent-soft)" : "var(--surface)",
    padding: 20,
    display: "grid",
    gap: 14,
  };
}

function cycleButtonStyle(active: boolean): React.CSSProperties {
  return active ? shellButtonPrimary() : shellButtonSecondary();
}

function summaryBoxStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 16,
    display: "grid",
    gap: 6,
  };
}

function buildDisplayPlans(cycle: BillingCycle): DisplayPlan[] {
  const meta = CYCLE_META[cycle];

  return BASE_PLANS.map((plan) => ({
    code: `${plan.code}_${cycle}`,
    base_code: plan.code,
    cycle,
    name: `${plan.name} ${meta.label}`,
    audience: plan.audience,
    description: plan.description,
    price_ngn: Math.round(plan.monthly_price_ngn * meta.multiplier),
    credits_included: plan.monthly_credits * meta.months,
    support_level: plan.support_level,
    recommended: plan.recommended,
    cycle_label: meta.label,
    savings_note: meta.savings_note,
  }));
}

function normalizePlanHint(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export default function PlansPage() {
  const router = useRouter();
  const { hasSession } = useAuth();

  const {
    profile,
    usage,
    subscription,
    channelLinks,
    billing,
    credits,
    refreshAll,
  } = useWorkspaceState();

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
        /plan|billing|subscription/i.test(alert.title) ||
        /plan|billing|subscription/i.test(alert.subtitle)
    ) || allAlerts[0] || null;

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [processing, setProcessing] = useState(false);

  const currentPlanCode = safeText(subscription?.plan_code || billing?.plan_code || "", "");
  const currentPlanName = safeText(
    subscription?.plan_name || billing?.plan_name || "No active plan"
  );
  const currentStatus = safeText(subscription?.status || billing?.status || "Unknown");
  const expiresAt = safeText(subscription?.expires_at || billing?.expires_at || "", "");
  const pendingPlanCode = safeText(
    subscription?.pending_plan_code || billing?.pending_plan_code || "",
    ""
  );
  const pendingStartsAt = safeText(
    subscription?.pending_starts_at || billing?.pending_starts_at || "",
    ""
  );
  const activeNow = truthyValue(
    subscription?.active || billing?.active || currentStatus.toLowerCase() === "active"
  );
  const creditBalance = Number(credits?.balance ?? 0);

  const displayPlans = useMemo(() => buildDisplayPlans(billingCycle), [billingCycle]);

  useEffect(() => {
    if (!selectedPlanCode) {
      setSelectedPlanCode(displayPlans[1]?.code || displayPlans[0]?.code || "");
      return;
    }

    const stillExists = displayPlans.some((plan) => plan.code === selectedPlanCode);
    if (!stillExists) {
      setSelectedPlanCode(displayPlans[1]?.code || displayPlans[0]?.code || "");
    }
  }, [displayPlans, selectedPlanCode]);

  const selectedPlan = useMemo(
    () => displayPlans.find((plan) => plan.code === selectedPlanCode) || displayPlans[0],
    [displayPlans, selectedPlanCode]
  );

  const currentPlanHint = normalizePlanHint(currentPlanCode || currentPlanName);
  const pendingPlanHint = normalizePlanHint(pendingPlanCode);

  async function handleProceed() {
    if (!selectedPlan) return;

    if (!hasSession) {
      setCheckoutError("Please log in before starting plan checkout.");
      setCheckoutMessage("");
      router.push("/login?next=/plans");
      return;
    }

    setProcessing(true);
    setCheckoutMessage("");
    setCheckoutError("");

    try {
      const data = await apiJson<ChangePlanResp>("/billing/change-plan", {
        method: "POST",
        timeoutMs: 30000,
        body: {
          plan_code: selectedPlan.code,
        },
      });

      if (!data?.ok) {
        setCheckoutError(data?.message || data?.error || "We could not prepare the selected plan right now.");
        return;
      }

      if (data.action === "checkout_started" && data.authorization_url) {
        setCheckoutMessage(`Redirecting to secure checkout for ${selectedPlan.name}...`);
        window.location.href = data.authorization_url;
        return;
      }

      if (data.action === "downgrade_scheduled") {
        setCheckoutMessage(
          data.message ||
            `Your change to ${selectedPlan.name} has been scheduled for the end of the current billing period.`
        );
        await refreshAll();
        return;
      }

      setCheckoutMessage(
        data.message ||
          `Selected ${selectedPlan.name}. The billing system accepted the request.`
      );
      await refreshAll();
    } catch (err: any) {
      if (isApiError(err)) {
        const apiMessage =
          err.data?.message ||
          err.data?.root_cause ||
          err.data?.fix ||
          err.data?.error ||
          `Request failed (${err.status})`;

        setCheckoutError(String(apiMessage));
      } else {
        setCheckoutError(String(err?.message || "We could not prepare the selected plan right now."));
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AppShell
      title="Plans"
      subtitle="Choose the subscription plan that best matches your expected usage, included AI credits, and support level."
      actions={
        <>
          <button onClick={() => refreshAll()} style={shellButtonPrimary()}>
            Refresh Plans
          </button>
          <button onClick={() => router.push("/billing")} style={shellButtonSecondary()}>
            Open Billing
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
          title="Current subscription"
          subtitle="Review the visible plan already attached to your workspace before switching or preparing another one."
        >
          <CardsGrid min={220}>
            <MetricCard
              label="Current Plan"
              value={currentPlanName}
              tone={activeNow ? "good" : "warn"}
              helper={`Status: ${currentStatus}`}
            />
            <MetricCard
              label="Plan Code"
              value={currentPlanCode || "Not currently available"}
              helper="Internal plan code currently attached to the visible account state."
            />
            <MetricCard
              label="Expires"
              value={expiresAt ? formatDate(expiresAt) : "Not currently available"}
              helper="Current visible expiry date if one exists."
            />
            <MetricCard
              label="Pending Change"
              value={pendingPlanCode || "No pending change"}
              tone={pendingPlanCode ? "warn" : "default"}
              helper={
                pendingPlanCode
                  ? `Starts: ${pendingStartsAt ? formatDate(pendingStartsAt) : "Not currently available"}`
                  : "No scheduled plan transition is currently visible."
              }
            />
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Choose billing cycle"
          subtitle="Switch between monthly, quarterly, and yearly plan views before selecting a plan."
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setBillingCycle("monthly");
                setCheckoutMessage("");
                setCheckoutError("");
              }}
              style={cycleButtonStyle(billingCycle === "monthly")}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                setBillingCycle("quarterly");
                setCheckoutMessage("");
                setCheckoutError("");
              }}
              style={cycleButtonStyle(billingCycle === "quarterly")}
            >
              Quarterly
            </button>
            <button
              onClick={() => {
                setBillingCycle("yearly");
                setCheckoutMessage("");
                setCheckoutError("");
              }}
              style={cycleButtonStyle(billingCycle === "yearly")}
            >
              Yearly
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Available plans"
          subtitle="Compare plan tiers, included AI credits, support level, and savings by billing cycle."
        >
          <CardsGrid min={300}>
            {displayPlans.map((plan) => {
              const isSelected = selectedPlanCode === plan.code;
              const planHint = normalizePlanHint(`${plan.base_code} ${plan.name}`);
              const isCurrent =
                !!currentPlanHint &&
                (currentPlanHint.includes(plan.base_code) || planHint.includes(currentPlanHint));
              const isPending =
                !!pendingPlanHint &&
                (pendingPlanHint.includes(plan.base_code) || planHint.includes(pendingPlanHint));

              return (
                <div key={plan.code} style={planCardStyle(isSelected, !!plan.recommended)}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900 }}>{plan.name}</div>
                      <div
                        style={{
                          marginTop: 6,
                          color: "var(--text-muted)",
                          lineHeight: 1.7,
                        }}
                      >
                        {plan.audience}
                      </div>
                    </div>

                    {plan.recommended ? (
                      <div
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: "var(--gold-soft)",
                          color: "var(--gold)",
                          fontWeight: 900,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Recommended
                      </div>
                    ) : null}
                  </div>

                  <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                    {plan.description}
                  </div>

                  <div style={toneSurface("default")}>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Price</div>
                    <div style={{ fontSize: 28, fontWeight: 950, marginTop: 4 }}>
                      {formatCurrency(plan.price_ngn, "NGN")}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                      {plan.cycle_label}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      color: "var(--text-soft)",
                      lineHeight: 1.7,
                      fontSize: 14,
                    }}
                  >
                    <div>Included AI credits: {plan.credits_included}</div>
                    <div>Support level: {plan.support_level}</div>
                    <div>{plan.savings_note}</div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedPlanCode(plan.code);
                        setCheckoutMessage("");
                        setCheckoutError("");
                      }}
                      style={shellButtonPrimary()}
                    >
                      {isSelected ? "Selected" : "Choose Plan"}
                    </button>

                    {isCurrent ? (
                      <button style={shellButtonSecondary()} disabled>
                        Current Plan
                      </button>
                    ) : null}

                    {isPending ? (
                      <button style={shellButtonSecondary()} disabled>
                        Pending Change
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardsGrid>
        </WorkspaceSectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.9fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <WorkspaceSectionCard
            title="Selected plan summary"
            subtitle="This is the plan currently chosen inside the interface before checkout or activation."
          >
            <CardsGrid min={220}>
              <MetricCard
                label="Selected Plan"
                value={selectedPlan.name}
                tone="good"
                helper="Currently highlighted plan in this page."
              />
              <MetricCard
                label="Price"
                value={formatCurrency(selectedPlan.price_ngn, "NGN")}
                helper={selectedPlan.cycle_label}
              />
              <MetricCard
                label="Included AI Credits"
                value={String(selectedPlan.credits_included)}
                helper="Included AI credits attached to this selected billing cycle."
              />
              <MetricCard
                label="Support Level"
                value={selectedPlan.support_level}
                helper="Visible support level for the selected plan."
              />
            </CardsGrid>

            <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={handleProceed}
                disabled={processing || !selectedPlan || normalizePlanHint(currentPlanCode) === normalizePlanHint(selectedPlan.code)}
                style={{
                  ...shellButtonPrimary(),
                  opacity:
                    processing || !selectedPlan || normalizePlanHint(currentPlanCode) === normalizePlanHint(selectedPlan.code)
                      ? 0.7
                      : 1,
                  cursor:
                    processing || !selectedPlan || normalizePlanHint(currentPlanCode) === normalizePlanHint(selectedPlan.code)
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {processing ? "Preparing..." : "Proceed with Selected Plan"}
              </button>

              <button
                onClick={() => router.push("/billing")}
                style={shellButtonSecondary()}
              >
                Review Billing First
              </button>
            </div>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Selection status"
            subtitle="The latest visible result after choosing a plan appears here."
          >
            <div style={{ display: "grid", gap: 12 }}>
              {checkoutMessage ? (
                <Banner tone="good" title="Plan ready" subtitle={checkoutMessage} />
              ) : null}

              {checkoutError ? (
                <Banner tone="danger" title="Plan issue" subtitle={checkoutError} />
              ) : null}

              {!checkoutMessage && !checkoutError ? (
                <div style={summaryBoxStyle()}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>
                    Current Selection
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>
                    {selectedPlan.name}
                  </div>
                  <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                    Select a plan and continue when you are ready to connect the billing flow.
                  </div>
                </div>
              ) : null}

              <div style={summaryBoxStyle()}>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>
                  Visible Credits
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>
                  {creditBalance}
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Compare your current visible credits with the included credits in the plan you want to choose.
                </div>
              </div>
            </div>
          </WorkspaceSectionCard>
        </div>

        <WorkspaceSectionCard
          title="Before changing plans"
          subtitle="These checks help reduce confusion before activation, renewal, or upgrade."
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
              <li>Review your current active plan before selecting another one.</li>
              <li>Check whether a pending plan change is already scheduled.</li>
              <li>Compare included AI credits against your likely monthly or business usage.</li>
              <li>Use Billing or Support if the visible plan state does not match what you expect.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}