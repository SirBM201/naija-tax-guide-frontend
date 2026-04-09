"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { apiJson, isApiError } from "@/lib/api";

type WorkspaceLimitsResponse = {
  ok?: boolean;
  counts?: {
    active_members_only?: number;
    owner_included_total?: number;
  };
  entitlements?: {
    ok?: boolean;
    plan?: {
      name?: string;
      code?: string;
      plan_family?: string;
      active?: boolean;
    };
    plan_code?: string | null;
    plan_family?: string | null;
    workspace_limits?: {
      max_workspace_users?: number;
      max_linked_web_accounts?: number;
    };
    channel_limits?: {
      max_total_channels?: number;
      max_whatsapp_channels?: number;
      max_telegram_channels?: number;
    };
  };
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

function safeNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return ["1", "true", "yes", "active", "linked", "enabled", "paid", "verified"].includes(raw);
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

function summaryGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  };
}

function summaryCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 22,
    background: "var(--surface)",
    padding: 18,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: 8,
  };
}

function summaryLabelStyle(): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 900,
    color: "var(--text-faint)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  };
}

function summaryValueStyle(): React.CSSProperties {
  return {
    fontSize: 22,
    fontWeight: 900,
    color: "var(--text)",
    lineHeight: 1.2,
  };
}

function summarySubStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    color: "var(--text-muted)",
    lineHeight: 1.6,
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

  const [limitsData, setLimitsData] = useState<WorkspaceLimitsResponse | null>(null);
  const [limitsError, setLimitsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLimits() {
      try {
        setLimitsError("");
        const res = await apiJson<WorkspaceLimitsResponse>("/workspace/limits", {
          method: "GET",
          timeoutMs: 20000,
          useAuthToken: false,
        });
        if (!cancelled) setLimitsData(res);
      } catch (error) {
        if (cancelled) return;
        const message = isApiError(error)
          ? error.message || "Unable to load workspace entitlements."
          : error instanceof Error
          ? error.message || "Unable to load workspace entitlements."
          : "Unable to load workspace entitlements.";
        setLimitsError(message);
      }
    }

    void loadLimits();
    return () => {
      cancelled = true;
    };
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

  const primaryAlert = allAlerts[0] || null;

  const displayName = safeText(
    profile?.first_name || profile?.full_name || user?.email || "Workspace User"
  );

  const planName = safeText(
    subscription?.plan_name ||
      billing?.plan_name ||
      limitsData?.entitlements?.plan?.name ||
      subscription?.plan_code ||
      billing?.plan_code ||
      limitsData?.entitlements?.plan_code ||
      "No active plan"
  );

  const planStatus = safeText(subscription?.status || billing?.status || "Unknown");
  const activeNow = truthyValue(
    subscription?.active || billing?.active || limitsData?.entitlements?.plan?.active || planStatus === "active"
  );

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

  const workspaceMaxUsers = safeNumber(
    limitsData?.entitlements?.workspace_limits?.max_workspace_users
  );
  const workspaceUsed = safeNumber(limitsData?.counts?.owner_included_total);
  const workspaceAvailable =
    workspaceMaxUsers > 0 ? Math.max(workspaceMaxUsers - workspaceUsed, 0) : 0;

  const totalChannelLimit = safeNumber(
    limitsData?.entitlements?.channel_limits?.max_total_channels
  );
  const linkedChannelsUsed = (whatsappLinked ? 1 : 0) + (telegramLinked ? 1 : 0);

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

        {limitsError ? (
          <Banner
            tone="warn"
            title="Workspace status could not be fully loaded"
            subtitle={limitsError}
          />
        ) : null}

        <div style={summaryGridStyle()}>
          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>Workspace Status</div>
            <div style={summaryValueStyle()}>
              {workspaceUsed} / {workspaceMaxUsers || 0}
            </div>
            <div style={summarySubStyle()}>
              Available slots: {workspaceAvailable}
            </div>
            <div>
              <button
                onClick={() => router.push("/workspace")}
                style={shellButtonSecondary()}
              >
                Open Workspace
              </button>
            </div>
          </div>

          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>Channel Status</div>
            <div style={summaryValueStyle()}>
              {linkedChannelsUsed} / {totalChannelLimit}
            </div>
            <div style={summarySubStyle()}>
              WhatsApp: {whatsappLinked ? "Linked" : "Not linked"} · Telegram:{" "}
              {telegramLinked ? "Linked" : "Not linked"}
            </div>
            <div>
              <button
                onClick={() => router.push("/channels")}
                style={shellButtonSecondary()}
              >
                Open Channels
              </button>
            </div>
          </div>
        </div>

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
                title="Workspace"
                subtitle="Check workspace slots, owner status, and member capacity."
                tone={workspaceAvailable <= 0 ? "warn" : "default"}
                onClick={() => router.push("/workspace")}
              />
              <ShortcutCard
                title="Channels"
                subtitle="Check linked channels, channel usage, and connection capacity."
                tone={linkedChannelsUsed >= totalChannelLimit && totalChannelLimit > 0 ? "warn" : "default"}
                onClick={() => router.push("/channels")}
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
              <ShortcutCard
                title="Referrals"
                subtitle="View your referral code, invite link, totals, and rewards."
                tone="default"
                onClick={() => router.push("/referrals")}
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
                  Workspace
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {workspaceUsed} / {workspaceMaxUsers || 0}
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Available slots: {workspaceAvailable}
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
