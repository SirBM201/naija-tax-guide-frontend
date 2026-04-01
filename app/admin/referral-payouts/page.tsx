"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";

type NoticeTone = "good" | "warn" | "danger" | "default";
type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "unknown";
type ActionType = "mark-processing" | "mark-paid" | "mark-failed";
type StatusFilterValue =
  | "pending"
  | "processing"
  | "failed"
  | "paid"
  | "pending,processing,failed"
  | "pending,processing,failed,paid";

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
  id?: string | null;
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
const DEFAULT_STATUS_FILTER: StatusFilterValue = "pending,processing,failed";

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

function formatMoney(value: unknown, currency = "NGN"): string {
  const amount = safeNumber(value);
  return `${currency} ${amount.toFixed(2)}`;
}

function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safeText(value);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not yet loaded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safeText(value);
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

async function copyText(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
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

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  const parsed = data as Record<string, unknown> | null;

  if (!res.ok) {
    const message =
      (typeof parsed?.root_cause === "string" && parsed.root_cause) ||
      (typeof parsed?.error === "string" && parsed.error) ||
      (typeof parsed?.message === "string" && parsed.message) ||
      `Request failed (${res.status})`;

    throw new Error(message);
  }

  return data as T;
}

function actionLabel(value: string | null | undefined): string {
  const raw = safeText(value, "");
  if (!raw) return "Unknown action";
  return raw
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusLabel(status: PayoutStatus): string {
  return status.toUpperCase();
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "0 14px",
    outline: "none",
  };
}

function textareaStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 88,
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "12px 14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text-muted)",
  };
}

function statusBadgeStyle(status: PayoutStatus): React.CSSProperties {
  const palette: Record<PayoutStatus, { bg: string; border: string; text: string }> = {
    pending: {
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.35)",
      text: "#d97706",
    },
    processing: {
      bg: "rgba(59, 130, 246, 0.12)",
      border: "rgba(59, 130, 246, 0.35)",
      text: "#5b8def",
    },
    paid: {
      bg: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.35)",
      text: "#16a34a",
    },
    failed: {
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.35)",
      text: "#dc2626",
    },
    unknown: {
      bg: "rgba(148, 163, 184, 0.12)",
      border: "rgba(148, 163, 184, 0.35)",
      text: "#64748b",
    },
  };

  const colors = palette[status];

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.text,
    padding: "6px 12px",
    minWidth: 96,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };
}

function cardStyle(active = false): React.CSSProperties {
  return {
    border: `1px solid ${active ? "rgba(78,110,255,0.35)" : "var(--border)"}`,
    background: active ? "rgba(78,110,255,0.10)" : "var(--surface)",
    borderRadius: 18,
    padding: 16,
    display: "grid",
    gap: 10,
    cursor: "pointer",
  };
}

function infoCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    borderRadius: 18,
    padding: 16,
    display: "grid",
    gap: 8,
  };
}

function metricGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  };
}

function twoColumnStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "1fr 1fr",
  };
}

function responsiveStackStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 16,
  };
}

function quickFilterChipStyle(active: boolean): React.CSSProperties {
  return {
    ...shellButtonSecondary(),
    padding: "10px 14px",
    fontSize: 13,
    background: active ? "rgba(78,110,255,0.12)" : undefined,
    border: active ? "1px solid rgba(78,110,255,0.35)" : undefined,
  };
}

function exportButtonStyle(): React.CSSProperties {
  return {
    ...shellButtonSecondary(),
    padding: "10px 14px",
    fontSize: 13,
  };
}

function copyButtonStyle(): React.CSSProperties {
  return {
    ...shellButtonSecondary(),
    padding: "8px 12px",
    fontSize: 12,
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

function overlayStyle(): React.CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  };
}

function modalCardStyle(): React.CSSProperties {
  return {
    width: "100%",
    maxWidth: 620,
    borderRadius: 22,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 20,
    display: "grid",
    gap: 14,
    boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
  };
}

function summaryBarStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    background: "rgba(78,110,255,0.08)",
    borderRadius: 18,
    padding: 14,
    display: "grid",
    gap: 6,
  };
}

function auditCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    borderRadius: 16,
    padding: 14,
    display: "grid",
    gap: 10,
  };
}

function toneCardStyle(tone: NoticeTone): React.CSSProperties {
  const palette: Record<NoticeTone, { bg: string; border: string }> = {
    good: { bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.25)" },
    warn: { bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)" },
    danger: { bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.25)" },
    default: { bg: "rgba(78,110,255,0.08)", border: "rgba(78,110,255,0.25)" },
  };

  return {
    border: `1px solid ${palette[tone].border}`,
    background: palette[tone].bg,
    borderRadius: 18,
    padding: 16,
    display: "grid",
    gap: 6,
  };
}

function BannerCard({
  tone,
  title,
  subtitle,
}: {
  tone: NoticeTone;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={toneCardStyle(tone)}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ color: "var(--text-muted)", lineHeight: 1.55 }}>{subtitle}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  return <span style={statusBadgeStyle(status)}>{statusLabel(status)}</span>;
}

function MetricBox({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div style={infoCardStyle()}>
      <div style={{ color: "var(--text-muted)", fontSize: 14 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 28, lineHeight: 1.1 }}>{value}</div>
      <div style={{ color: "var(--text-muted)" }}>{helper}</div>
    </div>
  );
}

export default function AdminReferralPayoutsPage() {
  const router = useRouter();
  const { authReady, requireAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [adminKey, setAdminKey] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(DEFAULT_STATUS_FILTER);

  const [queueData, setQueueData] = useState<QueueResponse | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState("");
  const [selectedPayout, setSelectedPayout] = useState<PayoutRow | null>(null);

  const [searchPayoutId, setSearchPayoutId] = useState("");
  const [searchAccountId, setSearchAccountId] = useState("");
  const [searchProviderReference, setSearchProviderReference] = useState("");

  const [queueDateFrom, setQueueDateFrom] = useState("");
  const [queueDateTo, setQueueDateTo] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");

  const [providerReference, setProviderReference] = useState("");
  const [providerTransferCode, setProviderTransferCode] = useState("");
  const [failureReason, setFailureReason] = useState("");

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
  const [lastAction, setLastAction] = useState<ActionType | "">("");
  const [confirmAction, setConfirmAction] = useState<ActionType | "">("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = (window.localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || "").trim();
      if (stored) setAdminKey(stored);
    }
  }, []);

  const queueRows = useMemo(() => {
    return Array.isArray(queueData?.rows) ? queueData!.rows! : [];
  }, [queueData]);

  const filteredQueueRows = useMemo(() => {
    const payoutTerm = searchPayoutId.trim().toLowerCase();
    const accountTerm = searchAccountId.trim().toLowerCase();
    const providerRefTerm = searchProviderReference.trim().toLowerCase();
    const fromDate = queueDateFrom ? new Date(`${queueDateFrom}T00:00:00`) : null;
    const toDate = queueDateTo ? new Date(`${queueDateTo}T23:59:59`) : null;

    return queueRows.filter((row) => {
      const payoutMatch = !payoutTerm || safeText(row.id, "").toLowerCase().includes(payoutTerm);
      const accountMatch = !accountTerm || safeText(row.account_id, "").toLowerCase().includes(accountTerm);
      const providerRefMatch =
        !providerRefTerm ||
        safeText(row.provider_reference, "").toLowerCase().includes(providerRefTerm);

      const candidateDateValue =
        row.requested_at || row.created_at || row.updated_at || row.processed_at || row.paid_at || row.failed_at;
      const candidateDate = candidateDateValue ? new Date(candidateDateValue) : null;
      const afterFrom = !fromDate || !candidateDate || candidateDate >= fromDate;
      const beforeTo = !toDate || !candidateDate || candidateDate <= toDate;

      return payoutMatch && accountMatch && providerRefMatch && afterFrom && beforeTo;
    });
  }, [
    queueRows,
    searchPayoutId,
    searchAccountId,
    searchProviderReference,
    queueDateFrom,
    queueDateTo,
  ]);

  const visibleAuditRows = useMemo(() => {
    const fromDate = auditDateFrom ? new Date(`${auditDateFrom}T00:00:00`) : null;
    const toDate = auditDateTo ? new Date(`${auditDateTo}T23:59:59`) : null;

    return auditRows.filter((row) => {
      const created = row.created_at ? new Date(row.created_at) : null;
      const afterFrom = !fromDate || !created || created >= fromDate;
      const beforeTo = !toDate || !created || created <= toDate;
      return afterFrom && beforeTo;
    });
  }, [auditRows, auditDateFrom, auditDateTo]);

  const selectedStatus = normalizeStatus(selectedPayout?.status);

  const summary = useMemo(() => {
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

  const visibleMetrics = useMemo(() => {
    const totalRows = filteredQueueRows.length;
    const pending = filteredQueueRows.filter((row) => normalizeStatus(row.status) === "pending").length;
    const processing = filteredQueueRows.filter((row) => normalizeStatus(row.status) === "processing").length;
    const failed = filteredQueueRows.filter((row) => normalizeStatus(row.status) === "failed").length;
    const paid = filteredQueueRows.filter((row) => normalizeStatus(row.status) === "paid").length;
    const totalAmount = filteredQueueRows.reduce((sum, row) => sum + safeNumber(row.amount), 0);

    return {
      totalRows,
      pending,
      processing,
      failed,
      paid,
      totalAmount,
    };
  }, [filteredQueueRows]);

  const actionHint = useMemo(() => {
    if (!selectedPayout) return "Select a payout row to enable actions.";
    if (selectedStatus === "paid") {
      return "This payout is already marked as paid. Further status changes are disabled.";
    }
    if (selectedStatus === "processing") {
      return "This payout is already in processing. You can mark it paid or failed.";
    }
    if (selectedStatus === "failed") {
      return "This payout previously failed. Retry by marking it processing after correcting any provider or reference details.";
    }
    if (selectedStatus === "pending") {
      return "Recommended flow: mark processing first, then mark paid after provider transfer confirmation.";
    }
    return "Unknown payout status detected. Apply actions with care.";
  }, [selectedPayout, selectedStatus]);

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

  const retryHelper = useMemo(() => {
    if (selectedStatus !== "failed") return "";
    if (failureReason.trim()) {
      return "Failure reason is loaded. Update provider fields if needed, then use Mark Processing to retry.";
    }
    return "Load or enter a failure reason, review provider details, then retry with Mark Processing.";
  }, [selectedStatus, failureReason]);

  const filterSummary = useMemo(() => {
    const parts: string[] = [
      `Status scope: ${statusFilter.split(",").join(" + ")}`,
    ];

    if (searchPayoutId.trim()) parts.push(`Payout contains "${searchPayoutId.trim()}"`);
    if (searchAccountId.trim()) parts.push(`Account contains "${searchAccountId.trim()}"`);
    if (searchProviderReference.trim()) {
      parts.push(`Provider ref contains "${searchProviderReference.trim()}"`);
    }
    if (queueDateFrom) parts.push(`From ${queueDateFrom}`);
    if (queueDateTo) parts.push(`To ${queueDateTo}`);

    return parts.join(" • ");
  }, [
    statusFilter,
    searchPayoutId,
    searchAccountId,
    searchProviderReference,
    queueDateFrom,
    queueDateTo,
  ]);

  const auditFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (auditDateFrom) parts.push(`From ${auditDateFrom}`);
    if (auditDateTo) parts.push(`To ${auditDateTo}`);
    return parts.length ? parts.join(" • ") : "No audit date filter applied.";
  }, [auditDateFrom, auditDateTo]);

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
        e instanceof Error ? e.message : "Could not load audit history.";
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

      const payout = data?.payout || null;
      setSelectedPayout(payout);
      setSelectedPayoutId(payoutId);

      setProviderReference(safeText(payout?.provider_reference, ""));
      setProviderTransferCode(safeText(payout?.provider_transfer_code, ""));
      setFailureReason(safeText(payout?.failure_reason, ""));

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

  async function loadQueue(showRefreshState = false, overrideStatus?: StatusFilterValue) {
    if (!requireAuth()) return;

    const key = adminKey.trim();
    const appliedStatus = overrideStatus || statusFilter;

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
        `/admin/referral-payouts?status=${encodeURIComponent(appliedStatus)}&limit=300`,
        key
      );

      const rows = Array.isArray(data?.rows) ? data.rows : [];
      setQueueData({ ...data, rows });
      setLastRefreshedAt(new Date().toISOString());

      const visibleIds = new Set(
        rows
          .filter((row) => {
            const payoutTerm = searchPayoutId.trim().toLowerCase();
            const accountTerm = searchAccountId.trim().toLowerCase();
            const providerRefTerm = searchProviderReference.trim().toLowerCase();
            const payoutMatch = !payoutTerm || safeText(row.id, "").toLowerCase().includes(payoutTerm);
            const accountMatch = !accountTerm || safeText(row.account_id, "").toLowerCase().includes(accountTerm);
            const providerRefMatch =
              !providerRefTerm ||
              safeText(row.provider_reference, "").toLowerCase().includes(providerRefTerm);
            return payoutMatch && accountMatch && providerRefMatch;
          })
          .map((row) => row.id)
      );

      const nextId =
        selectedPayoutId && visibleIds.has(selectedPayoutId)
          ? selectedPayoutId
          : rows[0]?.id || "";

      if (nextId) {
        await loadSinglePayout(nextId, key);
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

  useEffect(() => {
    if (!selectedPayoutId) return;
    const stillVisible = filteredQueueRows.some((row) => row.id === selectedPayoutId);
    if (!stillVisible) {
      const fallback = filteredQueueRows[0];
      if (fallback) {
        void loadSinglePayout(fallback.id);
      } else {
        setSelectedPayout(null);
        setSelectedPayoutId("");
        setAuditRows([]);
        setAuditError("");
        setAuditInfo("");
      }
    }
  }, [filteredQueueRows, selectedPayoutId]);

  async function applyQuickFilter(nextFilter: StatusFilterValue) {
    setStatusFilter(nextFilter);
    await loadQueue(true, nextFilter);
  }

  function clearSearchFields() {
    setSearchPayoutId("");
    setSearchAccountId("");
    setSearchProviderReference("");
    setQueueDateFrom("");
    setQueueDateTo("");
    setAuditDateFrom("");
    setAuditDateTo("");
  }

  function handleExportQueueCsv() {
    if (filteredQueueRows.length === 0) {
      setNotice({
        tone: "warn",
        title: "Nothing to export",
        subtitle: "There are no visible payout queue rows to export.",
      });
      return;
    }

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`payout-queue-${stamp}.csv`, buildQueueCsv(filteredQueueRows));
  }

  function handleExportAuditCsv() {
    if (visibleAuditRows.length === 0) {
      setNotice({
        tone: "warn",
        title: "Nothing to export",
        subtitle: "There are no visible audit history rows to export.",
      });
      return;
    }

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const payoutId = safeText(selectedPayoutId, "payout");
    downloadCsv(`payout-audit-${payoutId}-${stamp}.csv`, buildAuditCsv(visibleAuditRows));
  }

  async function handleCopy(label: string, value: string) {
    if (!value) return;
    const ok = await copyText(value);
    setNotice({
      tone: ok ? "good" : "warn",
      title: ok ? `${label} copied` : `Could not copy ${label.toLowerCase()}`,
      subtitle: ok ? `${label} is now in your clipboard.` : "Clipboard access was not available.",
    });
  }

  function requestStatusUpdate(action: ActionType) {
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
      setActionError("Enter a failure reason before marking the payout as failed.");
      return;
    }

    if (action === "mark-paid" || action === "mark-failed") {
      setConfirmAction(action);
      return;
    }

    void submitStatusUpdate(action);
  }

  async function submitStatusUpdate(action: ActionType) {
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

    const body: Record<string, unknown> = {
      provider_reference: providerReference.trim() || undefined,
      provider_transfer_code: providerTransferCode.trim() || undefined,
    };

    if (action === "mark-failed") {
      body.failure_reason = failureReason.trim() || undefined;
    }

    try {
      await adminFetch(
        `/admin/referral-payouts/${encodeURIComponent(payoutId)}/${action}`,
        key,
        { method: "POST", body }
      );

      const pretty =
        action === "mark-processing"
          ? "marked as processing"
          : action === "mark-paid"
            ? "marked as paid"
            : "marked as failed";

      setActionSuccess(`Payout ${pretty} successfully.`);
      setNotice({
        tone: "good",
        title: "Payout updated",
        subtitle: `The selected payout was ${pretty}.`,
      });

      await loadQueue(true);
      await loadSinglePayout(payoutId, key);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Could not update payout.");
    } finally {
      setSubmitting(false);
    }
  }

  const confirmationContent = useMemo(() => {
    if (!confirmAction) return null;

    const payoutId = safeText(selectedPayout?.id, "selected payout");
    const amount = formatMoney(selectedPayout?.amount, safeText(selectedPayout?.currency, "NGN"));

    if (confirmAction === "mark-paid") {
      return {
        title: "Confirm Mark Paid",
        subtitle: `You are about to mark payout ${payoutId} as paid for ${amount}. Only continue after provider transfer confirmation.`,
        buttonLabel: "Yes, Mark Paid",
      };
    }

    return {
      title: "Confirm Mark Failed",
      subtitle: `You are about to mark payout ${payoutId} as failed. Confirm that the failure reason is accurate before continuing.`,
      buttonLabel: "Yes, Mark Failed",
    };
  }, [confirmAction, selectedPayout]);

  return (
    <>
      <AppShell
        title="Admin Payout Queue"
        subtitle="Review pending referral payouts, inspect payout rows, and mark them as processing, paid, or failed."
        actions={
          <>
            <button
              type="button"
              style={shellButtonPrimary()}
              onClick={() => void loadQueue(true)}
            >
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
        <div style={responsiveStackStyle()}>
          {notice ? (
            <BannerCard tone={notice.tone} title={notice.title} subtitle={notice.subtitle} />
          ) : null}

          {errorText ? (
            <BannerCard
              tone="danger"
              title="Admin payout queue could not load"
              subtitle={errorText}
            />
          ) : null}

          <WorkspaceSectionCard
            title="Summary strip"
            subtitle="See the bigger picture fast, then jump into a filter with one click."
          >
            <div style={responsiveStackStyle()}>
              <div style={metricGridStyle()}>
                <MetricBox
                  label="Pending Amount"
                  value={formatMoney(summary.pendingAmount)}
                  helper={`${summary.pendingCount} pending row(s)`}
                />
                <MetricBox
                  label="Processing Amount"
                  value={formatMoney(summary.processingAmount)}
                  helper={`${summary.processingCount} processing row(s)`}
                />
                <MetricBox
                  label="Failed Amount"
                  value={formatMoney(summary.failedAmount)}
                  helper={`${summary.failedCount} failed row(s)`}
                />
                <MetricBox
                  label="Paid Amount"
                  value={formatMoney(summary.paidAmount)}
                  helper={`${summary.paidCount} paid row(s)`}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button type="button" style={quickFilterChipStyle(statusFilter === "pending")} onClick={() => void applyQuickFilter("pending")}>
                  Pending Only
                </button>
                <button type="button" style={quickFilterChipStyle(statusFilter === "processing")} onClick={() => void applyQuickFilter("processing")}>
                  Processing Only
                </button>
                <button type="button" style={quickFilterChipStyle(statusFilter === "failed")} onClick={() => void applyQuickFilter("failed")}>
                  Failed Only
                </button>
                <button type="button" style={quickFilterChipStyle(statusFilter === "paid")} onClick={() => void applyQuickFilter("paid")}>
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
            </div>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Admin access and queue controls"
            subtitle="Load the queue, narrow the visible rows, and export what you are seeing."
          >
            <div style={twoColumnStyle()}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle()}>Admin API Key</div>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin key"
                    style={inputStyle()}
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle()}>Queue Filter</div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
                    style={inputStyle()}
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
                  <div style={labelStyle()}>Search by Payout ID</div>
                  <input
                    type="text"
                    value={searchPayoutId}
                    onChange={(e) => setSearchPayoutId(e.target.value)}
                    placeholder="Paste full or partial payout ID"
                    style={inputStyle()}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle()}>Search by Account ID</div>
                  <input
                    type="text"
                    value={searchAccountId}
                    onChange={(e) => setSearchAccountId(e.target.value)}
                    placeholder="Paste full or partial account ID"
                    style={inputStyle()}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle()}>Search by Provider Reference</div>
                  <input
                    type="text"
                    value={searchProviderReference}
                    onChange={(e) => setSearchProviderReference(e.target.value)}
                    placeholder="Paste full or partial provider reference"
                    style={inputStyle()}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={labelStyle()}>Queue Date From</div>
                    <input
                      type="date"
                      value={queueDateFrom}
                      onChange={(e) => setQueueDateFrom(e.target.value)}
                      style={inputStyle()}
                    />
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={labelStyle()}>Queue Date To</div>
                    <input
                      type="date"
                      value={queueDateTo}
                      onChange={(e) => setQueueDateTo(e.target.value)}
                      style={inputStyle()}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button type="button" style={shellButtonPrimary()} onClick={() => void loadQueue(true)}>
                    Load Queue
                  </button>

                  <button type="button" style={shellButtonSecondary()} onClick={clearSearchFields}>
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

                  <button type="button" style={exportButtonStyle()} onClick={handleExportQueueCsv}>
                    Export Queue CSV
                  </button>
                </div>
              </div>

              <div style={responsiveStackStyle()}>
                <div style={metricGridStyle()}>
                  <MetricBox label="Queue Rows" value={String(visibleMetrics.totalRows)} helper="Visible rows after filter/search." />
                  <MetricBox label="Pending" value={String(visibleMetrics.pending)} helper="Visible requests waiting for action." />
                  <MetricBox label="Processing" value={String(visibleMetrics.processing)} helper="Visible rows already in transfer processing." />
                  <MetricBox label="Failed" value={String(visibleMetrics.failed)} helper="Visible rows needing admin attention." />
                  <MetricBox label="Paid" value={String(visibleMetrics.paid)} helper="Visible rows already completed." />
                  <MetricBox label="Queue Amount" value={formatMoney(visibleMetrics.totalAmount)} helper="Combined visible amount." />
                </div>

                <div style={summaryBarStyle()}>
                  <div style={{ fontWeight: 800 }}>Active filter summary</div>
                  <div style={{ color: "var(--text-muted)" }}>{filterSummary}</div>
                  <div style={{ color: "var(--text-muted)" }}>
                    Last refreshed: <strong style={{ color: "var(--text)" }}>{formatDateTime(lastRefreshedAt)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </WorkspaceSectionCard>

          {loading ? (
            <WorkspaceSectionCard
              title="Loading payout queue"
              subtitle="Please wait while payout queue data is being fetched."
            >
              <div style={{ color: "var(--text-muted)" }}>Loading...</div>
            </WorkspaceSectionCard>
          ) : (
            <div style={twoColumnStyle()}>
              <WorkspaceSectionCard
                title="Payout queue"
                subtitle="Click a row to inspect it, copy details, review audit history, and update the status."
              >
                {filteredQueueRows.length === 0 ? (
                  <div style={infoCardStyle()}>
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
                        <div
                          key={row.id}
                          style={cardStyle(active)}
                          onClick={() => void loadSinglePayout(row.id)}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ fontWeight: 900, fontSize: 18 }}>{safeText(row.id)}</div>
                            <StatusBadge status={rowStatus} />
                          </div>

                          <div style={{ color: "var(--text-muted)" }}>
                            Account: {safeText(row.account_id)}
                          </div>

                          <div style={{ color: "var(--text-muted)" }}>
                            Amount: {formatMoney(row.amount, safeText(row.currency, "NGN"))}
                          </div>

                          <div style={{ color: "var(--text-muted)" }}>
                            Provider Ref: {safeText(row.provider_reference, "None")}
                          </div>

                          <div style={{ color: "var(--text-muted)" }}>
                            Requested: {formatDateOnly(row.requested_at || row.created_at)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </WorkspaceSectionCard>

              <WorkspaceSectionCard
                title="Payout details"
                subtitle="Review the selected row carefully before applying any status changes."
              >
                {!selectedPayout ? (
                  <div style={infoCardStyle()}>
                    <div style={{ fontWeight: 800 }}>No payout selected</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      Choose a payout row from the queue to view full details.
                    </div>
                  </div>
                ) : (
                  <div style={responsiveStackStyle()}>
                    <BannerCard
                      tone={selectedStatus === "paid" ? "good" : selectedStatus === "failed" ? "warn" : "default"}
                      title={`Current status: ${safeText(selectedPayout.status)}`}
                      subtitle={actionHint}
                    />

                    {retryHelper ? (
                      <BannerCard
                        tone="default"
                        title="Retry helper"
                        subtitle={retryHelper}
                      />
                    ) : null}

                    {actionError ? (
                      <BannerCard
                        tone="danger"
                        title={lastAction ? `${actionLabel(lastAction)} failed` : "Action failed"}
                        subtitle={actionError}
                      />
                    ) : null}

                    {actionSuccess ? (
                      <BannerCard
                        tone="good"
                        title="Action completed"
                        subtitle={actionSuccess}
                      />
                    ) : null}

                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <StatusBadge status={selectedStatus} />
                    </div>

                    <div style={metricGridStyle()}>
                      <MetricBox
                        label="Amount"
                        value={formatMoney(selectedPayout.amount, safeText(selectedPayout.currency, "NGN"))}
                        helper="Requested payout amount."
                      />
                      <MetricBox
                        label="Status"
                        value={safeText(selectedPayout.status)}
                        helper="Current backend payout state."
                      />
                      <MetricBox
                        label="Requested"
                        value={formatDateOnly(selectedPayout.requested_at || selectedPayout.created_at)}
                        helper="When this payout entered the queue."
                      />
                      <MetricBox
                        label="Processed"
                        value={formatDateOnly(selectedPayout.processed_at)}
                        helper="When processing last started or completed."
                      />
                    </div>

                    <div style={infoCardStyle()}>
                      <div style={labelStyle()}>Payout ID</div>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>{safeText(selectedPayout.id)}</div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          style={copyButtonStyle()}
                          onClick={() => void handleCopy("Payout ID", safeText(selectedPayout.id, ""))}
                        >
                          Copy Payout ID
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={labelStyle()}>Provider Reference</div>
                        <input
                          type="text"
                          value={providerReference}
                          onChange={(e) => setProviderReference(e.target.value)}
                          placeholder="Example: PSTK-TRANSFER-001"
                          style={inputStyle()}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            style={copyButtonStyle()}
                            onClick={() => void handleCopy("Provider Reference", providerReference)}
                          >
                            Copy Provider Ref
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={labelStyle()}>Provider Transfer Code</div>
                        <input
                          type="text"
                          value={providerTransferCode}
                          onChange={(e) => setProviderTransferCode(e.target.value)}
                          placeholder="Example: TRF-001"
                          style={inputStyle()}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            style={copyButtonStyle()}
                            onClick={() => void handleCopy("Provider Transfer Code", providerTransferCode)}
                          >
                            Copy Transfer Code
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={labelStyle()}>Failure Reason</div>
                        <textarea
                          value={failureReason}
                          onChange={(e) => setFailureReason(e.target.value)}
                          placeholder="Use only when marking payout as failed"
                          style={textareaStyle()}
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

                    <div style={infoCardStyle()}>
                      <div style={labelStyle()}>Provider</div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{safeText(selectedPayout.provider)}</div>
                      <div style={labelStyle()}>Last Failure Reason</div>
                      <div style={{ fontWeight: 700 }}>{safeText(selectedPayout.failure_reason, "None")}</div>
                    </div>

                    <WorkspaceSectionCard
                      title="Audit history"
                      subtitle="Review the admin activity trail for the currently selected payout."
                    >
                      <div style={responsiveStackStyle()}>
                        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr auto" }}>
                          <div style={{ display: "grid", gap: 6 }}>
                            <div style={labelStyle()}>Audit Date From</div>
                            <input
                              type="date"
                              value={auditDateFrom}
                              onChange={(e) => setAuditDateFrom(e.target.value)}
                              style={inputStyle()}
                            />
                          </div>

                          <div style={{ display: "grid", gap: 6 }}>
                            <div style={labelStyle()}>Audit Date To</div>
                            <input
                              type="date"
                              value={auditDateTo}
                              onChange={(e) => setAuditDateTo(e.target.value)}
                              style={inputStyle()}
                            />
                          </div>

                          <div style={{ display: "flex", alignItems: "end" }}>
                            <button type="button" style={exportButtonStyle()} onClick={handleExportAuditCsv}>
                              Export Audit CSV
                            </button>
                          </div>
                        </div>

                        <div style={summaryBarStyle()}>
                          <div style={{ fontWeight: 800 }}>Audit filter summary</div>
                          <div style={{ color: "var(--text-muted)" }}>{auditFilterSummary}</div>
                        </div>

                        {auditLoading ? (
                          <div style={{ color: "var(--text-muted)" }}>Loading audit history...</div>
                        ) : auditError ? (
                          <BannerCard tone="warn" title="Audit history unavailable" subtitle={auditError} />
                        ) : auditInfo ? (
                          <div style={infoCardStyle()}>
                            <div style={{ fontWeight: 800 }}>No audit entries yet</div>
                            <div style={{ color: "var(--text-muted)" }}>{auditInfo}</div>
                          </div>
                        ) : visibleAuditRows.length === 0 ? (
                          <div style={infoCardStyle()}>
                            <div style={{ fontWeight: 800 }}>No audit rows match the current date filter</div>
                            <div style={{ color: "var(--text-muted)" }}>
                              Clear or widen the audit date range to see more history.
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: 12 }}>
                            {visibleAuditRows.map((row, index) => (
                              <div key={row.id || `${row.created_at || "audit"}-${index}`} style={auditCardStyle()}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                  }}
                                >
                                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                                    {actionLabel(row.action)}
                                  </div>
                                  <div style={{ color: "var(--text-muted)" }}>
                                    {formatDateOnly(row.created_at)}
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
                      </div>
                    </WorkspaceSectionCard>
                  </div>
                )}
              </WorkspaceSectionCard>
            </div>
          )}
        </div>
      </AppShell>

      {confirmationContent ? (
        <div style={overlayStyle()}>
          <div style={modalCardStyle()}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{confirmationContent.title}</div>
            <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              {confirmationContent.subtitle}
            </div>

            {confirmAction === "mark-failed" ? (
              <div style={infoCardStyle()}>
                <div style={{ color: "var(--text-muted)" }}>Failure reason to submit</div>
                <div style={{ fontWeight: 800 }}>{safeText(failureReason, "None")}</div>
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
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
                {submitting ? "Working." : confirmationContent.buttonLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
