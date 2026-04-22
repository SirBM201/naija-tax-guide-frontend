"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, MetricCard, ShortcutCard, formatDate } from "@/components/ui";
import { CardsGrid, ResponsiveColumns, SectionStack } from "@/components/page-layout";
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

type Deadline = {
  id: string;
  tax_type: string;
  due_date: string;
  reminder_days_before: number;
  enabled: boolean;
};

type NormalizedAlert = {
  tone: "good" | "warn" | "danger";
  title: string;
  subtitle: string;
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
    return [
      "1",
      "true",
      "yes",
      "active",
      "linked",
      "enabled",
      "paid",
      "verified",
      "free",
      "available",
    ].includes(raw);
  }
  return false;
}

function summaryGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: 16,
    width: "100%",
    minWidth: 0,
    alignItems: "stretch",
  };
}

function summaryCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 22,
    background: "var(--surface)",
    padding: 16,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: 10,
    minWidth: 0,
    height: "100%",
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
    fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
    fontWeight: 900,
    color: "var(--text)",
    lineHeight: 1.2,
    wordBreak: "break-word",
  };
}

function summarySubStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    color: "var(--text-muted)",
    lineHeight: 1.6,
    wordBreak: "break-word",
  };
}

function buttonRowStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 10,
    width: "100%",
    minWidth: 0,
  };
}

function fullWidthButtonStyle(baseStyle: React.CSSProperties): React.CSSProperties {
  return {
    ...baseStyle,
    width: "100%",
    maxWidth: "100%",
    justifyContent: "center",
  };
}

function snapshotGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 12,
    width: "100%",
    minWidth: 0,
  };
}

function snapshotItemStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 16,
    display: "grid",
    gap: 6,
    minWidth: 0,
  };
}

function snapshotTitleStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    color: "var(--text-muted)",
    fontWeight: 700,
  };
}

function snapshotValueStyle(): React.CSSProperties {
  return {
    fontSize: 16,
    fontWeight: 800,
    color: "var(--text)",
    lineHeight: 1.55,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function snapshotMetaStyle(): React.CSSProperties {
  return {
    color: "var(--text-muted)",
    lineHeight: 1.7,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function buttonStyleWithDisabledState(
  baseStyle: React.CSSProperties,
  disabled: boolean
): React.CSSProperties {
  if (!disabled) {
    return {
      ...baseStyle,
      cursor: "pointer",
      opacity: 1,
    };
  }

  return {
    ...baseStyle,
    cursor: "not-allowed",
    opacity: 1,
    background: "#e5e7eb",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    boxShadow: "none",
    filter: "grayscale(0.12)",
    transform: "none",
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
    accountId,
  } = useWorkspaceState();

  const [limitsData, setLimitsData] = useState<WorkspaceLimitsResponse | null>(null);
  const [limitsError, setLimitsError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  const loadLimits = useCallback(async () => {
    try {
      setLimitsError("");
      const res = await apiJson<WorkspaceLimitsResponse>("/workspace/limits", {
        method: "GET",
        timeoutMs: 20000,
        useAuthToken: false,
      });
      setLimitsData(res);
    } catch (error: unknown) {
      const message = isApiError(error)
        ? error.message || "Unable to load workspace entitlements."
        : error instanceof Error
        ? error.message || "Unable to load workspace entitlements."
        : "Unable to load workspace entitlements.";
      setLimitsError(message);
    }
  }, []);

  const fetchDeadlines = useCallback(async () => {
    if (!accountId) return;
    setLoadingDeadlines(true);
    try {
      const res = await apiJson(`/api/deadlines?userId=${accountId}`, { method: "GET" });
      if (res.ok && Array.isArray(res.deadlines)) {
        setDeadlines(res.deadlines);
      } else {
        setDeadlines([]);
      }
    } catch (err) {
      console.error("Failed to fetch deadlines", err);
      setDeadlines([]);
    } finally {
      setLoadingDeadlines(false);
    }
  }, [accountId]);

  useEffect(() => {
    void loadLimits();
  }, [loadLimits]);

  useEffect(() => {
    if (accountId) {
      void fetchDeadlines();
    }
  }, [accountId, fetchDeadlines]);

  const rawAlerts = useMemo(
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

  const displayName = safeText(
    profile?.first_name || profile?.full_name || user?.email || "Workspace User"
  );

  const rawPlanName = safeText(
    subscription?.plan_name ||
      billing?.plan_name ||
      limitsData?.entitlements?.plan?.name ||
      subscription?.plan_code ||
      billing?.plan_code ||
      limitsData?.entitlements?.plan_code ||
      "Free"
  );

  const rawPlanFamily = safeText(
    limitsData?.entitlements?.plan_family ||
      limitsData?.entitlements?.plan?.plan_family ||
      "",
    ""
  );

  const normalizedPlanName = rawPlanName.toLowerCase();
  const normalizedPlanFamily = rawPlanFamily.toLowerCase();

  const isFreePlan =
    normalizedPlanName === "free" ||
    normalizedPlanFamily === "free" ||
    normalizedPlanFamily === "starter-free";

  const billingStatus = safeText(billing?.status || "", "");
  const subscriptionStatus = safeText(subscription?.status || "", "");
  const rawPlanStatus = safeText(subscriptionStatus || billingStatus || "", "");

  const activeNow = isFreePlan
    ? true
    : truthyValue(
        subscription?.active ||
          billing?.active ||
          limitsData?.entitlements?.plan?.active ||
          rawPlanStatus.toLowerCase() === "active" ||
          rawPlanStatus.toLowerCase() === "paid"
      );

  const planName = isFreePlan ? "Free" : rawPlanName;

  const planStatus = useMemo(() => {
    if (isFreePlan) return "Free plan";
    if (activeNow) return rawPlanStatus || "Active";
    return rawPlanStatus || "Not active";
  }, [activeNow, isFreePlan, rawPlanStatus]);

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

  const linkedChannelsUsed = (whatsappLinked ? 1 : 0) + (telegramLinked ? 1 : 0);

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

  const normalizedPrimaryAlert = useMemo<NormalizedAlert | null>(() => {
    const primary = rawAlerts[0] || null;
    if (!primary) {
      if (isFreePlan) {
        return {
          tone: "good",
          title: "Free workspace is available",
          subtitle:
            "Your workspace is currently visible on the Free plan. Some advanced features remain limited until you upgrade.",
        };
      }
      return null;
    }

    const title = safeText(primary.title || "", "");
    const subtitle = safeText(primary.subtitle || "", "");

    if (
      isFreePlan &&
      /no active subscription|subscription is currently visible|subscription/i.test(title)
    ) {
      return {
        tone: "good",
        title: "Free workspace is available",
        subtitle:
          "Your workspace is currently visible on the Free plan. Some advanced features remain limited until you upgrade.",
      };
    }

    return {
      tone:
        primary.tone === "danger" || primary.tone === "warn" || primary.tone === "good"
          ? primary.tone
          : "warn",
      title,
      subtitle,
    };
  }, [isFreePlan, rawAlerts]);

  const nextAction = useMemo(() => {
    if (!activeNow && !isFreePlan) return "Open Plans";
    if (totalChannelLimit > 0 && linkedChannelsUsed === 0) return "Open Channels";
    if (!isFreePlan && creditBalance <= 0) return "Open Credits";
    return "Ask a Question";
  }, [activeNow, creditBalance, isFreePlan, linkedChannelsUsed, totalChannelLimit]);

  const nextActionTone = useMemo<"good" | "warn" | "danger">(() => {
    if (!activeNow && !isFreePlan) return "warn";
    if (!isFreePlan && creditBalance <= 0) return "danger";
    if (totalChannelLimit > 0 && linkedChannelsUsed === 0) return "warn";
    return "good";
  }, [activeNow, creditBalance, isFreePlan, linkedChannelsUsed, totalChannelLimit]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshAll(), loadLimits(), fetchDeadlines()]);
    } finally {
      setRefreshing(false);
    }
  }

  const channelsShortcutTone =
    totalChannelLimit > 0 && linkedChannelsUsed >= totalChannelLimit
      ? "warn"
      : linkedChannelsUsed === 0
      ? "warn"
      : "default";

  // Prepare upcoming deadlines (enabled, not overdue, sorted by nearest)
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const upcomingDeadlines = deadlines
    .filter(dl => dl.enabled && getDaysRemaining(dl.due_date) >= 0)
    .sort((a, b) => getDaysRemaining(a.due_date) - getDaysRemaining(b.due_date))
    .slice(0, 5);

  const hasUpcomingDeadlines = upcomingDeadlines.length > 0;

  return (
    <AppShell
      title="Dashboard"
      subtitle="See your current workspace status, account readiness, and the most important next actions from one place."
      actions={
        <>
          <button
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            aria-disabled={refreshing}
            style={fullWidthButtonStyle(
              buttonStyleWithDisabledState(shellButtonPrimary(), refreshing)
            )}
          >
            {refreshing ? "Refreshing..." : "Refresh Workspace"}
          </button>
          <button
            onClick={() => router.push("/ask")}
            style={fullWidthButtonStyle(shellButtonSecondary())}
          >
            Ask a Question
          </button>
          <button
            onClick={() => router.push("/support")}
            style={fullWidthButtonStyle(shellButtonSecondary())}
          >
            Support
          </button>
        </>
      }
    >
      <SectionStack>
        {normalizedPrimaryAlert ? (
          <Banner
            tone={normalizedPrimaryAlert.tone}
            title={normalizedPrimaryAlert.title}
            subtitle={normalizedPrimaryAlert.subtitle}
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
            <div style={summarySubStyle()}>Available slots: {workspaceAvailable}</div>
            <div style={buttonRowStyle()}>
              <button
                onClick={() => router.push("/workspace")}
                style={fullWidthButtonStyle(shellButtonSecondary())}
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
            <div style={buttonRowStyle()}>
              <button
                onClick={() => router.push("/channels")}
                style={fullWidthButtonStyle(shellButtonSecondary())}
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
          <CardsGrid min={200}>
            <MetricCard
              label="Current Plan"
              value={planName}
              tone={isFreePlan || activeNow ? "good" : "warn"}
              helper={`Status: ${planStatus}`}
            />
            <MetricCard
              label="AI Credits"
              value={String(creditBalance)}
              tone={isFreePlan ? "default" : creditBalance > 0 ? "good" : "danger"}
              helper={
                isFreePlan
                  ? "Free plan usage may be controlled by daily limits instead of a visible credit balance."
                  : "Visible AI credits currently attached to your workspace."
              }
            />
            <MetricCard
              label="AI Used This Month"
              value={String(monthlyAiUsed)}
              helper="Total AI usage recorded for the current month if available."
            />
            <MetricCard
              label="Next Best Step"
              value={nextAction}
              tone={nextActionTone}
              helper="Suggested next action based on the visible workspace state."
            />
          </CardsGrid>
        </WorkspaceSectionCard>

        <ResponsiveColumns min={320} gap={18}>
          <WorkspaceSectionCard
            title="Quick actions"
            subtitle="Go directly to the page that matches what you want to do next."
          >
            <CardsGrid min={190}>
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
                tone={channelsShortcutTone}
                onClick={() => router.push("/channels")}
              />
              <ShortcutCard
                title="Plans"
                subtitle="Review plans, upgrades, and subscription options."
                tone={!activeNow && !isFreePlan ? "warn" : "default"}
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
                tone={!isFreePlan && creditBalance <= 0 ? "warn" : "default"}
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
            <div style={snapshotGridStyle()}>
              <div style={snapshotItemStyle()}>
                <div style={snapshotTitleStyle()}>Billing Email</div>
                <div style={snapshotValueStyle()}>{billingEmail}</div>
              </div>

              <div style={snapshotItemStyle()}>
                <div style={snapshotTitleStyle()}>Expires</div>
                <div style={snapshotValueStyle()}>
                  {expiresAt ? formatDate(expiresAt) : isFreePlan ? "Free plan" : "Not shown"}
                </div>
              </div>

              <div style={snapshotItemStyle()}>
                <div style={snapshotTitleStyle()}>Channels</div>
                <div style={snapshotValueStyle()}>{channelsSummary}</div>
                <div style={snapshotMetaStyle()}>
                  WhatsApp: {whatsappLinked ? "Linked" : "Not linked"} • Telegram:{" "}
                  {telegramLinked ? "Linked" : "Not linked"}
                </div>
              </div>

              <div style={snapshotItemStyle()}>
                <div style={snapshotTitleStyle()}>Workspace</div>
                <div style={snapshotValueStyle()}>
                  {workspaceUsed} / {workspaceMaxUsers || 0}
                </div>
                <div style={snapshotMetaStyle()}>Available slots: {workspaceAvailable}</div>
              </div>

              <div style={snapshotItemStyle()}>
                <div style={snapshotTitleStyle()}>Pending Plan Change</div>
                <div style={snapshotValueStyle()}>{pendingPlanCode || "None"}</div>
                <div style={snapshotMetaStyle()}>
                  {pendingPlanCode
                    ? `Pending start: ${pendingStartsAt ? formatDate(pendingStartsAt) : "Not shown"}`
                    : "No pending plan transition is currently visible."}
                </div>
              </div>
            </div>
          </WorkspaceSectionCard>
        </ResponsiveColumns>

        {/* Upcoming Deadlines Widget */}
        <WorkspaceSectionCard
          title="📅 Upcoming Tax Deadlines"
          subtitle="Track important filing dates and receive reminders."
        >
          {loadingDeadlines ? (
            <div>Loading deadlines...</div>
          ) : !hasUpcomingDeadlines ? (
            <Banner
              title="No upcoming deadlines"
              subtitle="Add your first deadline in the Deadlines page to get reminders."
              tone="default"
            />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {upcomingDeadlines.map((dl) => {
                const daysRemaining = getDaysRemaining(dl.due_date);
                const isUrgent = daysRemaining <= dl.reminder_days_before;
                return (
                  <div
                    key={dl.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 18,
                      padding: 16,
                      background: isUrgent ? "rgba(245,158,11,0.1)" : "var(--surface)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 16, textTransform: "uppercase" }}>{dl.tax_type}</strong>
                      <span style={{ fontSize: 14, color: isUrgent ? "#f59e0b" : "var(--text-muted)" }}>
                        {daysRemaining === 0 ? "Due today!" : daysRemaining === 1 ? "Tomorrow" : `${daysRemaining} days left`}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 14 }}>Due: {new Date(dl.due_date).toLocaleDateString("en-GB")}</div>
                    {isUrgent && daysRemaining > 0 && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "#f59e0b" }}>
                        ⚠️ Reminder: This deadline is in {daysRemaining} days!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => router.push("/deadlines")}
              style={{
                padding: "8px 16px",
                background: "var(--surface-soft)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Manage All Deadlines →
            </button>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
