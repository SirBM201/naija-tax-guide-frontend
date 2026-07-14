"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, MetricCard, ShortcutCard, formatDate } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { buildWorkspaceAlerts } from "@/lib/workspace-alerts";

type Tone = "good" | "warn" | "danger" | "default";

type TopupPackage = {
  code: string;
  name: string;
  credits: number;
  price: number;
  bestFor: string;
  badge?: string;
};

type CreditActivity = {
  id?: string;
  created_at?: string;
  description?: string;
  action?: string;
  action_code?: string;
  channel?: string;
  credits_delta?: number | string;
  credit_delta?: number | string;
  amount?: number | string;
};

const TOPUP_PACKAGES: TopupPackage[] = [
  {
    code: "TOPUP_100",
    name: "100 Usage Credits",
    credits: 100,
    price: 200,
    bestFor: "Light AI questions, quick explanations, and small document tasks.",
  },
  {
    code: "TOPUP_300",
    name: "300 Usage Credits",
    credits: 300,
    price: 500,
    bestFor: "Regular AI guidance, filing checklists, and summaries.",
    badge: "Popular",
  },
  {
    code: "TOPUP_1000",
    name: "1,000 Usage Credits",
    credits: 1000,
    price: 1500,
    bestFor: "Heavier document work, business use, and linked-channel usage.",
    badge: "Best Value",
  },
];

const ALWAYS_FREE_TOOLS = [
  "PAYE calculator",
  "VAT calculator",
  "CIT calculator",
  "WHT calculator",
  "Basic Nigeria tax calendar view",
];

const CREDIT_COVERAGE = [
  "AI-powered tax answers",
  "Advanced tax explanations",
  "Filing guidance and checklists",
  "Document drafts and summaries",
  "Document review support",
  "Premium WhatsApp / Telegram AI usage",
];

const CREDIT_RULES = [
  "Top-ups are available only to active paid subscribers.",
  "Top-up credits add usage capacity only; they do not extend subscription validity.",
  "The final amount and available payment methods are shown inside Paystack checkout before authorization.",
  "If a debit occurs but credits do not update, use Support with the Paystack reference.",
];

function safeText(value: unknown, fallback = "—"): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
        ? ""
        : String(value).trim();
  return text || fallback;
}

function safeNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function money(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}

function creditTone(balance: number): Tone {
  if (balance <= 0) return "danger";
  if (balance <= 10) return "warn";
  return "good";
}

function creditStatus(balance: number): string {
  if (balance <= 0) return "Exhausted";
  if (balance <= 10) return "Low";
  return "Healthy";
}

function normalizePlanCode(subscription: unknown, billing: unknown): string {
  const s = subscription as Record<string, unknown> | null | undefined;
  const b = billing as Record<string, unknown> | null | undefined;
  return safeText(s?.plan_code || b?.plan_code || "free", "free").toLowerCase();
}

function normalizePlanFamily(subscription: unknown, billing: unknown): string {
  const s = subscription as Record<string, unknown> | null | undefined;
  const b = billing as Record<string, unknown> | null | undefined;
  const code = normalizePlanCode(subscription, billing);

  if (code.includes("business")) return "business";
  if (code.includes("professional")) return "professional";
  if (code.includes("starter")) return "starter";

  const directFamily = safeText(s?.plan_family || b?.plan_family || "", "").toLowerCase();
  if (directFamily.includes("business")) return "business";
  if (directFamily.includes("professional")) return "professional";
  if (directFamily.includes("starter")) return "starter";
  return "free";
}

function isActivePaidSubscription(subscription: unknown, billing: unknown): boolean {
  const s = subscription as Record<string, unknown> | null | undefined;
  const b = billing as Record<string, unknown> | null | undefined;
  const code = normalizePlanCode(subscription, billing);
  const family = normalizePlanFamily(subscription, billing);
  const status = safeText(s?.status || b?.status || "", "").toLowerCase();

  const active =
    s?.is_active === true ||
    b?.is_active === true ||
    b?.active === true ||
    status === "active";

  if (!active) return false;
  if (family === "free") return false;
  if (code === "free" || code.includes("free")) return false;
  return true;
}

function topupStatusCopy(status: string, reference: string) {
  const clean = status.trim().toLowerCase();
  if (clean === "success") {
    return {
      tone: "good" as const,
      title: "Top-up payment confirmed",
      subtitle: `Credits should be visible shortly. Reference: ${reference || "not shown"}.`,
    };
  }
  if (clean === "not_applied") {
    return {
      tone: "warn" as const,
      title: "Top-up paid, credits need review",
      subtitle: `Payment was confirmed but credits were not applied yet. Contact Support with reference ${reference || "not shown"}.`,
    };
  }
  if (clean === "verify_failed") {
    return {
      tone: "danger" as const,
      title: "Top-up verification failed",
      subtitle: `The payment could not be verified automatically. Use Support with reference ${reference || "not shown"} if money was deducted.`,
    };
  }
  if (clean === "pending") {
    return {
      tone: "warn" as const,
      title: "Top-up payment pending",
      subtitle: `Paystack has not confirmed the top-up yet. Refresh Credits before retrying. Reference: ${reference || "not shown"}.`,
    };
  }
  if (clean === "missing_reference") {
    return {
      tone: "danger" as const,
      title: "Top-up reference missing",
      subtitle: "The return URL did not include a payment reference. Open Support if money was deducted.",
    };
  }
  return null;
}

function cardStyle(tone: Tone = "default"): React.CSSProperties {
  const border =
    tone === "good"
      ? "var(--success-border)"
      : tone === "warn"
        ? "var(--warn-border)"
        : tone === "danger"
          ? "var(--danger-border)"
          : "var(--border)";

  const background =
    tone === "good"
      ? "var(--success-bg)"
      : tone === "warn"
        ? "var(--warn-bg)"
        : tone === "danger"
          ? "var(--danger-bg)"
          : "var(--surface)";

  return {
    border: `1px solid ${border}`,
    borderRadius: 22,
    background,
    padding: "clamp(14px, 3vw, 18px)",
    display: "grid",
    gap: 10,
    minWidth: 0,
  };
}

function valueStyle(size: "normal" | "large" = "normal"): React.CSSProperties {
  return {
    color: "var(--text)",
    fontWeight: 900,
    fontSize: size === "large" ? "clamp(26px, 5vw, 34px)" : "clamp(18px, 4vw, 22px)",
    lineHeight: 1.15,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };
}

const mutedTextStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  lineHeight: 1.7,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  minWidth: 0,
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

function listItemStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "12px 14px",
    background: "var(--surface)",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  };
}

function CreditsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topupStatus = useMemo(() => (searchParams?.get("topup") || "").trim(), [searchParams]);
  const returnedReference = useMemo(() => (searchParams?.get("reference") || "").trim(), [searchParams]);

  const workspaceState = useWorkspaceState();
  const {
    profile,
    usage,
    subscription,
    channelLinks,
    billing,
    credits,
    refreshAll,
  } = workspaceState;

  const usageAny = usage as Record<string, unknown> | null | undefined;
  const subscriptionAny = subscription as Record<string, unknown> | null | undefined;
  const billingAny = billing as Record<string, unknown> | null | undefined;
  const creditsAny = credits as Record<string, unknown> | null | undefined;

  const [topupLoading, setTopupLoading] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

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

  const creditAlert =
    allAlerts.find(
      (alert) =>
        /credit/i.test(alert.title) ||
        /credit/i.test(alert.subtitle) ||
        /balance/i.test(alert.title)
    ) || null;

  const balance = safeNumber(
    creditsAny?.balance ??
      creditsAny?.credit_balance ??
      creditsAny?.credits_balance ??
      billingAny?.credit_balance ??
      billingAny?.credits_balance ??
      billingAny?.usage_credits
  );

  const consumed = safeNumber(
    creditsAny?.used ??
      creditsAny?.consumed ??
      usageAny?.credits_used ??
      usageAny?.credit_usage_count
  );

  const includedByPlan = safeNumber(
    subscriptionAny?.included_credits ??
      subscriptionAny?.ai_credits_total ??
      subscriptionAny?.usage_credits ??
      billingAny?.included_credits ??
      billingAny?.ai_credits_total ??
      billingAny?.credit_balance ??
      creditsAny?.balance
  );

  const monthlyAiUsed = safeNumber(
    usageAny?.used_this_month ||
      usageAny?.monthly_used ||
      usageAny?.ai_used_month ||
      billingAny?.ai_used_month ||
      creditsAny?.used_this_month
  );

  const planName = safeText(
    subscriptionAny?.plan_name ||
      billingAny?.plan_name ||
      subscriptionAny?.plan_code ||
      billingAny?.plan_code ||
      "Free Forever"
  );

  const planStatus = safeText(subscriptionAny?.status || billingAny?.status || "Unknown");
  const planFamily = normalizePlanFamily(subscription, billing);
  const activePaid = isActivePaidSubscription(subscription, billing);

  const updatedAt = safeText(creditsAny?.updated_at || creditsAny?.last_updated_at || "", "");
  const expiresAt = safeText(subscriptionAny?.expires_at || billingAny?.expires_at || "", "");

  const usageHistory: CreditActivity[] =
    Array.isArray(creditsAny?.history)
      ? (creditsAny.history as CreditActivity[])
      : Array.isArray(creditsAny?.usage)
        ? (creditsAny.usage as CreditActivity[])
        : Array.isArray(usageAny?.credit_logs)
          ? (usageAny.credit_logs as CreditActivity[])
          : [];

  const returnBanner = topupStatusCopy(topupStatus, returnedReference);

  async function startTopup(pkg: TopupPackage) {
    setLocalError(null);
    setLocalMessage(null);

    if (!activePaid) {
      setLocalError(
        "Credit top-up is available only to active paid subscribers. Upgrade your plan before buying add-ons."
      );
      return;
    }

    setTopupLoading(pkg.code);

    try {
      const response = await fetch("/api/paystack/topup/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          package_code: pkg.code,
          topup_code: pkg.code,
          code: pkg.code,
          purpose: "usage_topup",
          credits: pkg.credits,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to start credit top-up. Please try again."
        );
      }

      const checkoutUrl =
        data?.authorization_url ||
        data?.data?.authorization_url ||
        data?.checkout_url ||
        data?.url;

      if (checkoutUrl) {
        setLocalMessage("Redirecting to Paystack checkout. Confirm the final amount before authorizing payment.");
        window.location.href = checkoutUrl;
        return;
      }

      setLocalMessage(
        data?.message ||
          "Top-up request started. If Paystack checkout does not open, please try again."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start credit top-up. Please try again.";
      setLocalError(message);
    } finally {
      setTopupLoading(null);
    }
  }

  function supportWithReference() {
    const params = new URLSearchParams();
    params.set("intent", "topup_issue");
    if (returnedReference) params.set("reference", returnedReference);
    router.push(`/support?${params.toString()}`);
  }

  return (
    <AppShell
      title="Credits & Add-ons"
      subtitle="Track Usage Credits, buy approved top-ups, and understand what remains free across web, WhatsApp, and Telegram."
      actions={
        <>
          <button onClick={() => refreshAll()} style={shellButtonPrimary()}>
            Refresh Credits
          </button>
          <button onClick={() => router.push("/plans")} style={shellButtonSecondary()}>
            Open Plans
          </button>
          <button onClick={() => router.push("/billing")} style={shellButtonSecondary()}>
            Billing
          </button>
        </>
      }
    >
      <SectionStack>
        {creditAlert ? (
          <Banner tone={creditAlert.tone} title={creditAlert.title} subtitle={creditAlert.subtitle} />
        ) : null}

        {returnBanner ? (
          <Banner tone={returnBanner.tone} title={returnBanner.title} subtitle={returnBanner.subtitle} />
        ) : null}

        {localError ? (
          <Banner tone="danger" title="Credit add-on issue" subtitle={localError} />
        ) : null}

        {localMessage ? (
          <Banner tone="good" title="Credit update" subtitle={localMessage} />
        ) : null}

        {!activePaid ? (
          <Banner
            tone="warn"
            title="Top-up requires an active paid plan"
            subtitle="Free Forever and inactive accounts cannot buy credit add-ons. Upgrade to Starter, Professional, or Business to unlock top-ups."
          />
        ) : null}

        <WorkspaceSectionCard
          title="Credit overview"
          subtitle="Usage Credits power AI answers, advanced explanations, documents, filing support, and premium channel usage. Basic calculators remain completely free."
        >
          <CardsGrid min={190} gap={16}>
            <MetricCard
              label="Available Credits"
              value={String(balance)}
              tone={creditTone(balance)}
              helper="Shared credit balance for web and linked messaging channels."
            />
            <MetricCard
              label="Credit Status"
              value={creditStatus(balance)}
              tone={creditTone(balance)}
              helper="A quick health view of your available Usage Credits."
            />
            <MetricCard
              label="AI Used This Month"
              value={String(monthlyAiUsed)}
              helper="Visible AI usage for the current month if exposed by the backend."
            />
            <MetricCard
              label="Top-up Access"
              value={activePaid ? "Enabled" : "Locked"}
              tone={activePaid ? "good" : "warn"}
              helper={activePaid ? "Available while your subscription is active." : "Requires active paid subscription."}
            />
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Buy Usage Credits"
          subtitle="These top-up packages match the approved billing API codes. Paystack confirms the final amount before authorization."
        >
          <CardsGrid min={230} gap={14}>
            {TOPUP_PACKAGES.map((pkg) => (
              <div key={pkg.code} style={cardStyle(pkg.badge ? "warn" : "default")}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={valueStyle()}>{pkg.name}</div>
                    <div style={mutedTextStyle}>{pkg.credits.toLocaleString()} credits</div>
                  </div>
                  {pkg.badge ? (
                    <span
                      style={{
                        border: "1px solid var(--warn-border)",
                        background: "var(--warn-bg)",
                        color: "var(--text)",
                        borderRadius: 999,
                        padding: "5px 10px",
                        height: "fit-content",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {pkg.badge}
                    </span>
                  ) : null}
                </div>

                <div style={cardStyle("default")}>
                  <div style={smallLabelStyle}>Price</div>
                  <div style={valueStyle("large")}>{money(pkg.price)}</div>
                  <div style={mutedTextStyle}>Code: {pkg.code}</div>
                </div>

                <div style={mutedTextStyle}>{pkg.bestFor}</div>

                <button
                  type="button"
                  onClick={() => startTopup(pkg)}
                  disabled={!activePaid || topupLoading === pkg.code}
                  style={
                    activePaid
                      ? shellButtonPrimary()
                      : {
                          border: "1px solid var(--border)",
                          borderRadius: 16,
                          background: "var(--surface-soft)",
                          color: "var(--text-muted)",
                          padding: "13px 16px",
                          fontWeight: 900,
                          cursor: "not-allowed",
                        }
                  }
                >
                  {topupLoading === pkg.code
                    ? "Starting checkout..."
                    : activePaid
                      ? "Continue to Paystack"
                      : "Upgrade Required"}
                </button>
              </div>
            ))}
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Credit snapshot"
          subtitle="A short operational summary of your current credit and subscription state."
        >
          <CardsGrid min={190} gap={14}>
            <div style={cardStyle(activePaid ? "good" : "warn")}>
              <div style={smallLabelStyle}>Current Plan</div>
              <div style={valueStyle()}>{planName}</div>
              <div style={mutedTextStyle}>Status: {planStatus}</div>
              <div style={mutedTextStyle}>Family: {planFamily}</div>
            </div>
            <div style={cardStyle()}>
              <div style={smallLabelStyle}>Included by Plan</div>
              <div style={valueStyle()}>{String(includedByPlan)}</div>
              <div style={mutedTextStyle}>Plan credits visible from the current backend state.</div>
            </div>
            <div style={cardStyle()}>
              <div style={smallLabelStyle}>Consumed Credits</div>
              <div style={valueStyle()}>{String(consumed)}</div>
              <div style={mutedTextStyle}>Already-used credits if your backend exposes that value.</div>
            </div>
            <div style={cardStyle()}>
              <div style={smallLabelStyle}>Last Credit Update</div>
              <div style={valueStyle()}>{updatedAt ? formatDate(updatedAt) : "Not shown"}</div>
            </div>
            <div style={cardStyle()}>
              <div style={smallLabelStyle}>Plan Expiry</div>
              <div style={valueStyle()}>{expiresAt ? formatDate(expiresAt) : "Not shown"}</div>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Credit rules summary"
          subtitle="The current approved policy for Usage Credits and top-ups."
        >
          <CardsGrid min={230} gap={14}>
            <div style={cardStyle("good")}>
              <div style={valueStyle()}>Free tools</div>
              <div style={mutedTextStyle}>Basic calculators remain free and do not consume Usage Credits.</div>
              <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
                {ALWAYS_FREE_TOOLS.map((tool) => (
                  <div key={tool} style={listItemStyle()}>
                    <span style={{ fontWeight: 800, color: "var(--text)", overflowWrap: "anywhere" }}>{tool}</span>
                    <span style={{ borderRadius: 999, background: "var(--success-bg)", border: "1px solid var(--success-border)", padding: "5px 10px", fontSize: 12, fontWeight: 900 }}>Free</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={cardStyle("warn")}>
              <div style={valueStyle()}>Top-up rules</div>
              <div style={{ display: "grid", gap: 10 }}>
                {CREDIT_RULES.map((rule) => (
                  <div key={rule} style={mutedTextStyle}>- {rule}</div>
                ))}
              </div>
            </div>
            <div style={cardStyle()}>
              <div style={valueStyle()}>Credits cover</div>
              <div style={{ display: "grid", gap: 10 }}>
                {CREDIT_COVERAGE.map((item) => (
                  <div key={item} style={listItemStyle()}>
                    <span style={{ fontWeight: 800, color: "var(--text)", overflowWrap: "anywhere" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Helpful actions"
          subtitle="Go directly to the page that best solves your credit situation."
        >
          <CardsGrid min={200} gap={14}>
            <ShortcutCard
              title="Ask"
              subtitle="Open the assistant and continue asking when your credits are ready."
              tone={balance > 0 ? "good" : "default"}
              onClick={() => router.push("/ask")}
            />
            <ShortcutCard
              title="Plans"
              subtitle="Review plans if you need stronger usage capacity or included credits."
              tone={balance <= 0 ? "warn" : "default"}
              onClick={() => router.push("/plans")}
            />
            <ShortcutCard
              title="Billing"
              subtitle="Check whether the real issue is payment or subscription visibility."
              tone="default"
              onClick={() => router.push("/billing")}
            />
            <ShortcutCard
              title="Support"
              subtitle="Get help if payment or credit state does not match what you expect."
              tone="danger"
              onClick={supportWithReference}
            />
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Recent credit activity"
          subtitle="A transparent record of credit deductions and top-ups where backend usage logging is available."
        >
          {usageHistory.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              {usageHistory.slice(0, 8).map((item, index) => {
                const delta = safeNumber(item.credits_delta ?? item.credit_delta ?? item.amount);

                return (
                  <div key={item.id || index} style={cardStyle()}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, color: "var(--text)", overflowWrap: "anywhere" }}>
                          {safeText(item.description || item.action || item.action_code, "Credit activity")}
                        </div>
                        <div style={mutedTextStyle}>
                          {safeText(item.channel, "web")} • {item.created_at ? formatDate(item.created_at) : "Date not shown"}
                        </div>
                      </div>
                      <div style={valueStyle()}>{delta > 0 ? `+${delta}` : String(delta)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={cardStyle()}>
              <div style={mutedTextStyle}>
                No credit activity is available yet. Top-ups, AI answers, document actions, and filing guidance will appear here when backend usage logging exposes them.
              </div>
            </div>
          )}
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}

function CreditsFallback() {
  return (
    <AppShell title="Credits & Add-ons" subtitle="Preparing credit workspace.">
      <SectionStack>
        <Banner tone="default" title="Preparing Credits" subtitle="Your credit workspace is loading." />
      </SectionStack>
    </AppShell>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<CreditsFallback />}>
      <CreditsPageContent />
    </Suspense>
  );
}
