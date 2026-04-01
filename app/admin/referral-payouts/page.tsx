"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import {
  Banner,
  MetricCard,
  appInputStyle,
  appSelectStyle,
  formatDate,
} from "@/components/ui";
import {
  CardsGrid,
  SectionStack,
  TwoColumnSection,
} from "@/components/page-layout";

type NoticeTone = "good" | "warn" | "danger" | "default";
type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "unknown";
type ActionType = "mark-processing" | "mark-paid" | "mark-failed" | "";

type PayoutRow = {
  id: string;
  account_id?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  status?: string | null;
  provider?: string | null;
  provider_reference?: string | null;
  provider_transfer_code?: string | null;
  requested_at?: string | null;
  processed_at?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type QueueResponse = {
  ok?: boolean;
  count?: number;
  rows?: PayoutRow[];
  error?: string;
  root_cause?: string;
  message?: string;
};

type SinglePayoutResponse = {
  ok?: boolean;
  payout?: PayoutRow;
  error?: string;
  root_cause?: string;
  message?: string;
};

type AuditLogRow = {
  id?: string;
  payout_id?: string | null;
  account_id?: string | null;
  action?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  provider_reference?: string | null;
  provider_transfer_code?: string | null;
  failure_reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

type AuditLogResponse = {
  ok?: boolean;
  rows?: AuditLogRow[];
  error?: string;
  root_cause?: string;
  message?: string;
};

const ADMIN_KEY_STORAGE_KEY = "nt_admin_api_key";
const DEFAULT_STATUS_FILTER = "pending,processing,failed";

function resolveApiBase(): string {
  const envBase =
    (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "").trim();

  if (envBase) return envBase.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/+$/, "")}/api`;
  }
  return "/api";
}

function safeText(value: unknown, fallback = "—"): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
        ? ""
        : String(value).trim();
  return text || fallback;
}

function safeCsvValue(value: unknown): string {
  const text =
    value == null
      ? ""
      : typeof value === "string"
        ? value
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function safeNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeStatus(value: unknown): PayoutStatus {
  const status = safeText(value, "").toLowerCase();
  if (status === "pending" || status === "processing" || status === "paid" || status === "failed") {
    return status;
  }
  return "unknown";
}

function infoBoxStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 16,
    display: "grid",
    gap: 6,
  };
}

function listRowStyle(active: boolean): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 16,
    background: active ? "rgba(78, 110, 255, 0.14)" : "var(--surface)",
    padding: 14,
    display: "grid",
    gap: 8,
    cursor: "pointer",
  };
}

function actionButtonStyle(
  variant: "primary" | "secondary",
  disabled = false
): React.CSSProperties {
  const base = variant === "primary" ? shellButtonPrimary() : shellButtonSecondary();
  return {
    ...base,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function confirmationOverlayStyle(): React.CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  };
}

function confirmationCardStyle(): React.CSSProperties {
  return {
    width: "100%",
    maxWidth: 560,
    borderRadius: 20,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 20,
    display: "grid",
    gap: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  };
}

function statusBadgeStyle(status: PayoutStatus): React.CSSProperties {
  const palette: Record<PayoutStatus, { bg: string; border: string; text: string }> = {
    pending: {
      bg: "rgba(245, 158, 11, 0.14)",
      border: "rgba(245, 158, 11, 0.35)",
      text: "#f59e0b",
    },
    processing: {
      bg: "rgba(59, 130, 246, 0.14)",
      border: "rgba(59, 130, 246, 0.35)",
      text: "#60a5fa",
    },
    paid: {
      bg: "rgba(34, 197, 94, 0.14)",
      border: "rgba(34, 197, 94, 0.35)",
      text: "#4ade80",
    },
    failed: {
      bg: "rgba(239, 68, 68, 0.14)",
      border: "rgba(239, 68, 68, 0.35)",
      text: "#f87171",
    },
    unknown: {
      bg: "rgba(148, 163, 184, 0.14)",
      border: "rgba(148, 163, 184, 0.35)",
      text: "#cbd5e1",
    },
  };

  const c = palette[status];
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 92,
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${c.border}`,
    background: c.bg,
    color: c.text,
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
}

function quickFilterChipStyle(active: boolean): React.CSSProperties {
  return {
    border: active ? "1px solid rgba(78, 110, 255, 0.45)" : "1px solid var(--border)",
    background: active ? "rgba(78, 110, 255, 0.14)" : "var(--surface)",
    color: "var(--text)",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  };
}

function exportButtonStyle(): React.CSSProperties {
  return {
    ...shellButtonSecondary(),
    fontSize: 13,
    padding: "10px 14px",
  };
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  return <span style={statusBadgeStyle(status)}>{status}</span>;
}

function auditRowStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 14,
    background: "var(--surface)",
    padding: 14,
    display: "grid",
    gap: 8,
  };
}

async function adminFetch<T>(
  path: string,
  adminKey: string,
  init?: {
    method?: string;
    body?: unknown;
  }
): Promise<T> {
  const apiBase = resolveApiBase();
  const url = `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Admin-Key": adminKey,
  };

  let body: string | undefined;

  if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = typeof init.body === "string" ? init.body : JSON.stringify(init.body);
  }

  const res = await fetch(url, {
    method: (init?.method || "GET").toUpperCase(),
    headers,
    body,
    credentials: "include",
    cache: "no-store",
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.root_cause ||
      data?.error ||
      data?.message ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

function downloadCsv(filename: string, csvContent: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function buildQueueCsv(rows: PayoutRow[]): string {
  const headers = [
    "id",
    "account_id",
    "amount",
    "currency",
    "status",
    "provider",
    "provider_reference",
    "provider_transfer_code",
    "requested_at",
    "processed_at",
    "paid_at",
    "failed_at",
    "failure_reason",
    "created_at",
    "updated_at",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        safeCsvValue(row.id),
        safeCsvValue(row.account_id),
        safeCsvValue(row.amount),
        safeCsvValue(row.currency),
        safeCsvValue(row.status),
        safeCsvValue(row.provider),
        safeCsvValue(row.provider_reference),
        safeCsvValue(row.provider_transfer_code),
        safeCsvValue(row.requested_at),
        safeCsvValue(row.processed_at),
        safeCsvValue(row.paid_at),
        safeCsvValue(row.failed_at),
        safeCsvValue(row.failure_reason),
        safeCsvValue(row.created_at),
        safeCsvValue(row.updated_at),
      ].join(",")
    ),
  ];

  return lines.join("\n");
}

function buildAuditCsv(rows: AuditLogRow[]): string {
  const headers = [
    "id",
    "payout_id",
    "account_id",
    "action",
    "old_status",
    "new_status",
    "provider_reference",
    "provider_transfer_code",
    "failure_reason",
    "metadata",
    "created_at",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        safeCsvValue(row.id),
        safeCsvValue(row.payout_id),
        safeCsvValue(row.account_id),
        safeCsvValue(row.action),
        safeCsvValue(row.old_status),
        safeCsvValue(row.new_status),
        safeCsvValue(row.provider_reference),
        safeCsvValue(row.provider_transfer_code),
        safeCsvValue(row.failure_reason),
        safeCsvValue(row.metadata),
        safeCsvValue(row.created_at),
      ].join(",")
    ),
  ];

  return lines.join("\n");
}

function buildConfirmationContent(action: Exclude<ActionType, "">, payout: PayoutRow | null) {
  const payoutId = safeText(payout?.id, "selected payout");
  const amount = `${safeText(payout?.currency, "NGN")} ${safeText(payout?.amount, "0")}`;

  if (action === "mark-paid") {
    return {
      title: "Confirm Mark Paid",
      subtitle: `You are about to mark payout ${payoutId} as paid for ${amount}. This should only be done after transfer confirmation.`,
      confirmLabel: "Yes, Mark Paid",
    };
  }

  if (action === "mark-failed") {
    return {
      title: "Confirm Mark Failed",
      subtitle: `You are about to mark payout ${payoutId} as failed. Make sure the failure reason is correct before continuing.`,
      confirmLabel: "Yes, Mark Failed",
    };
  }

  return {
    title: "Confirm Mark Processing",
    subtitle: `You are about to move payout ${payoutId} into processing for ${amount}.`,
    confirmLabel: "Yes, Mark Processing",
  };
}

function actionLabel(value: string | null | undefined): string {
  const raw = safeText(value, "");
  if (!raw) return "Unknown action";
  return raw
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminReferralPayoutsPage() {
  const router = useRouter();
  const { authReady, requireAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [adminKey, setAdminKey] = useState("");
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [queueData, setQueueData] = useState<QueueResponse | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState("");
  const [selectedPayout, setSelectedPayout] = useState<PayoutRow | null>(null);

  const [providerReference, setProviderReference] = useState("");
  const [providerTransferCode, setProviderTransferCode] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [searchPayoutId, setSearchPayoutId] = useState("");
  const [searchAccountId, setSearchAccountId] = useState("");

  const [auditRows, setAuditRows] = useState<AuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditInfo, setAuditInfo] = useState("");

  const [notice, setNotice] = useState<{
    tone: NoticeTone;
    title: string;
    subtitle: string;
  } | null>(null);

  const [errorText, setErrorText] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [lastAction, setLastAction] = useState<ActionType>("");
  const [confirmAction, setConfirmAction] = useState<ActionType>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = (window.localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || "").trim();
      if (stored) setAdminKey(stored);
    }
  }, []);

  const queueRows = queueData?.rows || [];
  const selectedStatus = normalizeStatus(selectedPayout?.status);

  const filteredQueueRows = useMemo(() => {
    const payoutTerm = searchPayoutId.trim().toLowerCase();
    const accountTerm = searchAccountId.trim().toLowerCase();

    return queueRows.filter((row) => {
      const payoutMatch = !payoutTerm || safeText(row.id, "").toLowerCase().includes(payoutTerm);
      const accountMatch =
        !accountTerm || safeText(row.account_id, "").toLowerCase().includes(accountTerm);
      return payoutMatch && accountMatch;
    });
  }, [queueRows, searchPayoutId, searchAccountId]);

  const fullSummary = useMemo(() => {
    const pendingRows = queueRows.filter((row) => normalizeStatus(row.status) === "pending");
    const processingRows = queueRows.filter((row) => normalizeStatus(row.status) === "processing");
    const failedRows = queueRows.filter((row) => normalizeStatus(row.status) === "failed");
    const paidRows = queueRows.filter((row) => normalizeStatus(row.status) === "paid");

    return {
      pendingCount: pendingRows.length,
      processingCount: processingRows.length,
      failedCount: failedRows.length,
      paidCount: paidRows.length,
      pendingAmount: pendingRows.reduce((sum, row) => sum + safeNumber(row.amount), 0),
      processingAmount: processingRows.reduce((sum, row) => sum + safeNumber(row.amount), 0),
      failedAmount: failedRows.reduce((sum, row) => sum + safeNumber(row.amount), 0),
      paidAmount: paidRows.reduce((sum, row) => sum + safeNumber(row.amount), 0),
    };
  }, [queueRows]);

  const canMarkProcessing =
    !!selectedPayout &&
    !submitting &&
    (selectedStatus === "pending" || selectedStatus === "failed" || selectedStatus === "unknown");

  const canMarkPaid =
    !!selectedPayout &&
    !submitting &&
    (selectedStatus === "processing" || selectedStatus === "unknown");

  const canMarkFailed =
    !!selectedPayout &&
    !submitting &&
    (selectedStatus === "pending" || selectedStatus === "processing" || selectedStatus === "unknown");

  const actionHint = useMemo(() => {
    if (!selectedPayout) return "Select a payout row to enable actions.";
    if (selectedStatus === "paid") {
      return "This payout is already marked as paid. Further status changes are disabled.";
    }
    if (selectedStatus === "processing") {
      return "This payout is already in processing. You can mark it paid or failed.";
    }
    if (selectedStatus === "failed") {
      return "This payout previously failed. You can retry by marking it processing.";
    }
    if (selectedStatus === "pending") {
      return "Recommended flow: Mark Processing first, then Mark Paid after transfer confirmation.";
    }
    return "Unknown status detected. Use caution before applying an action.";
  }, [selectedPayout, selectedStatus]);

  const metrics = useMemo(() => {
    const totalRows = filteredQueueRows.length;
    const pending = filteredQueueRows.filter((row) => normalizeStatus(row.status) === "pending").length;
    const processing = filteredQueueRows.filter((row) => normalizeStatus(row.status) === "processing").length;
    const failed = filteredQueueRows.filter((row) => normalizeStatus(row.status) === "failed").length;
    const totalAmount = filteredQueueRows.reduce((sum, row) => sum + safeNumber(row.amount), 0);
    return { totalRows, pending, processing, failed, totalAmount };
  }, [filteredQueueRows]);

  async function loadAuditHistory(payoutId: string, keyOverride?: string) {
    const key = (keyOverride || adminKey).trim();
    if (!payoutId || !key) {
      setAuditRows([]);
      setAuditLoading(false);
      setAuditError("");
      setAuditInfo("");
      return;
    }

    setAuditLoading(true);
    setAuditError("");
    setAuditInfo("");

    try {
      const data = await adminFetch<AuditLogResponse>(
        `/admin/referral-payouts/${encodeURIComponent(payoutId)}/audit`,
        key
      );
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      setAuditRows(rows);
      if (rows.length === 0) {
        setAuditInfo("No audit history recorded yet for this payout.");
      }
    } catch (e: unknown) {
      setAuditRows([]);
      const message =
        e instanceof Error ? e.message : "Could not load audit history for this payout.";
      setAuditError(message);
    } finally {
      setAuditLoading(false);
    }
  }

  async function loadSinglePayout(payoutId: string, keyOverride?: string) {
    const key = (keyOverride || adminKey).trim();
    if (!payoutId || !key) {
      setSelectedPayout(null);
      setSelectedPayoutId("");
      setAuditRows([]);
      setAuditError("");
      setAuditInfo("");
      return;
    }

    try {
      const data = await adminFetch<SinglePayoutResponse>(
        `/admin/referral-payouts/${encodeURIComponent(payoutId)}`,
        key
      );

      setSelectedPayout(data?.payout || null);
      setSelectedPayoutId(payoutId);

      if (data?.payout) {
        setProviderReference(safeText(data.payout.provider_reference, ""));
        setProviderTransferCode(safeText(data.payout.provider_transfer_code, ""));
        setFailureReason(safeText(data.payout.failure_reason, ""));
      }

      await loadAuditHistory(payoutId, key);
    } catch (e: unknown) {
      setSelectedPayout(null);
      setSelectedPayoutId("");
      setAuditRows([]);
      setAuditError("");
      setAuditInfo("");
      setErrorText(e instanceof Error ? e.message : "Could not load payout details.");
    }
  }

  async function loadQueue(showRefreshState = false, filterOverride?: string) {
    if (!requireAuth()) return;

    const key = adminKey.trim();
    const appliedFilter = (filterOverride || statusFilter).trim();

    if (!key) {
      setLoading(false);
      setRefreshing(false);
      setQueueData({ ok: true, count: 0, rows: [] });
      setSelectedPayout(null);
      setSelectedPayoutId("");
      setAuditRows([]);
      setAuditError("");
      setAuditInfo("");
      setErrorText("");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_KEY_STORAGE_KEY, key);
    }

    if (showRefreshState) setRefreshing(true);
    else setLoading(true);

    setErrorText("");
    setNotice(null);

    try {
      const data = await adminFetch<QueueResponse>(
        `/admin/referral-payouts?status=${encodeURIComponent(appliedFilter)}&limit=200`,
        key
      );

      setQueueData(data);

      const availableIds = new Set((data?.rows || []).map((row) => row.id));
      const nextSelectedId =
        selectedPayoutId && availableIds.has(selectedPayoutId)
          ? selectedPayoutId
          : data?.rows?.[0]?.id || "";

      if (nextSelectedId) {
        await loadSinglePayout(nextSelectedId, key);
      } else {
        setSelectedPayout(null);
        setSelectedPayoutId("");
        setAuditRows([]);
        setAuditError("");
        setAuditInfo("");
      }
    } catch (e: unknown) {
      setQueueData(null);
      setSelectedPayout(null);
      setSelectedPayoutId("");
      setAuditRows([]);
      setAuditError("");
      setAuditInfo("");
      setErrorText(e instanceof Error ? e.message : "Could not load payout queue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    void loadQueue(false);
  }, [authReady]);

  async function handleRefresh() {
    await loadQueue(true);
  }

  async function applyQuickFilter(nextFilter: string) {
    setStatusFilter(nextFilter);
    await loadQueue(true, nextFilter);
  }

  function requestStatusUpdate(action: Exclude<ActionType, "">) {
    setActionError("");
    setActionSuccess("");
    setLastAction(action);

    if (action === "mark-processing" && !canMarkProcessing) {
      setActionError("Only pending or failed payouts can be moved to processing.");
      return;
    }

    if (action === "mark-paid" && !canMarkPaid) {
      setActionError("Only processing payouts can be marked as paid.");
      return;
    }

    if (action === "mark-failed" && !canMarkFailed) {
      setActionError("Paid payouts cannot be marked as failed from this screen.");
      return;
    }

    if (action === "mark-failed" && !failureReason.trim()) {
      setActionError("Enter a clear failure reason before marking a payout as failed.");
      return;
    }

    if (action === "mark-paid" || action === "mark-failed") {
      setConfirmAction(action);
      return;
    }

    void submitStatusUpdate(action);
  }

  async function submitStatusUpdate(action: Exclude<ActionType, "">) {
    if (!requireAuth()) return;

    const key = adminKey.trim();
    const payoutId = selectedPayoutId.trim();

    setActionError("");
    setActionSuccess("");
    setLastAction(action);
    setConfirmAction("");

    if (!key) {
      setNotice({
        tone: "warn",
        title: "Admin key required",
        subtitle: "Enter your admin API key before managing payout rows.",
      });
      return;
    }

    if (!payoutId) {
      setNotice({
        tone: "warn",
        title: "Select a payout row",
        subtitle: "Choose a payout from the queue first.",
      });
      return;
    }

    setSubmitting(true);
    setErrorText("");
    setNotice(null);

    let body: Record<string, unknown> = {};

    if (action === "mark-processing" || action === "mark-paid") {
      body = {
        provider_reference: providerReference.trim() || undefined,
        provider_transfer_code: providerTransferCode.trim() || undefined,
      };
    } else if (action === "mark-failed") {
      body = {
        failure_reason: failureReason.trim() || undefined,
        provider_reference: providerReference.trim() || undefined,
        provider_transfer_code: providerTransferCode.trim() || undefined,
      };
    }

    try {
      await adminFetch(
        `/admin/referral-payouts/${encodeURIComponent(payoutId)}/${action}`,
        key,
        { method: "POST", body }
      );

      const prettyAction =
        action === "mark-processing"
          ? "marked as processing"
          : action === "mark-paid"
            ? "marked as paid"
            : "marked as failed";

      setActionSuccess(`Payout ${prettyAction} successfully.`);
      setNotice({
        tone: "good",
        title: "Payout updated",
        subtitle: `The payout row was ${prettyAction}.`,
      });

      await loadQueue(true);
      await loadSinglePayout(payoutId, key);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not update payout row.";
      setActionError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportQueueCsv() {
    if (filteredQueueRows.length === 0) {
      setNotice({
        tone: "warn",
        title: "Nothing to export",
        subtitle: "There are no visible payout queue rows to export right now.",
      });
      return;
    }

    const csv = buildQueueCsv(filteredQueueRows);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`payout-queue-${stamp}.csv`, csv);
  }

  function handleExportAuditCsv() {
    if (auditRows.length === 0) {
      setNotice({
        tone: "warn",
        title: "Nothing to export",
        subtitle: "There are no audit history rows loaded for the selected payout.",
      });
      return;
    }

    const payoutId = safeText(selectedPayoutId, "payout");
    const csv = buildAuditCsv(auditRows);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`payout-audit-${payoutId}-${stamp}.csv`, csv);
  }

  const confirmationContent = confirmAction
    ? buildConfirmationContent(confirmAction, selectedPayout)
    : null;

  return (
    <>
      <AppShell
        title="Admin Payout Queue"
        subtitle="Review pending referral payouts, inspect payout rows, and mark them as processing, paid, or failed."
        actions={
          <>
            <button type="button" style={shellButtonPrimary()} onClick={() => void handleRefresh()}>
              {refreshing ? "Refreshing." : "Refresh"}
            </button>

            <button
              type="button"
              style={shellButtonSecondary()}
              onClick={() => router.push("/referrals")}
            >
              Open Referrals
            </button>
          </>
        }
      >
        <SectionStack>
          {notice ? <Banner tone={notice.tone} title={notice.title} subtitle={notice.subtitle} /> : null}

          {errorText ? (
            <Banner tone="danger" title="Admin payout queue could not load" subtitle={errorText} />
          ) : null}

          <WorkspaceSectionCard
            title="Summary strip"
            subtitle="Quick totals across the currently loaded queue plus one-click status filters."
          >
            <SectionStack>
              <CardsGrid min={160}>
                <MetricCard
                  label="Pending Amount"
                  value={`NGN ${fullSummary.pendingAmount.toFixed(2)}`}
                  helper={`${fullSummary.pendingCount} pending row(s)`}
                />
                <MetricCard
                  label="Processing Amount"
                  value={`NGN ${fullSummary.processingAmount.toFixed(2)}`}
                  helper={`${fullSummary.processingCount} processing row(s)`}
                />
                <MetricCard
                  label="Failed Amount"
                  value={`NGN ${fullSummary.failedAmount.toFixed(2)}`}
                  helper={`${fullSummary.failedCount} failed row(s)`}
                />
                <MetricCard
                  label="Paid Amount"
                  value={`NGN ${fullSummary.paidAmount.toFixed(2)}`}
                  helper={`${fullSummary.paidCount} paid row(s)`}
                />
              </CardsGrid>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button
                  type="button"
                  style={quickFilterChipStyle(statusFilter === "pending")}
                  onClick={() => void applyQuickFilter("pending")}
                >
                  Pending Only
                </button>
                <button
                  type="button"
                  style={quickFilterChipStyle(statusFilter === "processing")}
                  onClick={() => void applyQuickFilter("processing")}
                >
                  Processing Only
                </button>
                <button
                  type="button"
                  style={quickFilterChipStyle(statusFilter === "failed")}
                  onClick={() => void applyQuickFilter("failed")}
                >
                  Failed Only
                </button>
                <button
                  type="button"
                  style={quickFilterChipStyle(statusFilter === "paid")}
                  onClick={() => void applyQuickFilter("paid")}
                >
                  Paid Only
                </button>
                <button
                  type="button"
                  style={quickFilterChipStyle(statusFilter === "pending,processing,failed")}
                  onClick={() => void applyQuickFilter("pending,processing,failed")}
                >
                  Pending + Processing + Failed
                </button>
                <button
                  type="button"
                  style={quickFilterChipStyle(statusFilter === "pending,processing,failed,paid")}
                  onClick={() => void applyQuickFilter("pending,processing,failed,paid")}
                >
                  All Major Statuses
                </button>
              </div>
            </SectionStack>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Admin access"
            subtitle="Enter the private admin key used by the backend admin payout routes."
          >
            <TwoColumnSection>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                    Admin API Key
                  </div>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin key"
                    style={appInputStyle()}
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                    Queue Filter
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={appSelectStyle()}
                  >
                    <option value="pending">Pending only</option>
                    <option value="processing">Processing only</option>
                    <option value="failed">Failed only</option>
                    <option value="paid">Paid only</option>
                    <option value="pending,processing,failed">Pending + Processing + Failed</option>
                    <option value="pending,processing,failed,paid">All major statuses</option>
                  </select>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                    Search by Payout ID
                  </div>
                  <input
                    type="text"
                    value={searchPayoutId}
                    onChange={(e) => setSearchPayoutId(e.target.value)}
                    placeholder="Paste full or partial payout ID"
                    style={appInputStyle()}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                    Search by Account ID
                  </div>
                  <input
                    type="text"
                    value={searchAccountId}
                    onChange={(e) => setSearchAccountId(e.target.value)}
                    placeholder="Paste full or partial account ID"
                    style={appInputStyle()}
                  />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button type="button" style={shellButtonPrimary()} onClick={() => void loadQueue(true)}>
                    Load Queue
                  </button>

                  <button
                    type="button"
                    style={shellButtonSecondary()}
                    onClick={() => {
                      setSearchPayoutId("");
                      setSearchAccountId("");
                    }}
                  >
                    Clear Search
                  </button>

                  <button
                    type="button"
                    style={shellButtonSecondary()}
                    onClick={() => {
                      setAdminKey("");
                      if (typeof window !== "undefined") {
                        window.localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
                      }
                    }}
                  >
                    Clear Admin Key
                  </button>
                </div>
              </div>

              <CardsGrid min={180}>
                <MetricCard label="Queue Rows" value={String(metrics.totalRows)} helper="Rows currently visible after filter/search." />
                <MetricCard label="Pending" value={String(metrics.pending)} helper="Visible requests waiting for action." />
                <MetricCard label="Processing" value={String(metrics.processing)} helper="Visible rows already in transfer processing." />
                <MetricCard label="Failed" value={String(metrics.failed)} helper="Visible rows that need admin attention or retry." />
                <MetricCard label="Queue Amount" value={`NGN ${metrics.totalAmount.toFixed(2)}`} helper="Combined visible amount after filter/search." />
              </CardsGrid>
            </TwoColumnSection>
          </WorkspaceSectionCard>

          {loading ? (
            <WorkspaceSectionCard title="Loading payout queue" subtitle="Please wait while the admin payout queue is being fetched.">
              <div style={{ color: "var(--text-muted)" }}>Loading...</div>
            </WorkspaceSectionCard>
          ) : (
            <TwoColumnSection>
              <WorkspaceSectionCard
                title="Payout queue"
                subtitle="Select a payout row to inspect and manage."
              >
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <button
                    type="button"
                    style={exportButtonStyle()}
                    onClick={handleExportQueueCsv}
                  >
                    Export Queue CSV
                  </button>
                </div>

                {filteredQueueRows.length === 0 ? (
                  <div style={infoBoxStyle()}>
                    <div style={{ fontWeight: 800 }}>No payout rows found</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      Try another filter, clear search, or refresh the queue again.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {filteredQueueRows.map((row) => {
                      const active = row.id === selectedPayoutId;
                      const rowStatus = normalizeStatus(row.status);
                      return (
                        <div key={row.id} style={listRowStyle(active)} onClick={() => void loadSinglePayout(row.id)}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ fontWeight: 800, color: "var(--text)" }}>{safeText(row.id)}</div>
                            <StatusBadge status={rowStatus} />
                          </div>
                          <div style={{ color: "var(--text-muted)" }}>Account: {safeText(row.account_id)}</div>
                          <div style={{ color: "var(--text-muted)" }}>
                            Amount: {safeText(row.currency, "NGN")} {safeText(row.amount, "0")}
                          </div>
                          <div style={{ color: "var(--text-muted)" }}>
                            Requested: {formatDate(row.requested_at || row.created_at)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </WorkspaceSectionCard>

              <WorkspaceSectionCard title="Payout details" subtitle="Inspect the selected payout row, update its processing state, and review its audit trail.">
                {!selectedPayout ? (
                  <div style={infoBoxStyle()}>
                    <div style={{ fontWeight: 800 }}>No payout selected</div>
                    <div style={{ color: "var(--text-muted)" }}>Click a payout row from the queue to view its details.</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    <Banner
                      tone={selectedStatus === "paid" ? "good" : selectedStatus === "failed" ? "warn" : "default"}
                      title={`Current status: ${safeText(selectedPayout.status)}`}
                      subtitle={actionHint}
                    />

                    {actionError ? (
                      <Banner
                        tone="danger"
                        title={lastAction ? `${lastAction} failed` : "Action failed"}
                        subtitle={actionError}
                      />
                    ) : null}

                    {actionSuccess ? (
                      <Banner tone="good" title="Action completed" subtitle={actionSuccess} />
                    ) : null}

                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <StatusBadge status={selectedStatus} />
                    </div>

                    <CardsGrid min={180}>
                      <MetricCard
                        label="Amount"
                        value={`${safeText(selectedPayout.currency, "NGN")} ${safeText(selectedPayout.amount, "0")}`}
                        helper="Requested payout amount."
                      />
                      <MetricCard label="Status" value={safeText(selectedPayout.status)} helper="Current backend payout state." />
                      <MetricCard
                        label="Requested"
                        value={formatDate(selectedPayout.requested_at || selectedPayout.created_at)}
                        helper="When this payout entered the queue."
                      />
                      <MetricCard label="Processed" value={formatDate(selectedPayout.processed_at)} helper="When processing last started or completed." />
                    </CardsGrid>

                    <div style={infoBoxStyle()}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Payout ID</div>
                      <div style={{ fontWeight: 800, color: "var(--text)" }}>{safeText(selectedPayout.id)}</div>
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Provider Reference</div>
                        <input
                          type="text"
                          value={providerReference}
                          onChange={(e) => setProviderReference(e.target.value)}
                          placeholder="Example: PSTK-TRANSFER-001"
                          style={appInputStyle()}
                        />
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Provider Transfer Code</div>
                        <input
                          type="text"
                          value={providerTransferCode}
                          onChange={(e) => setProviderTransferCode(e.target.value)}
                          placeholder="Example: TRF-001"
                          style={appInputStyle()}
                        />
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Failure Reason</div>
                        <input
                          type="text"
                          value={failureReason}
                          onChange={(e) => setFailureReason(e.target.value)}
                          placeholder="Use only when marking payout as failed"
                          style={appInputStyle()}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      <button
                        type="button"
                        style={actionButtonStyle("secondary", !canMarkProcessing)}
                        disabled={!canMarkProcessing}
                        onClick={() => requestStatusUpdate("mark-processing")}
                        title={canMarkProcessing ? "Move payout into processing" : "Only pending or failed payouts can be marked processing"}
                      >
                        {submitting && lastAction === "mark-processing" ? "Working." : "Mark Processing"}
                      </button>

                      <button
                        type="button"
                        style={actionButtonStyle("primary", !canMarkPaid)}
                        disabled={!canMarkPaid}
                        onClick={() => requestStatusUpdate("mark-paid")}
                        title={canMarkPaid ? "Mark payout as paid after transfer confirmation" : "Only processing payouts can be marked paid"}
                      >
                        {submitting && lastAction === "mark-paid" ? "Working." : "Mark Paid"}
                      </button>

                      <button
                        type="button"
                        style={actionButtonStyle("secondary", !canMarkFailed)}
                        disabled={!canMarkFailed}
                        onClick={() => requestStatusUpdate("mark-failed")}
                        title={canMarkFailed ? "Mark payout as failed" : "Paid payouts cannot be marked failed"}
                      >
                        {submitting && lastAction === "mark-failed" ? "Working." : "Mark Failed"}
                      </button>
                    </div>

                    <div style={infoBoxStyle()}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Provider</div>
                      <div style={{ fontWeight: 800, color: "var(--text)" }}>{safeText(selectedPayout.provider)}</div>

                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginTop: 8 }}>
                        Last Failure Reason
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--text)" }}>
                        {safeText(selectedPayout.failure_reason, "None")}
                      </div>
                    </div>

                    <WorkspaceSectionCard
                      title="Audit history"
                      subtitle="Most recent admin actions recorded for this payout."
                    >
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                        <button
                          type="button"
                          style={exportButtonStyle()}
                          onClick={handleExportAuditCsv}
                        >
                          Export Audit CSV
                        </button>
                      </div>

                      {auditLoading ? (
                        <div style={{ color: "var(--text-muted)" }}>Loading audit history...</div>
                      ) : auditError ? (
                        <Banner
                          tone="warn"
                          title="Audit history unavailable"
                          subtitle={auditError}
                        />
                      ) : auditInfo ? (
                        <div style={infoBoxStyle()}>
                          <div style={{ fontWeight: 800 }}>No audit entries yet</div>
                          <div style={{ color: "var(--text-muted)" }}>{auditInfo}</div>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: 12 }}>
                          {auditRows.map((row, index) => (
                            <div key={row.id || `${row.created_at || "audit"}-${index}`} style={auditRowStyle()}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 10,
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                }}
                              >
                                <div style={{ fontWeight: 800, color: "var(--text)" }}>
                                  {actionLabel(row.action)}
                                </div>
                                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                                  {formatDate(row.created_at)}
                                </div>
                              </div>

                              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <StatusBadge status={normalizeStatus(row.old_status)} />
                                <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>→</span>
                                <StatusBadge status={normalizeStatus(row.new_status)} />
                              </div>

                              <div style={{ color: "var(--text-muted)" }}>
                                Account: {safeText(row.account_id)}
                              </div>

                              <div style={{ color: "var(--text-muted)" }}>
                                Provider Ref: {safeText(row.provider_reference, "None")}
                              </div>

                              <div style={{ color: "var(--text-muted)" }}>
                                Transfer Code: {safeText(row.provider_transfer_code, "None")}
                              </div>

                              <div style={{ color: "var(--text-muted)" }}>
                                Failure Reason: {safeText(row.failure_reason, "None")}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </WorkspaceSectionCard>
                  </div>
                )}
              </WorkspaceSectionCard>
            </TwoColumnSection>
          )}
        </SectionStack>
      </AppShell>

      {confirmationContent ? (
        <div style={confirmationOverlayStyle()}>
          <div style={confirmationCardStyle()}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
              {confirmationContent.title}
            </div>
            <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              {confirmationContent.subtitle}
            </div>

            {confirmAction === "mark-failed" ? (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 12,
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--text-muted)",
                }}
              >
                Failure reason to submit:{" "}
                <strong style={{ color: "var(--text)" }}>
                  {safeText(failureReason, "None")}
                </strong>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                type="button"
                style={shellButtonSecondary()}
                onClick={() => setConfirmAction("")}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                style={shellButtonPrimary()}
                onClick={() => {
                  if (confirmAction) {
                    void submitStatusUpdate(confirmAction);
                  }
                }}
                disabled={submitting}
              >
                {submitting ? "Working." : confirmationContent.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
