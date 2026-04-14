"use client";

import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  return Array.isArray(input) ? input : [];
}

function extractErrorMessage(payload: ApiErrorShape | null, fallback: string) {
  if (!payload) return fallback;
  return payload.fix || payload.message || payload.error || payload.reason || fallback;
}

function normalizeThrownError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return "Unable to reach the workspace service right now. Confirm the backend is running, the workspace routes exist, and CORS/cookie settings still allow this page to call the API.";
    }
    return error.message || fallback;
  }
  return fallback;
}

function buildPlanName(
  plan: WorkspacePlan | undefined,
  planFamily?: string,
  planCode?: string,
  maxWorkspaceUsers?: number,
  maxTotalChannels?: number
) {
  if (plan?.name?.trim()) return plan.name.trim();
  if (plan?.code?.trim()) return plan.code.trim();
  if (planCode?.trim()) return planCode.trim();
  if (planFamily?.trim()) {
    return planFamily
      .trim()
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  if ((maxWorkspaceUsers ?? 0) > 0 || (maxTotalChannels ?? 0) > 0) {
    return "Workspace-enabled plan";
  }
  return "No active plan";
}

function safeCount(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(normalizeThrownError(error, "Unable to reach workspace service."));
  }

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

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100%",
    background: "transparent",
    color: "#0f172a",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  container: {
    maxWidth: "1180px",
    margin: "0 auto",
  },
  topSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  summaryCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.3,
  },
  summarySub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 6,
    lineHeight: 1.5,
  },
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
  },
  heroInfo: {
    background: "linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  heroTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
  },
  heroText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 760,
  },
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
  },
  buttonDisabled: {
    background: "#94a3b8",
    cursor: "not-allowed",
    boxShadow: "none",
  },
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
  },
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
  },
  bannerError: {
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.6,
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    alignItems: "start",
    marginBottom: 20,
  },
  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },
  label: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: 8,
  },
  bigTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
  },
  hugeValue: {
    margin: "8px 0 0",
    fontSize: 42,
    fontWeight: 800,
    color: "#0f172a",
  },
  hugeValueSub: {
    fontSize: 22,
    color: "#64748b",
    fontWeight: 600,
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.5,
  },
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
  },
  statValue: {
    fontWeight: 700,
    color: "#0f172a",
  },
  ownerBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    background: "#ffffff",
  },
  ownerName: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  },
  ownerMeta: {
    marginTop: 6,
    fontSize: 14,
    color: "#475569",
  },
  miniLabel: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#94a3b8",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },
  sectionText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.6,
  },
  formGroup: {
    marginTop: 16,
  },
  formLabel: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#334155",
  },
  input: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
  },
  inputDisabled: {
    background: "#f1f5f9",
    color: "#94a3b8",
    cursor: "not-allowed",
  },
  select: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
  },
  selectDisabled: {
    background: "#f1f5f9",
    color: "#94a3b8",
    cursor: "not-allowed",
  },
  successBox: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: 16,
    padding: "12px 14px",
    marginTop: 14,
    fontSize: 14,
    lineHeight: 1.6,
  },
  errorBox: {
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: 16,
    padding: "12px 14px",
    marginTop: 14,
    fontSize: 14,
    lineHeight: 1.6,
  },
  warningBox: {
    border: "1px solid #fcd34d",
    background: "#fffbeb",
    color: "#92400e",
    borderRadius: 16,
    padding: "14px 16px",
    marginTop: 16,
    fontSize: 14,
    lineHeight: 1.6,
  },
  noteBox: {
    marginTop: 16,
    borderRadius: 18,
    background: "#f8fafc",
    padding: 16,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#475569",
  },
  actionRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 14,
  },
  membersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  badge: {
    borderRadius: 999,
    background: "#e2e8f0",
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
  },
  emptyBox: {
    marginTop: 18,
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    borderRadius: 18,
    padding: 24,
    textAlign: "center",
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.6,
  },
  memberCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    background: "#ffffff",
  },
  memberHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  memberName: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },
  memberEmail: {
    marginTop: 6,
    fontSize: 14,
    color: "#475569",
  },
  memberGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginTop: 14,
  },
  removeButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 16px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  removeButtonDisabled: {
    background: "#e2e8f0",
    color: "#64748b",
    cursor: "not-allowed",
  },
  loadingCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    fontSize: 16,
    color: "#475569",
  },
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
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [limitsResult, membersResult] = await Promise.allSettled([
        apiRequest<LimitsResponse>("/api/workspace/limits"),
        apiRequest<MembersResponse>("/api/workspace/members"),
      ]);

      const nextErrors: string[] = [];

      if (limitsResult.status === "fulfilled") {
        setLimits(limitsResult.value);
      } else {
        nextErrors.push(
          `Workspace limits could not be loaded. ${normalizeThrownError(
            limitsResult.reason,
            "Unable to load workspace limits."
          )}`
        );
      }

      if (membersResult.status === "fulfilled") {
        setMembersData(membersResult.value);
      } else {
        nextErrors.push(
          `Workspace members could not be loaded. ${normalizeThrownError(
            membersResult.reason,
            "Unable to load workspace members."
          )}`
        );
      }

      setPageError(nextErrors.join(" "));
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

  const usedSlots = safeCount(counts.owner_included_total);
  const memberOnlyCount = safeCount(counts.active_members_only) || members.length;
  const maxWorkspaceUsers = safeCount(workspaceLimits.max_workspace_users);
  const maxLinkedWebAccounts = safeCount(workspaceLimits.max_linked_web_accounts);
  const maxTotalChannels = safeCount(channelLimits.max_total_channels);
  const maxWhatsappChannels = safeCount(channelLimits.max_whatsapp_channels);
  const maxTelegramChannels = safeCount(channelLimits.max_telegram_channels);

  const availableSlots =
    maxWorkspaceUsers > 0 ? Math.max(maxWorkspaceUsers - usedSlots, 0) : 0;

  const planName = buildPlanName(
    plan,
    limits?.entitlements?.plan_family || membersData?.entitlements?.plan_family,
    limits?.entitlements?.plan_code || plan?.code,
    maxWorkspaceUsers,
    maxTotalChannels
  );

  const hasWorkspacePlan =
    planName !== "No active plan" ||
    maxWorkspaceUsers > 0 ||
    maxTotalChannels > 0 ||
    Boolean(limits?.entitlements?.plan_code);

  const workspacePlanFull = hasWorkspacePlan && maxWorkspaceUsers > 0 && availableSlots <= 0;
  const addBlockedBecauseNoPlan = !hasWorkspacePlan || maxWorkspaceUsers <= 0;
  const addBlocked = addBlockedBecauseNoPlan || workspacePlanFull;

  const ownerAccountId =
    owner?.account_id ||
    membersData?.account_id ||
    limits?.account_id ||
    limits?.entitlements?.account_id ||
    "—";

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddMessage("");
    setAddError("");
    setRemoveMessage("");
    setRemoveError("");

    if (addBlockedBecauseNoPlan) {
      setAddError(
        "Workspace member access is not enabled on the current plan. Activate or upgrade to a plan that includes workspace slots first."
      );
      return;
    }

    if (workspacePlanFull) {
      setAddError(
        "Your current workspace plan is full. Upgrade your plan or remove an existing member first."
      );
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
      setAddError(
        normalizeThrownError(error, "Unable to add workspace member right now.")
      );
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
      setRemoveError(
        normalizeThrownError(error, "Unable to remove workspace member right now.")
      );
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

          {!loading && addBlockedBecauseNoPlan ? (
            <div style={styles.heroInfo}>
              <div>
                <h2 style={{ ...styles.heroTitle, color: "#1d4ed8" }}>
                  Workspace member access is not enabled yet
                </h2>
                <div style={{ ...styles.heroText, color: "#1e3a8a" }}>
                  This account does not currently show an active plan with workspace
                  member slots. You can still review limits and owner details below,
                  but adding members will remain disabled until a workspace-enabled plan
                  becomes active.
                </div>
              </div>

              <div style={styles.actionRow}>
                <a href="/plans" style={styles.buttonSecondary}>
                  View Plans
                </a>
                <a href="/billing" style={styles.buttonSecondary}>
                  Go to Billing
                </a>
              </div>
            </div>
          ) : null}

          {!loading && !addBlockedBecauseNoPlan && workspacePlanFull ? (
            <div style={styles.heroAlert}>
              <div>
                <h2 style={{ ...styles.heroTitle, color: "#9a3412" }}>
                  Workspace plan is currently full
                </h2>
                <div style={{ ...styles.heroText, color: "#9a3412" }}>
                  You are using {usedSlots} of {maxWorkspaceUsers} allowed workspace slot
                  {maxWorkspaceUsers === 1 ? "" : "s"} on the{" "}
                  <strong>{planName}</strong>. Upgrade your plan to add more members,
                  or remove an existing member first.
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

          {loading ? (
            <div style={styles.loadingCard}>Loading workspace data...</div>
          ) : (
            <>
              <section style={styles.topSummary}>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryLabel}>Plan</div>
                  <div style={styles.summaryValue}>{planName}</div>
                  <div style={styles.summarySub}>
                    Family:{" "}
                    {plan?.plan_family ||
                      limits?.entitlements?.plan_family ||
                      membersData?.entitlements?.plan_family ||
                      "—"}
                  </div>
                </div>

                <div style={styles.summaryCard}>
                  <div style={styles.summaryLabel}>Workspace usage</div>
                  <div style={styles.summaryValue}>
                    {usedSlots} / {maxWorkspaceUsers}
                  </div>
                  <div style={styles.summarySub}>Owner included total usage</div>
                </div>

                <div style={styles.summaryCard}>
                  <div style={styles.summaryLabel}>Total channels allowed</div>
                  <div style={styles.summaryValue}>{maxTotalChannels}</div>
                  <div style={styles.summarySub}>Across all supported channels</div>
                </div>

                <div style={styles.summaryCard}>
                  <div style={styles.summaryLabel}>WhatsApp / Telegram</div>
                  <div style={styles.summaryValue}>
                    {maxWhatsappChannels} / {maxTelegramChannels}
                  </div>
                  <div style={styles.summarySub}>Per-channel entitlement split</div>
                </div>
              </section>

              <section style={styles.grid4}>
                <div style={styles.card}>
                  <div style={styles.label}>Current plan</div>
                  <h2 style={styles.bigTitle}>{planName}</h2>
                  <div style={styles.subText}>
                    Family:{" "}
                    <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>
                      {limits?.entitlements?.plan_family ||
                        plan?.plan_family ||
                        membersData?.entitlements?.plan_family ||
                        "—"}
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
                    <span style={styles.hugeValueSub}> / {maxWorkspaceUsers}</span>
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
                    <span style={styles.statValue}>{maxWorkspaceUsers}</span>
                  </div>
                  <div style={styles.statRow}>
                    <span>Max linked web accounts</span>
                    <span style={styles.statValue}>{maxLinkedWebAccounts}</span>
                  </div>
                </div>

                <div style={styles.card}>
                  <h3 style={styles.sectionTitle}>Channel limits</h3>
                  <div style={styles.statRow}>
                    <span>Total channels</span>
                    <span style={styles.statValue}>{maxTotalChannels}</span>
                  </div>
                  <div style={styles.statRow}>
                    <span>WhatsApp channels</span>
                    <span style={styles.statValue}>{maxWhatsappChannels}</span>
                  </div>
                  <div style={styles.statRow}>
                    <span>Telegram channels</span>
                    <span style={styles.statValue}>{maxTelegramChannels}</span>
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

                    <div style={styles.miniLabel}>Owner account ID</div>
                    <div style={{ ...styles.ownerMeta, wordBreak: "break-all" }}>
                      {ownerAccountId}
                    </div>
                  </div>
                </div>
              </section>

              <section style={styles.grid2}>
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
                        disabled={addBlocked || submittingAdd}
                        style={{
                          ...styles.input,
                          ...(addBlocked || submittingAdd ? styles.inputDisabled : {}),
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
                        disabled={addBlocked || submittingAdd}
                        style={{
                          ...styles.select,
                          ...(addBlocked || submittingAdd ? styles.selectDisabled : {}),
                        }}
                      >
                        <option value="member">member</option>
                      </select>
                    </div>

                    {addBlockedBecauseNoPlan ? (
                      <div style={styles.warningBox}>
                        <strong>Workspace member access is not enabled.</strong> Activate
                        a plan with workspace slots before adding members.
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

                    {!addBlockedBecauseNoPlan && workspacePlanFull ? (
                      <div style={styles.warningBox}>
                        <strong>Your current plan is full.</strong> Upgrade your plan or
                        remove an existing member before adding another workspace user.
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
                      disabled={submittingAdd || addBlocked}
                      style={{
                        ...styles.button,
                        width: "100%",
                        marginTop: 16,
                        ...(submittingAdd || addBlocked ? styles.buttonDisabled : {}),
                      }}
                    >
                      {submittingAdd
                        ? "Adding member..."
                        : addBlockedBecauseNoPlan
                        ? "Workspace plan required"
                        : workspacePlanFull
                        ? "No slots available"
                        : "Add member"}
                    </button>
                  </form>

                  <div style={styles.noteBox}>
                    <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                      Current rule
                    </div>
                    Your plan currently allows{" "}
                    <strong style={{ color: "#0f172a" }}>{maxWorkspaceUsers}</strong> total
                    workspace user{maxWorkspaceUsers === 1 ? "" : "s"}, including the owner.
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

                  {removeMessage ? <div style={styles.successBox}>{removeMessage}</div> : null}
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
                                  <div style={styles.ownerMeta}>{member.role || "member"}</div>
                                </div>
                                <div>
                                  <div style={styles.miniLabel}>Status</div>
                                  <div style={styles.ownerMeta}>{member.status || "active"}</div>
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
