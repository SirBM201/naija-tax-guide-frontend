"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";

type WorkspacePlan = {
  active?: boolean;
  audience?: string;
  code?: string;
  credits?: number;
  currency?: string;
  cycle?: string;
  description?: string;
  duration_days?: number;
  max_linked_web_accounts?: number;
  max_telegram_channels?: number;
  max_total_channels?: number;
  max_whatsapp_channels?: number;
  max_workspace_users?: number;
  name?: string;
  plan_family?: string;
  price?: number;
  recommended?: boolean;
  sort_order?: number;
  support_level?: string;
  tier?: string;
};

type WorkspaceLimits = {
  max_linked_web_accounts?: number;
  max_workspace_users?: number;
};

type ChannelLimits = {
  max_telegram_channels?: number;
  max_total_channels?: number;
  max_whatsapp_channels?: number;
};

type Entitlements = {
  account_id?: string;
  channel_limits?: ChannelLimits;
  ok?: boolean;
  plan?: WorkspacePlan;
  plan_code?: string;
  plan_family?: string;
  subscription?: Record<string, unknown>;
  workspace_limits?: WorkspaceLimits;
};

type Counts = {
  active_members_only?: number;
  owner_included_total?: number;
};

type OwnerRecord = {
  account_id?: string;
  created_at?: string;
  display_name?: string | null;
  email?: string | null;
  id?: string;
  provider?: string;
  provider_user_id?: string;
  updated_at?: string;
};

type MemberRecord = {
  id?: string;
  owner_account_id?: string;
  member_account_id?: string;
  role?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  member_email?: string | null;
  member_display_name?: string | null;
  member_provider?: string | null;
  member_provider_user_id?: string | null;
};

type LimitsResponse = {
  account_id?: string;
  counts?: Counts;
  entitlements?: Entitlements;
  ok?: boolean;
};

type MembersResponse = {
  account_id?: string;
  count?: number;
  counts?: Counts;
  entitlements?: Entitlements;
  members?: MemberRecord[] | Record<string, never>;
  ok?: boolean;
  owner?: OwnerRecord;
};

type ApiErrorShape = {
  error?: string;
  message?: string;
  reason?: string;
  fix?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://incredible-nonie-bmsconcept-37359733.koyeb.app";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function normalizeMembers(input: MembersResponse["members"]): MemberRecord[] {
  if (Array.isArray(input)) return input;
  return [];
}

function extractErrorMessage(payload: ApiErrorShape | null, fallback: string) {
  if (!payload) return fallback;
  return payload.fix || payload.message || payload.error || payload.reason || fallback;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = extractErrorMessage(
      (data as ApiErrorShape | null) ?? null,
      `Request failed with status ${response.status}`
    );
    throw new Error(message);
  }

  return data as T;
}

const styles = {
  page: {
    minHeight: "100%",
    background: "transparent",
    color: "#0f172a",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as React.CSSProperties,
  container: {
    maxWidth: "1180px",
    margin: "0 auto",
  } as React.CSSProperties,
  topSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 14,
    marginBottom: 20,
  } as React.CSSProperties,
  summaryCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
  } as React.CSSProperties,
  summaryLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: 8,
  } as React.CSSProperties,
  summaryValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.3,
  } as React.CSSProperties,
  summarySub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 6,
    lineHeight: 1.5,
  } as React.CSSProperties,
  heroAlert: {
    background: "linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%)",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  } as React.CSSProperties,
  heroAlertTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#9a3412",
  } as React.CSSProperties,
  heroAlertText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#9a3412",
    maxWidth: 760,
  } as React.CSSProperties,
  button: {
    border: "none",
    borderRadius: 16,
    padding: "14px 20px",
    background: "#4f46e5",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(79, 70, 229, 0.25)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,
  buttonDisabled: {
    background: "#94a3b8",
    cursor: "not-allowed",
    boxShadow: "none",
  } as React.CSSProperties,
  buttonSecondary: {
    border: "1px solid #c7d2fe",
    borderRadius: 16,
    padding: "14px 20px",
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,
  buttonWarning: {
    border: "1px solid #fdba74",
    borderRadius: 16,
    padding: "12px 18px",
    background: "#ea580c",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 22px rgba(234, 88, 12, 0.20)",
  } as React.CSSProperties,
  bannerError: {
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    fontSize: 14,
  } as React.CSSProperties,
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 20,
  } as React.CSSProperties,
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
    marginBottom: 20,
  } as React.CSSProperties,
  grid2: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
    gap: 20,
    alignItems: "start",
    marginBottom: 20,
  } as React.CSSProperties,
  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: 8,
  } as React.CSSProperties,
  bigTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
  } as React.CSSProperties,
  hugeValue: {
    margin: "8px 0 0",
    fontSize: 42,
    fontWeight: 800,
    color: "#0f172a",
  } as React.CSSProperties,
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.5,
  } as React.CSSProperties,
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    background: "#f8fafc",
    padding: "14px 16px",
    marginTop: 10,
    fontSize: 15,
  } as React.CSSProperties,
  statValue: {
    fontWeight: 700,
    color: "#0f172a",
  } as React.CSSProperties,
  ownerBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    background: "#ffffff",
  } as React.CSSProperties,
  ownerName: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  } as React.CSSProperties,
  ownerMeta: {
    marginTop: 6,
    fontSize: 14,
    color: "#475569",
  } as React.CSSProperties,
  miniLabel: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#94a3b8",
  } as React.CSSProperties,
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  } as React.CSSProperties,
  sectionText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.6,
  } as React.CSSProperties,
  formGroup: {
    marginTop: 16,
  } as React.CSSProperties,
  formLabel: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#334155",
  } as React.CSSProperties,
  input: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  inputDisabled: {
    background: "#f1f5f9",
    color: "#94a3b8",
    cursor: "not-allowed",
  } as React.CSSProperties,
  select: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  selectDisabled: {
    background: "#f1f5f9",
    color: "#94a3b8",
    cursor: "not-allowed",
  } as React.CSSProperties,
  successBox: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: 16,
    padding: "12px 14px",
    marginTop: 14,
    fontSize: 14,
  } as React.CSSProperties,
  errorBox: {
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: 16,
    padding: "12px 14px",
    marginTop: 14,
    fontSize: 14,
  } as React.CSSProperties,
  warningBox: {
    border: "1px solid #fcd34d",
    background: "#fffbeb",
    color: "#92400e",
    borderRadius: 16,
    padding: "14px 16px",
    marginTop: 16,
    fontSize: 14,
    lineHeight: 1.6,
  } as React.CSSProperties,
  noteBox: {
    marginTop: 16,
    borderRadius: 18,
    background: "#f8fafc",
    padding: 16,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#475569",
  } as React.CSSProperties,
  actionRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
    marginTop: 14,
  } as React.CSSProperties,
  membersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
  badge: {
    borderRadius: 999,
    background: "#e2e8f0",
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
  } as React.CSSProperties,
  emptyBox: {
    marginTop: 18,
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    borderRadius: 18,
    padding: 24,
    textAlign: "center" as const,
    color: "#64748b",
    fontSize: 15,
  } as React.CSSProperties,
  memberCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    background: "#ffffff",
  } as React.CSSProperties,
  memberHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
  memberName: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  } as React.CSSProperties,
  memberEmail: {
    marginTop: 6,
    fontSize: 14,
    color: "#475569",
  } as React.CSSProperties,
  memberGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginTop: 14,
  } as React.CSSProperties,
  removeButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 16px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
  removeButtonDisabled: {
    background: "#e2e8f0",
    color: "#64748b",
    cursor: "not-allowed",
  } as React.CSSProperties,
  loadingCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    fontSize: 16,
    color: "#475569",
  } as React.CSSProperties,
};

export default function WorkspacePage() {
  const [limits, setLimits] = useState<LimitsResponse | null>(null);
  const [membersData, setMembersData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [memberEmail, setMemberEmail] = useState("");
  const [role, setRole] = useState("member");
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [addError, setAddError] = useState("");

  const [removingId, setRemovingId] = useState("");
  const [removeMessage, setRemoveMessage] = useState("");
  const [removeError, setRemoveError] = useState("");

  const loadWorkspace = useCallback(async (isRefresh = false) => {
    try {
      setPageError("");
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [limitsRes, membersRes] = await Promise.all([
        apiRequest<LimitsResponse>("/api/workspace/limits"),
        apiRequest<MembersResponse>("/api/workspace/members"),
      ]);

      setLimits(limitsRes);
      setMembersData(membersRes);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load workspace data.";
      setPageError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const plan = limits?.entitlements?.plan || membersData?.entitlements?.plan;
  const workspaceLimits =
    limits?.entitlements?.workspace_limits ||
    membersData?.entitlements?.workspace_limits ||
    {};
  const channelLimits =
    limits?.entitlements?.channel_limits ||
    membersData?.entitlements?.channel_limits ||
    {};
  const counts = membersData?.counts || limits?.counts || {};
  const owner = membersData?.owner;
  const members = useMemo(
    () => normalizeMembers(membersData?.members),
    [membersData?.members]
  );

  const usedSlots = counts.owner_included_total ?? 0;
  const memberOnlyCount = counts.active_members_only ?? members.length ?? 0;
  const maxWorkspaceUsers = workspaceLimits.max_workspace_users ?? 0;
  const availableSlots =
    maxWorkspaceUsers > 0 ? Math.max(maxWorkspaceUsers - usedSlots, 0) : 0;
  const hasNoAvailableSlots = availableSlots <= 0;

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddMessage("");
    setAddError("");
    setRemoveMessage("");
    setRemoveError("");

    if (hasNoAvailableSlots) {
      setAddError("Your current plan is full. Upgrade your plan or remove an existing member.");
      return;
    }

    const cleanEmail = memberEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAddError("Enter the email address of an existing web account.");
      return;
    }

    try {
      setSubmittingAdd(true);

      const result = await apiRequest<{
        ok?: boolean;
        message?: string;
        fix?: string;
      }>("/api/workspace/members/add", {
        method: "POST",
        body: JSON.stringify({
          member_email: cleanEmail,
          role,
        }),
      });

      setAddMessage(result.message || "Member added successfully.");
      setMemberEmail("");
      setRole("member");
      await loadWorkspace(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add workspace member.";
      setAddError(message);
    } finally {
      setSubmittingAdd(false);
    }
  }

  async function handleRemoveMember(memberAccountId?: string) {
    if (!memberAccountId) return;

    setAddMessage("");
    setAddError("");
    setRemoveMessage("");
    setRemoveError("");

    try {
      setRemovingId(memberAccountId);

      const result = await apiRequest<{
        ok?: boolean;
        message?: string;
        fix?: string;
      }>("/api/workspace/members/remove", {
        method: "POST",
        body: JSON.stringify({
          member_account_id: memberAccountId,
        }),
      });

      setRemoveMessage(result.message || "Member removed successfully.");
      await loadWorkspace(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to remove workspace member.";
      setRemoveError(message);
    } finally {
      setRemovingId("");
    }
  }

  return (
    <AppShell
      title="Workspace"
      subtitle="Manage your owner account, workspace member slots, and current plan limits from one place."
      actions={
        <button
          type="button"
          onClick={() => void loadWorkspace(true)}
          disabled={loading || refreshing}
          style={{
            ...styles.button,
            ...(loading || refreshing ? styles.buttonDisabled : {}),
          }}
        >
          {refreshing ? "Refreshing..." : "Refresh Status"}
        </button>
      }
    >
      <main style={styles.page}>
        <div style={styles.container}>
          {pageError ? <div style={styles.bannerError}>{pageError}</div> : null}

          {!loading && hasNoAvailableSlots ? (
            <div style={styles.heroAlert}>
              <div>
                <h2 style={styles.heroAlertTitle}>Workspace plan is currently full</h2>
                <div style={styles.heroAlertText}>
                  You are using {usedSlots} of {maxWorkspaceUsers} allowed workspace slot
                  {maxWorkspaceUsers === 1 ? "" : "s"} on the{" "}
                  <strong>{plan?.name || "current plan"}</strong>. Upgrade your plan to
                  add more members, or remove an existing member first.
                </div>
              </div>

              <div style={styles.actionRow}>
                <a href="/plans" style={styles.buttonWarning}>
                  Upgrade to add more members
                </a>
                <a href="/billing" style={styles.buttonSecondary}>
                  Go to Billing
                </a>
              </div>
            </div>
          ) : null}

          {!loading ? (
            <section style={styles.topSummary}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Plan</div>
                <div style={styles.summaryValue}>{plan?.name || "No active plan"}</div>
                <div style={styles.summarySub}>
                  Family: {plan?.plan_family || limits?.entitlements?.plan_family || "—"}
                </div>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Workspace usage</div>
                <div style={styles.summaryValue}>
                  {usedSlots} / {maxWorkspaceUsers || 0}
                </div>
                <div style={styles.summarySub}>Owner included total usage</div>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Total channels allowed</div>
                <div style={styles.summaryValue}>
                  {channelLimits.max_total_channels ?? 0}
                </div>
                <div style={styles.summarySub}>Across all supported channels</div>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>WhatsApp / Telegram</div>
                <div style={styles.summaryValue}>
                  {channelLimits.max_whatsapp_channels ?? 0} /{" "}
                  {channelLimits.max_telegram_channels ?? 0}
                </div>
                <div style={styles.summarySub}>Per-channel entitlement split</div>
              </div>
            </section>
          ) : null}

          {loading ? (
            <div style={styles.loadingCard}>Loading workspace data...</div>
          ) : (
            <>
              <section style={styles.grid4}>
                <div style={styles.card}>
                  <div style={styles.label}>Current plan</div>
                  <h2 style={styles.bigTitle}>{plan?.name || "No active plan"}</h2>
                  <div style={styles.subText}>
                    Family:{" "}
                    <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>
                      {limits?.entitlements?.plan_family || plan?.plan_family || "—"}
                    </strong>
                  </div>
                  <div style={styles.subText}>
                    Code:{" "}
                    <strong style={{ color: "#0f172a" }}>
                      {limits?.entitlements?.plan_code || plan?.code || "—"}
                    </strong>
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.label}>Workspace slots used</div>
                  <div style={styles.hugeValue}>
                    {usedSlots}
                    <span style={{ fontSize: 22, color: "#64748b", fontWeight: 600 }}>
                      {" "}
                      / {maxWorkspaceUsers || 0}
                    </span>
                  </div>
                  <div style={styles.subText}>Owner included total</div>
                </div>

                <div style={styles.card}>
                  <div style={styles.label}>Additional members</div>
                  <div style={styles.hugeValue}>{memberOnlyCount}</div>
                  <div style={styles.subText}>Active members only</div>
                </div>

                <div style={styles.card}>
                  <div style={styles.label}>Available slots</div>
                  <div style={styles.hugeValue}>{availableSlots}</div>
                  <div style={styles.subText}>Remaining under this plan</div>
                </div>
              </section>

              <section style={styles.grid3}>
                <div style={styles.card}>
                  <h3 style={styles.sectionTitle}>Workspace limits</h3>
                  <div style={styles.statRow}>
                    <span>Max workspace users</span>
                    <span style={styles.statValue}>
                      {workspaceLimits.max_workspace_users ?? 0}
                    </span>
                  </div>
                  <div style={styles.statRow}>
                    <span>Max linked web accounts</span>
                    <span style={styles.statValue}>
                      {workspaceLimits.max_linked_web_accounts ?? 0}
                    </span>
                  </div>
                </div>

                <div style={styles.card}>
                  <h3 style={styles.sectionTitle}>Channel limits</h3>
                  <div style={styles.statRow}>
                    <span>Total channels</span>
                    <span style={styles.statValue}>
                      {channelLimits.max_total_channels ?? 0}
                    </span>
                  </div>
                  <div style={styles.statRow}>
                    <span>WhatsApp channels</span>
                    <span style={styles.statValue}>
                      {channelLimits.max_whatsapp_channels ?? 0}
                    </span>
                  </div>
                  <div style={styles.statRow}>
                    <span>Telegram channels</span>
                    <span style={styles.statValue}>
                      {channelLimits.max_telegram_channels ?? 0}
                    </span>
                  </div>
                </div>

                <div style={styles.card}>
                  <h3 style={styles.sectionTitle}>Workspace owner</h3>
                  <div style={styles.ownerBox}>
                    <p style={styles.ownerName}>
                      {owner?.display_name || owner?.email || "Owner account"}
                    </p>
                    <div style={styles.ownerMeta}>{owner?.email || "—"}</div>

                    <div style={styles.miniLabel}>Role</div>
                    <div style={styles.ownerMeta}>
                      <strong style={{ color: "#0f172a" }}>Owner</strong>
                    </div>

                    <div style={styles.miniLabel}>Created</div>
                    <div style={styles.ownerMeta}>{formatDate(owner?.created_at)}</div>
                  </div>
                </div>
              </section>

              <section
                style={{
                  ...styles.grid2,
                  gridTemplateColumns:
                    typeof window !== "undefined" && window.innerWidth < 980
                      ? "1fr"
                      : "minmax(320px, 420px) minmax(0, 1fr)",
                }}
              >
                <div style={styles.card}>
                  <h3 style={styles.sectionTitle}>Add member</h3>
                  <div style={styles.sectionText}>
                    Enter the email address of an existing web account you want to add
                    into this workspace.
                  </div>

                  <form onSubmit={handleAddMember}>
                    <div style={styles.formGroup}>
                      <label htmlFor="member_email" style={styles.formLabel}>
                        Member email
                      </label>
                      <input
                        id="member_email"
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        placeholder="user@example.com"
                        disabled={hasNoAvailableSlots || submittingAdd}
                        style={{
                          ...styles.input,
                          ...(hasNoAvailableSlots || submittingAdd ? styles.inputDisabled : {}),
                        }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label htmlFor="member_role" style={styles.formLabel}>
                        Role
                      </label>
                      <select
                        id="member_role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={hasNoAvailableSlots || submittingAdd}
                        style={{
                          ...styles.select,
                          ...(hasNoAvailableSlots || submittingAdd ? styles.selectDisabled : {}),
                        }}
                      >
                        <option value="member">member</option>
                      </select>
                    </div>

                    {hasNoAvailableSlots ? (
                      <div style={styles.warningBox}>
                        <strong>Your current plan is full.</strong> Upgrade your plan or remove
                        an existing member before adding another workspace user.
                        <div style={styles.actionRow}>
                          <a href="/billing" style={styles.buttonSecondary}>
                            Go to Billing
                          </a>
                          <a href="/plans" style={styles.buttonSecondary}>
                            View Plans
                          </a>
                        </div>
                      </div>
                    ) : null}

                    {addMessage ? <div style={styles.successBox}>{addMessage}</div> : null}
                    {addError ? <div style={styles.errorBox}>{addError}</div> : null}

                    <button
                      type="submit"
                      disabled={submittingAdd || hasNoAvailableSlots}
                      style={{
                        ...styles.button,
                        width: "100%",
                        marginTop: 16,
                        ...(submittingAdd || hasNoAvailableSlots ? styles.buttonDisabled : {}),
                      }}
                    >
                      {submittingAdd
                        ? "Adding member..."
                        : hasNoAvailableSlots
                        ? "No slots available"
                        : "Add member"}
                    </button>
                  </form>

                  <div style={styles.noteBox}>
                    <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                      Current rule
                    </div>
                    Your plan currently allows{" "}
                    <strong style={{ color: "#0f172a" }}>
                      {maxWorkspaceUsers || 0}
                    </strong>{" "}
                    total workspace user{maxWorkspaceUsers === 1 ? "" : "s"}, including
                    the owner.
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.membersHeader}>
                    <div>
                      <h3 style={styles.sectionTitle}>Workspace members</h3>
                      <div style={styles.sectionText}>
                        Member accounts linked under this workspace owner.
                      </div>
                    </div>
                    <span style={styles.badge}>
                      {memberOnlyCount} member{memberOnlyCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  {removeMessage ? (
                    <div style={styles.successBox}>{removeMessage}</div>
                  ) : null}
                  {removeError ? <div style={styles.errorBox}>{removeError}</div> : null}

                  {members.length === 0 ? (
                    <div style={styles.emptyBox}>
                      No extra workspace members have been added yet.
                    </div>
                  ) : (
                    members.map((member) => {
                      const display =
                        member.member_display_name ||
                        member.member_email ||
                        member.member_provider_user_id ||
                        member.member_account_id ||
                        "Workspace member";

                      return (
                        <div
                          key={member.member_account_id || member.id}
                          style={styles.memberCard}
                        >
                          <div style={styles.memberHead}>
                            <div>
                              <p style={styles.memberName}>{display}</p>
                              <div style={styles.memberEmail}>
                                {member.member_email || "No email available"}
                              </div>

                              <div style={styles.memberGrid}>
                                <div>
                                  <div style={styles.miniLabel}>Role</div>
                                  <div style={styles.ownerMeta}>
                                    {member.role || "member"}
                                  </div>
                                </div>
                                <div>
                                  <div style={styles.miniLabel}>Status</div>
                                  <div style={styles.ownerMeta}>
                                    {member.status || "active"}
                                  </div>
                                </div>
                                <div>
                                  <div style={styles.miniLabel}>Added</div>
                                  <div style={styles.ownerMeta}>
                                    {formatDate(member.created_at)}
                                  </div>
                                </div>
                                <div>
                                  <div style={styles.miniLabel}>Member account ID</div>
                                  <div
                                    style={{
                                      ...styles.ownerMeta,
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {member.member_account_id || "—"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={
                                removingId === member.member_account_id ||
                                !member.member_account_id
                              }
                              onClick={() =>
                                void handleRemoveMember(member.member_account_id)
                              }
                              style={{
                                ...styles.removeButton,
                                ...(removingId === member.member_account_id ||
                                !member.member_account_id
                                  ? styles.removeButtonDisabled
                                  : {}),
                              }}
                            >
                              {removingId === member.member_account_id
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
