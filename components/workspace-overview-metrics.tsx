"use client";

import React from "react";
import { MetricCard, formatDate, planDisplayName } from "@/components/ui";
import { MetricsGrid } from "@/components/page-layout";

type WorkspaceOverviewMetricsProps = {
  accountId?: string;
  email?: string;
  activeNow?: boolean;
  planCode?: string;
  creditBalance?: number;
  dailyUsage?: number;
  dailyLimit?: number;
  expiresAt?: string | null;
  checkoutEmail?: string | null;
  pendingPlanCode?: string | null;
  currentPeriodEnd?: string | null;
  mode?:
    | "core"
    | "dashboard"
    | "billing"
    | "credits"
    | "plans"
    | "support"
    | "settings"
    | "welcome";
};

export default function WorkspaceOverviewMetrics({
  accountId = "—",
  email,
  activeNow = false,
  planCode = "",
  creditBalance = 0,
  dailyUsage = 0,
  dailyLimit = 0,
  expiresAt = null,
  checkoutEmail,
  pendingPlanCode,
  currentPeriodEnd,
  mode = "core",
}: WorkspaceOverviewMetricsProps) {
  const usageValue = dailyLimit > 0 ? `${dailyUsage} / ${dailyLimit}` : String(dailyUsage);
  const usageHelper =
    dailyLimit > 0
      ? `${Math.max(dailyLimit - dailyUsage, 0)} question(s) left today.`
      : "No daily limit detected.";

  const sharedCards = (
    <>
      <MetricCard
        label="Account ID"
        value={String(accountId)}
        helper="Your authenticated workspace reference."
      />
      <MetricCard
        label="Subscription"
        value={activeNow ? "Active" : "Inactive"}
        tone={activeNow ? "good" : "warn"}
        helper={activeNow ? "Paid access is currently active." : "Subscription action may be needed."}
      />
      <MetricCard
        label="Plan"
        value={planDisplayName(planCode)}
        tone={planCode ? "good" : "warn"}
        helper="Current visible plan on your account."
      />
      <MetricCard
        label="Credits Left"
        value={String(creditBalance)}
        tone={creditBalance <= 0 ? "danger" : creditBalance <= 3 ? "warn" : "good"}
        helper={creditBalance > 0 ? "Available AI credits remaining." : "Top-up or plan action may be needed."}
      />
      <MetricCard
        label="Daily Usage"
        value={usageValue}
        tone={dailyLimit > 0 && dailyUsage >= dailyLimit ? "warn" : "good"}
        helper={usageHelper}
      />
      <MetricCard
        label="Expires At"
        value={formatDate(expiresAt)}
        tone={expiresAt ? "default" : "warn"}
        helper="Current paid access expiry time."
      />
    </>
  );

  if (mode === "dashboard" || mode === "core" || mode === "credits" || mode === "support") {
    return <MetricsGrid>{sharedCards}</MetricsGrid>;
  }

  if (mode === "billing") {
    return (
      <MetricsGrid>
        {sharedCards}
      </MetricsGrid>
    );
  }

  if (mode === "plans") {
    return (
      <MetricsGrid>
        <MetricCard
          label="Current Plan"
          value={planDisplayName(planCode)}
          tone={planCode ? "good" : "warn"}
          helper="Current visible plan on your account."
        />
        <MetricCard
          label="Subscription"
          value={activeNow ? "Active" : "Inactive"}
          tone={activeNow ? "good" : "warn"}
          helper="Current access state."
        />
        <MetricCard
          label="Pending Change"
          value={pendingPlanCode ? planDisplayName(pendingPlanCode) : "None"}
          tone={pendingPlanCode ? "warn" : "good"}
          helper="Any already scheduled next plan."
        />
        <MetricCard
          label="Checkout Email"
          value={String(checkoutEmail || "Missing")}
          tone={checkoutEmail ? "good" : "warn"}
          helper="Billing email currently visible to the account."
        />
        <MetricCard
          label="Current Period End"
          value={formatDate(currentPeriodEnd)}
          tone={currentPeriodEnd ? "default" : "warn"}
          helper="Visible current billing period end."
        />
        <MetricCard
          label="Expiry"
          value={formatDate(expiresAt)}
          tone={expiresAt ? "default" : "warn"}
          helper="Current access expiry time."
        />
      </MetricsGrid>
    );
  }

  if (mode === "settings" || mode === "welcome") {
    return (
      <MetricsGrid>
        <MetricCard
          label="Account ID"
          value={String(accountId)}
          helper="Your authenticated workspace reference."
        />
        <MetricCard
          label="Email"
          value={String(email || "—")}
          helper="Primary email currently visible to your workspace."
        />
        <MetricCard
          label="Subscription"
          value={activeNow ? "Active" : "Inactive"}
          tone={activeNow ? "good" : "warn"}
          helper={activeNow ? "Paid access is currently active." : "Subscription action may be needed."}
        />
        <MetricCard
          label="Plan"
          value={planDisplayName(planCode)}
          tone={planCode ? "good" : "warn"}
          helper="Current visible plan on your account."
        />
        <MetricCard
          label="Credits Left"
          value={String(creditBalance)}
          tone={creditBalance <= 0 ? "danger" : creditBalance <= 3 ? "warn" : "good"}
          helper={creditBalance > 0 ? "Available AI credits remaining." : "Top-up or plan action may be needed."}
        />
        <MetricCard
          label="Daily Usage"
          value={usageValue}
          tone="default"
          helper={dailyLimit > 0 ? "Current visible usage for today." : "No daily limit detected."}
        />
        <MetricCard
          label="Expires At"
          value={formatDate(expiresAt)}
          tone={expiresAt ? "default" : "warn"}
          helper="Current paid access expiry time."
        />
        {mode === "welcome" ? (
          <MetricCard
            label="Version 1 Channels"
            value="Web, WhatsApp, Telegram"
            helper="Primary launch channels for guided tax access."
          />
        ) : (
          <MetricCard
            label="Checkout Email"
            value={String(checkoutEmail || "Missing")}
            tone={checkoutEmail ? "good" : "warn"}
            helper="Billing email currently connected to the workspace."
          />
        )}
      </MetricsGrid>
    );
  }

  return <MetricsGrid>{sharedCards}</MetricsGrid>;
}