"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
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

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return ["1", "true", "yes", "active", "linked", "enabled", "paid"].includes(raw);
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

export default function DashboardPage() {
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

  const primaryAlert = allAlerts[0] || null;

  const displayName = safeText(
    profile?.first_name || profile?.full_name || user?.email || "Workspace User"
  );

  const planName = safeText(
    subscription?.plan_name ||
      billing?.plan_name ||
      subscription?.plan_code ||
      billing?.plan_code ||
      "No active plan"
  );

  const planStatus = safeText(subscription?.status || billing?.status || "Unknown");
  const activeNow = truthyValue(subscription?.active || billing?.active || planStatus === "active");

  const creditBalance = safeNumber(credits?.balance);

  const monthlyAiUsed = safeNumber(
    usage?.used_this_month ||
      usage?.monthly_used ||
      usage?.ai_used_month ||
      billing?.ai_used_month ||
      credits?.used_this_month
  );

  const whatsappLinked = truthyValue(
    channelLinks?.whatsapp_linked || channelLinks?.whatsapp?.linked
  );
  const telegramLinked = truthyValue(
    channelLinks?.telegram_linked || channelLinks?.telegram?.linked
  );

  const channelsSummary =
    whatsappLinked && telegramLinked
      ? "All linked"
      : whatsappLinked || telegramLinked
      ? "Partially linked"
      : "Not linked";

  const expiresAt = safeText(subscription?.expires_at || billing?.expires_at || "", "");
  const billingEmail = safeText(
    billing?.checkout_email || profile?.email || user?.email || "Not shown"
  );
  const pendingPlanCode = safeText(
    billing?.pending_plan_code || subscription?.pending_plan_code || "",
    ""
  );
  const pendingStartsAt = safeText(
    billing?.pending_starts_at || subscription?.pending_starts_at || "",
    ""
  );

  const nextAction = !activeNow
    ? "Open Plans"
    : creditBalance <= 0
    ? "Open Credits"
    : "Ask a Question";

  return (
    <AppShell
      title="Dashboard"
      subtitle="See your current workspace status, account readiness, and the most important next actions from one place."
      actions={
        <>
          <button onClick={() => refreshAll()} style={shellButtonPrimary()}>
            Refresh Workspace
          </button>
          <button onClick={() => router.push("/ask")} style={shellButtonSecondary()}>
            Ask a Question
          </button>
          <button onClick={() => router.push("/support")} style={shellButtonSecondary()}>
            Support
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
          title={`Welcome, ${displayName}`}
          subtitle="This dashboard keeps the account summary compact so you can understand the current state quickly and move to the right page."
        >
          <CardsGrid min={220}>
            <MetricCard
              label="Current Plan"
              value={planName}
              tone={activeNow ? "good" : "warn"}
              helper={`Status: ${planStatus}`}
            />
            <MetricCard
              label="AI Credits"
              value={String(creditBalance)}
              tone={creditBalance > 0 ? "good" : "danger"}
              helper="Visible AI credits currently attached to your workspace."
            />
            <MetricCard
              label="AI Used This Month"
              value={String(monthlyAiUsed)}
              helper="Total AI usage recorded for the current month if available."
            />
            <MetricCard
              label="Next Best Step"
              value={nextAction}
              tone={
                !activeNow
                  ? "warn"
                  : creditBalance <= 0
                  ? "danger"
                  : "good"
              }
              helper="Suggested next action based on the visible workspace state."
            />
          </CardsGrid>
        </WorkspaceSectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(280px, 0.9fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <WorkspaceSectionCard
            title="Quick actions"
            subtitle="Go directly to the page that matches what you want to do next."
          >
            <CardsGrid min={220}>
              <ShortcutCard
                title="Ask"
                subtitle="Open the assistant and submit a new tax question."
                tone="good"
                onClick={() => router.push("/ask")}
              />
              <ShortcutCard
                title="Plans"
                subtitle="Review plans, upgrades, and subscription options."
                tone={!activeNow ? "warn" : "default"}
                onClick={() => router.push("/plans")}
              />
              <ShortcutCard
                title="Billing"
                subtitle="Check payment visibility and subscription timing."
                tone="default"
                onClick={() => router.push("/billing")}
              />
              <ShortcutCard
                title="Credits"
                subtitle="Review AI credit balance and monthly usage."
                tone={creditBalance <= 0 ? "warn" : "default"}
                onClick={() => router.push("/credits")}
              />
            </CardsGrid>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Account snapshot"
            subtitle="A short operational summary of the current account state."
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
                  Billing Email
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {billingEmail}
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
                  Expires
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

              <div style={snapshotItemStyle()}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  Channels
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {channelsSummary}
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  WhatsApp: {whatsappLinked ? "Linked" : "Not linked"} • Telegram:{" "}
                  {telegramLinked ? "Linked" : "Not linked"}
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
                  Pending Plan Change
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {pendingPlanCode || "None"}
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {pendingPlanCode
                    ? `Pending start: ${pendingStartsAt ? formatDate(pendingStartsAt) : "Not shown"}`
                    : "No pending plan transition is currently visible."}
                </div>
              </div>
            </div>
          </WorkspaceSectionCard>
        </div>
      </SectionStack>
    </AppShell>
  );
}