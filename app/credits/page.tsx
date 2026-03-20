"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, MetricCard, ShortcutCard, formatDate } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { buildWorkspaceAlerts } from "@/lib/workspace-alerts";

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

function creditTone(balance: number): "good" | "warn" | "danger" {
  if (balance <= 0) return "danger";
  if (balance <= 3) return "warn";
  return "good";
}

function creditStatus(balance: number) {
  if (balance <= 0) return "Exhausted";
  if (balance <= 3) return "Low";
  return "Healthy";
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

export default function CreditsPage() {
  const router = useRouter();

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

  const creditAlert =
    allAlerts.find(
      (alert) =>
        /credit/i.test(alert.title) ||
        /credit/i.test(alert.subtitle) ||
        /balance/i.test(alert.title)
    ) || allAlerts[0] || null;

  const balance = safeNumber(credits?.balance);
  const consumed = safeNumber(credits?.used ?? credits?.consumed);
  const includedByPlan = safeNumber(
    subscription?.included_credits ?? billing?.included_credits
  );
  const monthlyAiUsed = safeNumber(
    usage?.used_this_month ||
      usage?.monthly_used ||
      usage?.ai_used_month ||
      billing?.ai_used_month ||
      credits?.used_this_month
  );

  const planName = safeText(
    subscription?.plan_name ||
      billing?.plan_name ||
      subscription?.plan_code ||
      billing?.plan_code ||
      "No active plan"
  );

  const planStatus = safeText(subscription?.status || billing?.status || "Unknown");
  const updatedAt = safeText(credits?.updated_at || credits?.last_updated_at || "", "");
  const expiresAt = safeText(subscription?.expires_at || billing?.expires_at || "", "");

  const nextAction =
    balance <= 0
      ? "Open Plans"
      : balance <= 3
      ? "Use carefully"
      : "Ask a Question";

  return (
    <AppShell
      title="Credits"
      subtitle="Track your available AI credit balance and monthly AI usage without exposing unnecessary technical details."
      actions={
        <>
          <button onClick={() => refreshAll()} style={shellButtonPrimary()}>
            Refresh Credits
          </button>
          <button onClick={() => router.push("/plans")} style={shellButtonSecondary()}>
            Open Plans
          </button>
          <button onClick={() => router.push("/ask")} style={shellButtonSecondary()}>
            Ask
          </button>
        </>
      }
    >
      <SectionStack>
        {creditAlert ? (
          <Banner
            tone={creditAlert.tone}
            title={creditAlert.title}
            subtitle={creditAlert.subtitle}
          />
        ) : null}

        <WorkspaceSectionCard
          title="Credit overview"
          subtitle="This page is focused only on the credit position that matters to the user."
        >
          <CardsGrid min={220}>
            <MetricCard
              label="Available Credits"
              value={String(balance)}
              tone={creditTone(balance)}
              helper="Visible AI credits currently attached to your workspace."
            />
            <MetricCard
              label="Credit Status"
              value={creditStatus(balance)}
              tone={creditTone(balance)}
              helper="A simple health view of your current visible credit balance."
            />
            <MetricCard
              label="AI Used This Month"
              value={String(monthlyAiUsed)}
              helper="Total AI usage recorded for the current month if available."
            />
            <MetricCard
              label="Next Best Step"
              value={nextAction}
              tone={balance <= 0 ? "danger" : balance <= 3 ? "warn" : "good"}
              helper="Suggested next action based on your current visible balance."
            />
          </CardsGrid>
        </WorkspaceSectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.9fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <WorkspaceSectionCard
            title="Helpful actions"
            subtitle="Go directly to the page that best solves the current credit situation."
          >
            <CardsGrid min={220}>
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
                subtitle="Get help if the visible credit state does not match what you expect."
                tone="danger"
                onClick={() => router.push("/support")}
              />
            </CardsGrid>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Credit snapshot"
            subtitle="A short operational summary of the current credit-related account state."
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div style={snapshotItemStyle()}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  Current Plan
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {planName}
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Status: {planStatus}
                </div>
              </div>

              <div style={snapshotItemStyle()}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  Included by Plan
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {String(includedByPlan)}
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Credits currently visible as part of the plan if provided by the backend.
                </div>
              </div>

              <div style={snapshotItemStyle()}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  Consumed Credits
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {String(consumed)}
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Already used credits if your current backend exposes that value.
                </div>
              </div>

              <div style={snapshotItemStyle()}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  Last Credit Update
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {updatedAt ? formatDate(updatedAt) : "Not shown"}
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Latest visible update time for the credit balance if available.
                </div>
              </div>

              <div style={snapshotItemStyle()}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  Plan Expiry
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {expiresAt ? formatDate(expiresAt) : "Not shown"}
                </div>
              </div>
            </div>
          </WorkspaceSectionCard>
        </div>
      </SectionStack>
    </AppShell>
  );
}