"use client";

import React, { useMemo, useState } from "react";
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
} from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { buildWorkspaceAlerts } from "@/lib/workspace-alerts";
import { useAuth } from "@/lib/auth";
import { apiJson, isApiError } from "@/lib/api";

type BillingCycle = "monthly" | "quarterly" | "yearly";
type Tier = "starter" | "professional" | "business";

type DisplayPlan = {
  code: string;
  tier: Tier;
  cycle: BillingCycle;
  name: string;
  audience: string;
  description: string;
  price: number;
  credits: number;
  support_level: string;
  recommended?: boolean;
};

const PLANS: DisplayPlan[] = [
  {
    code: "starter_monthly",
    tier: "starter",
    cycle: "monthly",
    name: "Starter Monthly",
    audience: "Best for individuals and first-time users.",
    description: "Basic AI tax guidance.",
    price: 5000,
    credits: 100,
    support_level: "Standard support",
  },
  {
    code: "professional_monthly",
    tier: "professional",
    cycle: "monthly",
    name: "Professional Monthly",
    audience: "Freelancers and SMEs.",
    description: "Higher usage and priority support.",
    price: 12000,
    credits: 300,
    support_level: "Priority support",
    recommended: true,
  },
  {
    code: "business_monthly",
    tier: "business",
    cycle: "monthly",
    name: "Business Monthly",
    audience: "Heavy usage and businesses.",
    description: "Maximum usage and account review.",
    price: 25000,
    credits: 800,
    support_level: "Priority + account review",
  },
];

function safeText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim() || fallback;
  if (value == null) return fallback;
  return String(value).trim() || fallback;
}

function planCardStyle(active: boolean, recommended: boolean) {
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
  } as React.CSSProperties;
}

export default function PlansPage() {
  const router = useRouter();
  const { hasSession } = useAuth();

  const { subscription, billing, credits, refreshAll } =
    useWorkspaceState();

  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("monthly");

  const currentPlanCode = safeText(
    subscription?.plan_code || billing?.plan_code || ""
  );

  // ✅ FIXED LOGIC
  const isFreePlanActive = !currentPlanCode;

  const plansForCycle = useMemo(
    () => PLANS.filter((p) => p.cycle === billingCycle),
    [billingCycle]
  );

  async function handleChoosePlan(planCode: string) {
    if (!hasSession) {
      router.push("/login?next=/plans");
      return;
    }

    try {
      const res = await apiJson("/billing/change-plan", {
        method: "POST",
        body: JSON.stringify({ plan_code: planCode }),
      });

      if (res?.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        await refreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppShell
      title="Plans"
      subtitle="Choose the subscription plan that fits your needs."
      actions={
        <>
          <button onClick={refreshAll} style={shellButtonPrimary()}>
            Refresh
          </button>
          <button
            onClick={() => router.push("/billing")}
            style={shellButtonSecondary()}
          >
            Billing
          </button>
        </>
      }
    >
      <SectionStack>
        <WorkspaceSectionCard title="Billing Cycle">
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setBillingCycle("monthly")}>
              Monthly
            </button>
            <button onClick={() => setBillingCycle("quarterly")}>
              Quarterly
            </button>
            <button onClick={() => setBillingCycle("yearly")}>
              Yearly
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Available Plans">
          <CardsGrid min={250}>
            {/* ✅ FREE PLAN */}
            <div style={planCardStyle(isFreePlanActive, false)}>
              <div>
                <h3>Free Forever</h3>
                <p>
                  Best for individuals who need basic tax answers
                  without AI.
                </p>
              </div>

              {isFreePlanActive && (
                <span>Current Plan</span>
              )}

              <p>
                Unlimited database answers. No AI credits.
              </p>

              <div>
                <strong>₦0</strong>
                <div>Always available</div>
              </div>

              <div>
                <div>AI Credits: 0</div>
                <div>Support: Standard</div>
              </div>

              <button disabled style={shellButtonSecondary()}>
                {isFreePlanActive ? "Active" : "Default"}
              </button>
            </div>

            {/* ✅ PAID PLANS */}
            {plansForCycle.map((plan) => {
              const isCurrent = currentPlanCode === plan.code;

              return (
                <div
                  key={plan.code}
                  style={planCardStyle(
                    isCurrent,
                    !!plan.recommended
                  )}
                >
                  <h3>{plan.name}</h3>
                  <p>{plan.audience}</p>

                  {isCurrent && <span>Current</span>}

                  <p>{plan.description}</p>

                  <div>
                    <strong>
                      {formatCurrency(plan.price, "NGN")}
                    </strong>
                  </div>

                  <div>
                    <div>Credits: {plan.credits}</div>
                    <div>{plan.support_level}</div>
                  </div>

                  <button
                    disabled={isCurrent}
                    onClick={() =>
                      handleChoosePlan(plan.code)
                    }
                    style={shellButtonPrimary()}
                  >
                    {isCurrent ? "Current Plan" : "Upgrade"}
                  </button>
                </div>
              );
            })}
          </CardsGrid>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
