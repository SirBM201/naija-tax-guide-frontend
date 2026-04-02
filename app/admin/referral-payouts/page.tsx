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
type SingleActionType = "mark-processing" | "mark-paid" | "mark-failed";
type BulkActionType = SingleActionType | "";
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
  metadata?: Record<string, unknown> | null;
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

type BulkResponse = {
  ok?: boolean;
  action?: string;
  requested_count?: number;
  success_count?: number;
  failure_count?: number;
  successes?: { payout_id: string; status?: string; reward_count?: number }[];
  failures?: { payout_id: string; error: string }[];
  error?: string;
  root_cause?: string;
};

const ADMIN_KEY_STORAGE_KEY = "nt_admin_api_key";
const DEFAULT_STATUS_FILTER: StatusFilterValue = "pending,processing,failed";

function resolveApiBase(): string {
  const envBase = (
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ""
  ).trim();

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
  if (
    status === "pending" ||
    status === "processing" ||
    status === "paid" ||
    status === "failed"
  ) {
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
      text: "#2563eb",
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
    gridTemplateColumns: "minmax(320px, 460px) minmax(0, 1fr)",
  };
}

function stackStyle(): React.CSSProperties {
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
    maxWidth: 640,
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

function stickyBarStyle(): React.CSSProperties {
  return {
    position: "sticky",
    top: 12,
    zIndex: 20,
    border: "1px solid rgba(78,110,255,0.25)",
    background: "rgba(78,110,255,0.08)",
    borderRadius: 18,
    padding: 14,
    display: "grid",
    gap: 10,
  };
}

function queueRowStyle(active: boolean): React.CSSProperties {
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
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [adminKey, setAdminKey] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(DEFAULT_STATUS_FILTER);

  const [queueData, setQueueData] = useState<QueueResponse | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState("");
  const [selectedPayout, setSelectedPayout] = useState<PayoutRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
  const [operatorNotes, setOperatorNotes] = useState("");

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
  const [bulkResultText, setBulkResultText] = useState("");
  const [lastAction, setLastAction] = useState<SingleActionType | "">("");
  const [confirmAction, setConfirmAction] = useState<SingleActionType | "">("");
  const [confirmBulkAction, setConfirmBulkAction] = useState<BulkActionType>("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = (window.localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || "").trim();
      if (stored) setAdminKey(stored);
    }
  }, []);

  const queueRows = useMemo(() => {
    return Array.isArray(queueData?.rows) ? queueData.rows : [];
  }, [queueData]);

  const filteredQueueRows = useMemo(() => {
    const payoutTerm = searchPayoutId.trim().toLowerCase();
    const accountTerm = searchAccountId.trim().toLowerCase();
    const providerRefTerm = searchProviderReference.trim().toLowerCase();
    const fromDate = queueDateFrom ? new Date(`${queueDateFrom}T00:00:00`) : null;
    const toDate = queueDateTo ? new Date(`${queueDateTo}T23:59:59`) : null;

    return queueRows.filter((row) => {
      const payoutMatch = !payoutTerm || safeText(row.id, "").toLowerCase().includes(payoutTerm);
      const accountMatch =
        !accountTerm || safeText(row.account_id, "").toLowerCase().includes(accountTerm);
      const providerRefMatch =
        !providerRefTerm ||
        safeText(row.provider_reference, "").toLowerCase().includes(providerRefTerm);

      const candidateDateValue =
        row.requested_at ||
        row.created_at ||
        row.updated_at ||
        row.processed_at ||
        row.paid_at ||
        row.failed_at;
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
  const selectedPayoutIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedRows = useMemo(() => {
    const map = new Map(queueRows.map((row) => [row.id, row]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as PayoutRow[];
  }, [selectedIds, queueRows]);

  const selectedStatuses = useMemo(
    () => selectedRows.map((row) => normalizeStatus(row.status)),
    [selectedRows]
  );

  const selectedAccounts = useMemo(
    () =>
      Array.from(new Set(selectedRows.map((row) => safeText(row.account_id, "")))).filter(Boolean),
    [selectedRows]
  );

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
    const processing = filteredQueueRows.filter(
      (row) => normalizeStatus(row.status) === "processing"
    ).length;
    const failed = filteredQueueRows.filter((row) => normalizeStatus(row.status) === "failed").length;
    const paid = filteredQueueRows.filter((row) => normalizeStatus(row.status) === "paid").length;
    const totalAmount = filteredQueueRows.reduce((sum, row) => sum + safeNumber(row.amount), 0);

    return { totalRows, pending, processing, failed, paid, totalAmount };
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
      return "This payout previously failed. Retry by marking it processing after correcting any provider details.";
    }
    if (selectedStatus === "pending") {
      return "Recommended flow: mark processing first, then mark paid after transfer confirmation.";
    }
    return "Unknown payout status detected. Apply actions with care.";
  }, [selectedPayout, selectedStatus]);

  const filterSummary = useMemo(() => {
    const parts: string[] = [`Status scope: ${statusFilter.split(",").join(" + ")}`];
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

  const canBulkMarkProcessing =
    selectedRows.length > 0 &&
    !bulkSubmitting &&
    selectedStatuses.every(
      (status) => status === "pending" || status === "failed" || status === "unknown"
    );

  const canBulkMarkPaid =
    selectedRows.length > 0 &&
    !bulkSubmitting &&
    selectedStatuses.every((status) => status === "processing" || status === "unknown");

  const canBulkMarkFailed =
    selectedRows.length > 0 &&
    !bulkSubmitting &&
    selectedStatuses.every((status) => status !== "paid") &&
    !!failureReason.trim();

  const bulkAmount = useMemo(
    () => selectedRows.reduce((sum, row) => sum + safeNumber(row.amount), 0),
    [selectedRows]
  );

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
      setAuditError(e instanceof Error ? e.message : "Could not load audit history.");
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

  async function loadQueue(
    showRefreshState = false,
    overrideStatus?: StatusFilterValue
  ): Promise<PayoutRow[]> {
    if (!requireAuth()) return [];

    const key = adminKey.trim();
    const appliedStatus = overrideStatus || statusFilter;

    if (!key) {
      setLoading(false);
      setRefreshing(false);
      setQueueData({ ok: true, count: 0, rows: [] });
      setSelectedPayout(null);
      setSelectedPayoutId("");
      setSelectedIds([]);
      setAuditRows([]);
      setAuditError("");
      setAuditInfo("");
      setErrorText("");
      return [];
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

      setSelectedIds((current) => current.filter((id) => rows.some((row) => row.id === id)));

      const nextId =
        selectedPayoutId && rows.some((row) => row.id === selectedPayoutId)
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

      return rows;
    } catch (e: unknown) {
      setQueueData(null);
      setSelectedPayout(null);
      setSelectedPayoutId("");
      setSelectedIds([]);
      setAuditRows([]);
      setAuditError("");
      setAuditInfo("");
      setErrorText(e instanceof Error ? e.message : "Could not load payout queue.");
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    void loadQueue(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredQueueRows, selectedPayoutId]);

  function clearSearchFields() {
    setSearchPayoutId("");
    setSearchAccountId("");
    setSearchProviderReference("");
    setQueueDateFrom("");
    setQueueDateTo("");
    setAuditDateFrom("");
    setAuditDateTo("");
  }

  async function applyQuickFilter(nextFilter: StatusFilterValue) {
    setStatusFilter(nextFilter);
    await loadQueue(true, nextFilter);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = filteredQueueRows.map((row) => row.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedPayoutIdsSet.has(id));

    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])));
  }

  function clearSelection() {
    setSelectedIds([]);
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

  function handleExportSelectedCsv() {
    if (selectedRows.length === 0) {
      setNotice({
        tone: "warn",
        title: "Nothing to export",
        subtitle: "Select one or more payout rows first.",
      });
      return;
    }

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`payout-selected-${stamp}.csv`, buildQueueCsv(selectedRows));
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

  async function handleCopyPayoutBundle() {
    if (!selectedPayout) return;
    await handleCopy("Payout details", JSON.stringify(selectedPayout, null, 2));
  }

  async function handleCopyAuditJson(row: AuditLogRow) {
    await handleCopy("Audit row JSON", JSON.stringify(row, null, 2));
  }

  function requestSingleAction(action: SingleActionType) {
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

    void submitSingleAction(action);
  }

  async function submitSingleAction(action: SingleActionType) {
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
      operator_notes: operatorNotes.trim() || undefined,
    };

    if (action === "mark-failed") {
      body.failure_reason = failureReason.trim() || undefined;
    }

    try {
      const data = await adminFetch<SinglePayoutResponse>(
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

      const rewardCount = Array.isArray((data as any)?.updated_reward_ids)
        ? (data as any).updated_reward_ids.length
        : 0;

      setActionSuccess(
        rewardCount > 0
          ? `Payout ${pretty} successfully. Reward rows updated: ${rewardCount}.`
          : `Payout ${pretty} successfully.`
      );
      setNotice({
        tone: "good",
        title: "Payout updated",
        subtitle:
          rewardCount > 0
            ? `The selected payout was ${pretty}. Reward rows updated: ${rewardCount}.`
            : `The selected payout was ${pretty}.`,
      });

      await loadQueue(true);
      await loadSinglePayout(payoutId, key);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Could not update payout.");
    } finally {
      setSubmitting(false);
    }
  }

  function requestBulkAction(action: BulkActionType) {
    setBulkResultText("");
    setActionError("");

    if (!action) return;

    if (selectedRows.length === 0) {
      setActionError("Select one or more payout rows first.");
      return;
    }

    if (action === "mark-processing" && !canBulkMarkProcessing) {
      setActionError("Bulk mark processing only supports pending or failed selections.");
      return;
    }
    if (action === "mark-paid" && !canBulkMarkPaid) {
      setActionError("Bulk mark paid only supports processing selections.");
      return;
    }
    if (action === "mark-failed" && !canBulkMarkFailed) {
      setActionError("Bulk mark failed needs non-paid selections and a failure reason.");
      return;
    }

    setConfirmBulkAction(action);
  }

  async function submitBulkAction(action: Exclude<BulkActionType, "">) {
    if (!requireAuth()) return;

    const key = adminKey.trim();

    if (!key) {
      setNotice({
        tone: "warn",
        title: "Admin key required",
        subtitle: "Enter your admin API key before using bulk actions.",
      });
      return;
    }

    if (selectedRows.length === 0) {
      setActionError("Select one or more payout rows first.");
      return;
    }

    setBulkSubmitting(true);
    setConfirmBulkAction("");
    setBulkResultText("");

    try {
      const data = await adminFetch<BulkResponse>("/admin/referral-payouts/bulk", key, {
        method: "POST",
        body: {
          action,
          payout_ids: selectedIds,
          provider_reference: providerReference.trim() || undefined,
          provider_transfer_code: providerTransferCode.trim() || undefined,
          failure_reason: action === "mark-failed" ? failureReason.trim() || undefined : undefined,
          operator_notes: operatorNotes.trim() || undefined,
        },
      });

      const successCount = Number(data?.success_count || 0);
      const failureCount = Number(data?.failure_count || 0);

      const failurePreview = Array.isArray(data?.failures)
        ? data.failures
            .slice(0, 3)
            .map((item) => `${item.payout_id}: ${item.error}`)
            .join(" | ")
        : "";

      setBulkResultText(
        failurePreview
          ? `Bulk ${actionLabel(action)} completed. Success: ${successCount}. Failed: ${failureCount}. ${failurePreview}`
          : `Bulk ${actionLabel(action)} completed. Success: ${successCount}. Failed: ${failureCount}.`
      );

      setNotice({
        tone: failureCount > 0 ? "warn" : "good",
        title: "Bulk action completed",
        subtitle:
          failurePreview || failureCount === 0
            ? `Success: ${successCount}. Failed: ${failureCount}.`
            : "The action completed with mixed results.",
      });

      const refreshedRows = await loadQueue(true);
      setSelectedIds([]);

      const nextId =
        refreshedRows.find((row) => row.id === selectedPayoutId)?.id ||
        refreshedRows[0]?.id ||
        "";

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
      setActionError(e instanceof Error ? e.message : "Bulk action failed.");
    } finally {
      setBulkSubmitting(false);
    }
  }

  const singleConfirmationContent = useMemo(() => {
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

  const bulkConfirmationContent = useMemo(() => {
    if (!confirmBulkAction) return null;

    const count = selectedRows.length;
    const amount = formatMoney(
      bulkAmount,
      selectedRows[0] ? safeText(selectedRows[0].currency, "NGN") : "NGN"
    );

    if (confirmBulkAction === "mark-processing") {
      return {
        title: "Confirm Bulk Mark Processing",
        subtitle: `You are about to move ${count} payout row(s) into processing for a combined ${amount}.`,
        buttonLabel: "Yes, Bulk Mark Processing",
      };
    }

    if (confirmBulkAction === "mark-paid") {
      return {
        title: "Confirm Bulk Mark Paid",
        subtitle: `You are about to mark ${count} payout row(s) as paid for a combined ${amount}. Only continue after transfer confirmation for every selected row.`,
        buttonLabel: "Yes, Bulk Mark Paid",
      };
    }

    return {
      title: "Confirm Bulk Mark Failed",
      subtitle: `You are about to mark ${count} payout row(s) as failed. Make sure the failure reason applies to every selected row.`,
      buttonLabel: "Yes, Bulk Mark Failed",
    };
  }, [confirmBulkAction, selectedRows, bulkAmount]);

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
              {refreshing ? "Refreshing..." : "Refresh"}
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
        <div style={stackStyle()}>
          {notice ? <BannerCard tone={notice.tone} title={notice.title} subtitle={notice.subtitle} /> : null}

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
            <div style={stackStyle()}>
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
                  style={quickFilterChipStyle(
                    statusFilter === "pending,processing,failed,paid"
                  )}
                  onClick={() => void applyQuickFilter("pending,processing,failed,paid")}
                >
                  All Major Statuses
                </button>
              </div>
            </div>
          </WorkspaceSectionCard>

          {selectedRows.length > 0 ? (
            <div style={stickyBarStyle()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {selectedRows.length} payout row(s) selected
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>
                    Amount: {formatMoney(bulkAmount)} • Accounts: {selectedAccounts.length}
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    style={actionButtonStyle("secondary", !canBulkMarkProcessing)}
                    disabled={!canBulkMarkProcessing}
                    onClick={() => requestBulkAction("mark-processing")}
                  >
                    {bulkSubmitting ? "Working..." : "Bulk Mark Processing"}
                  </button>

                  <button
                    type="button"
                    style={actionButtonStyle("primary", !canBulkMarkPaid)}
                    disabled={!canBulkMarkPaid}
                    onClick={() => requestBulkAction("mark-paid")}
                  >
                    {bulkSubmitting ? "Working..." : "Bulk Mark Paid"}
                  </button>

                  <button
                    type="button"
                    style={actionButtonStyle("secondary", !canBulkMarkFailed)}
                    disabled={!canBulkMarkFailed}
                    onClick={() => requestBulkAction("mark-failed")}
                  >
                    {bulkSubmitting ? "Working..." : "Bulk Mark Failed"}
                  </button>

                  <button type="button" style={exportButtonStyle()} onClick={handleExportSelectedCsv}>
                    Export Selected CSV
                  </button>

                  <button type="button" style={shellButtonSecondary()} onClick={clearSelection}>
                    Clear Selection
                  </button>
                </div>
              </div>

              {bulkResultText ? (
                <div style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>{bulkResultText}</div>
              ) : null}
            </div>
          ) : null}

          <WorkspaceSectionCard
            title="Admin access and queue controls"
            subtitle="Load the queue, narrow the visible rows, export what you see, and prepare bulk actions."
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
                    <option value="pending,processing,failed">
                      Pending + Processing + Failed
                    </option>
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

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle()}>Bulk / Failure Reason</div>
                  <textarea
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="Required for mark failed actions"
                    style={textareaStyle()}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle()}>Provider Reference</div>
                  <input
                    type="text"
                    value={providerReference}
                    onChange={(e) => setProviderReference(e.target.value)}
                    placeholder="Transfer reference or bank reference"
                    style={inputStyle()}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle()}>Provider Transfer Code</div>
                  <input
                    type="text"
                    value={providerTransferCode}
                    onChange={(e) => setProviderTransferCode(e.target.value)}
                    placeholder="Provider transfer code"
                    style={inputStyle()}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle()}>Operator Notes</div>
                  <textarea
                    value={operatorNotes}
                    onChange={(e) => setOperatorNotes(e.target.value)}
                    placeholder="Optional internal note for this action request"
                    style={textareaStyle()}
                  />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    style={shellButtonPrimary()}
                    onClick={() => void loadQueue(true)}
                  >
                    {refreshing ? "Refreshing..." : "Load / Refresh Queue"}
                  </button>

                  <button
                    type="button"
                    style={shellButtonSecondary()}
                    onClick={clearSearchFields}
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

                  <button
                    type="button"
                    style={exportButtonStyle()}
                    onClick={handleExportQueueCsv}
                  >
                    Export Queue CSV
                  </button>
                </div>

                <div style={summaryBarStyle()}>
                  <div style={{ fontWeight: 800 }}>Filter summary</div>
                  <div style={{ color: "var(--text-muted)" }}>{filterSummary}</div>
                  <div style={{ color: "var(--text-muted)" }}>
                    Visible rows: {visibleMetrics.totalRows} • Pending: {visibleMetrics.pending} •
                    Processing: {visibleMetrics.processing} • Failed: {visibleMetrics.failed} • Paid:{" "}
                    {visibleMetrics.paid}
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>
                    Visible amount: {formatMoney(visibleMetrics.totalAmount)}
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>
                    Last refreshed: {lastRefreshedAt ? formatDateTime(lastRefreshedAt) : "Not yet refreshed"}
                  </div>
                </div>

                {actionError ? (
                  <BannerCard tone="danger" title="Action failed" subtitle={actionError} />
                ) : null}

                {actionSuccess ? (
                  <BannerCard tone="good" title="Action completed" subtitle={actionSuccess} />
                ) : null}
              </div>

              <WorkspaceSectionCard
                title="Payout queue"
                subtitle="Pick a payout row, inspect details on the right, and manage state carefully."
              >
                {loading ? (
                  <div style={{ color: "var(--text-muted)" }}>Loading payout queue...</div>
                ) : filteredQueueRows.length === 0 ? (
                  <div style={infoCardStyle()}>
                    <div style={{ fontWeight: 800 }}>No payout rows found</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      Enter an admin key and load the queue, or widen your current filters.
                    </div>
                  </div>
                ) : (
                  <div style={stackStyle()}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ color: "var(--text-muted)" }}>
                        Showing {filteredQueueRows.length} row(s)
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={shellButtonSecondary()}
                          onClick={toggleSelectAllVisible}
                        >
                          {filteredQueueRows.length > 0 &&
                          filteredQueueRows.every((row) => selectedPayoutIdsSet.has(row.id))
                            ? "Unselect Visible"
                            : "Select Visible"}
                        </button>

                        <button
                          type="button"
                          style={exportButtonStyle()}
                          onClick={handleExportQueueCsv}
                        >
                          Export Visible CSV
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      {filteredQueueRows.map((row) => {
                        const rowStatus = normalizeStatus(row.status);
                        const active = row.id === selectedPayoutId;
                        const checked = selectedPayoutIdsSet.has(row.id);

                        return (
                          <div
                            key={row.id}
                            style={queueRowStyle(active)}
                            onClick={() => void loadSinglePayout(row.id)}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                              }}
                            >
                              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSelected(row.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div style={{ fontWeight: 900 }}>{safeText(row.id)}</div>
                              </div>
                              <StatusBadge status={rowStatus} />
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: 10,
                              }}
                            >
                              <div>
                                <div style={labelStyle()}>Account</div>
                                <div>{safeText(row.account_id)}</div>
                              </div>
                              <div>
                                <div style={labelStyle()}>Amount</div>
                                <div>{formatMoney(row.amount, safeText(row.currency, "NGN"))}</div>
                              </div>
                              <div>
                                <div style={labelStyle()}>Provider Ref</div>
                                <div>{safeText(row.provider_reference, "None")}</div>
                              </div>
                              <div>
                                <div style={labelStyle()}>Requested</div>
                                <div>{formatDateTime(row.requested_at || row.created_at)}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedPayout ? (
                      <div style={stackStyle()}>
                        <div style={summaryBarStyle()}>
                          <div style={{ fontWeight: 800 }}>Action guide</div>
                          <div style={{ color: "var(--text-muted)" }}>{actionHint}</div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          }}
                        >
                          <div style={infoCardStyle()}>
                            <div style={labelStyle()}>Payout ID</div>
                            <div style={{ fontWeight: 800 }}>{safeText(selectedPayout.id)}</div>
                            <div style={labelStyle()}>Account ID</div>
                            <div>{safeText(selectedPayout.account_id)}</div>
                          </div>

                          <div style={infoCardStyle()}>
                            <div style={labelStyle()}>Amount</div>
                            <div style={{ fontWeight: 800, fontSize: 24 }}>
                              {formatMoney(
                                selectedPayout.amount,
                                safeText(selectedPayout.currency, "NGN")
                              )}
                            </div>
                            <div style={labelStyle()}>Status</div>
                            <div>
                              <StatusBadge status={selectedStatus} />
                            </div>
                          </div>

                          <div style={infoCardStyle()}>
                            <div style={labelStyle()}>Requested At</div>
                            <div>{formatDateTime(selectedPayout.requested_at || selectedPayout.created_at)}</div>
                            <div style={labelStyle()}>Updated At</div>
                            <div>{formatDateTime(selectedPayout.updated_at)}</div>
                          </div>

                          <div style={infoCardStyle()}>
                            <div style={labelStyle()}>Processed At</div>
                            <div>{formatDateTime(selectedPayout.processed_at)}</div>
                            <div style={labelStyle()}>Paid At</div>
                            <div>{formatDateTime(selectedPayout.paid_at)}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={copyButtonStyle()}
                            onClick={() => void handleCopy("Payout ID", safeText(selectedPayout.id, ""))}
                          >
                            Copy Payout ID
                          </button>

                          <button
                            type="button"
                            style={copyButtonStyle()}
                            onClick={() =>
                              void handleCopy("Account ID", safeText(selectedPayout.account_id, ""))
                            }
                          >
                            Copy Account ID
                          </button>

                          <button
                            type="button"
                            style={copyButtonStyle()}
                            onClick={() => void handleCopyPayoutBundle()}
                          >
                            Copy Payout JSON
                          </button>
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={actionButtonStyle("secondary", !canMarkProcessing || submitting)}
                            disabled={!canMarkProcessing || submitting}
                            onClick={() => requestSingleAction("mark-processing")}
                          >
                            {submitting && lastAction === "mark-processing"
                              ? "Working..."
                              : "Mark Processing"}
                          </button>

                          <button
                            type="button"
                            style={actionButtonStyle("primary", !canMarkPaid || submitting)}
                            disabled={!canMarkPaid || submitting}
                            onClick={() => requestSingleAction("mark-paid")}
                          >
                            {submitting && lastAction === "mark-paid" ? "Working..." : "Mark Paid"}
                          </button>

                          <button
                            type="button"
                            style={actionButtonStyle("secondary", !canMarkFailed || submitting)}
                            disabled={!canMarkFailed || submitting}
                            onClick={() => requestSingleAction("mark-failed")}
                          >
                            {submitting && lastAction === "mark-failed"
                              ? "Working..."
                              : "Mark Failed"}
                          </button>
                        </div>

                        <div style={infoCardStyle()}>
                          <div style={labelStyle()}>Provider</div>
                          <div style={{ fontWeight: 800, fontSize: 18 }}>
                            {safeText(selectedPayout.provider)}
                          </div>

                          <div style={labelStyle()}>Current Provider Reference</div>
                          <div style={{ fontWeight: 700 }}>
                            {safeText(selectedPayout.provider_reference, "None")}
                          </div>

                          <div style={labelStyle()}>Current Transfer Code</div>
                          <div style={{ fontWeight: 700 }}>
                            {safeText(selectedPayout.provider_transfer_code, "None")}
                          </div>

                          <div style={labelStyle()}>Last Failure Reason</div>
                          <div style={{ fontWeight: 700 }}>
                            {safeText(selectedPayout.failure_reason, "None")}
                          </div>
                        </div>

                        <WorkspaceSectionCard
                          title="Audit history"
                          subtitle="Review the admin activity trail for the selected payout."
                        >
                          <div style={stackStyle()}>
                            <div
                              style={{
                                display: "grid",
                                gap: 12,
                                gridTemplateColumns: "1fr 1fr auto",
                              }}
                            >
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
                                <button
                                  type="button"
                                  style={exportButtonStyle()}
                                  onClick={handleExportAuditCsv}
                                >
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
                              <BannerCard
                                tone="warn"
                                title="Audit history unavailable"
                                subtitle={auditError}
                              />
                            ) : auditInfo ? (
                              <div style={infoCardStyle()}>
                                <div style={{ fontWeight: 800 }}>No audit entries yet</div>
                                <div style={{ color: "var(--text-muted)" }}>{auditInfo}</div>
                              </div>
                            ) : visibleAuditRows.length === 0 ? (
                              <div style={infoCardStyle()}>
                                <div style={{ fontWeight: 800 }}>
                                  No audit rows match the current date filter
                                </div>
                                <div style={{ color: "var(--text-muted)" }}>
                                  Clear or widen the audit date range to see more history.
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "grid", gap: 12 }}>
                                {visibleAuditRows.map((row, index) => (
                                  <div
                                    key={row.id || `${row.created_at || "audit"}-${index}`}
                                    style={auditCardStyle()}
                                  >
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

                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 8,
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <StatusBadge status={normalizeStatus(row.old_status)} />
                                      <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                                        →
                                      </span>
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

                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                      <button
                                        type="button"
                                        style={copyButtonStyle()}
                                        onClick={() => void handleCopyAuditJson(row)}
                                      >
                                        Copy Audit JSON
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </WorkspaceSectionCard>
                      </div>
                    ) : (
                      <div style={infoCardStyle()}>
                        <div style={{ fontWeight: 800 }}>No payout selected</div>
                        <div style={{ color: "var(--text-muted)" }}>
                          Click any payout row from the queue to inspect it here.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </WorkspaceSectionCard>
            </div>
          </WorkspaceSectionCard>
        </div>
      </AppShell>

      {singleConfirmationContent ? (
        <div style={overlayStyle()}>
          <div style={modalCardStyle()}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{singleConfirmationContent.title}</div>
            <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              {singleConfirmationContent.subtitle}
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
                  if (confirmAction) void submitSingleAction(confirmAction);
                }}
                disabled={submitting}
              >
                {submitting ? "Working..." : singleConfirmationContent.buttonLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkConfirmationContent ? (
        <div style={overlayStyle()}>
          <div style={modalCardStyle()}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{bulkConfirmationContent.title}</div>
            <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              {bulkConfirmationContent.subtitle}
            </div>

            <div style={infoCardStyle()}>
              <div style={{ color: "var(--text-muted)" }}>Selected rows</div>
              <div style={{ fontWeight: 800 }}>
                {selectedRows.length} row(s) • {formatMoney(bulkAmount)}
              </div>
              <div style={{ color: "var(--text-muted)" }}>
                Accounts: {selectedAccounts.join(", ") || "None"}
              </div>

              {confirmBulkAction === "mark-failed" ? (
                <div style={{ color: "var(--text-muted)" }}>
                  Failure reason:{" "}
                  <strong style={{ color: "var(--text)" }}>
                    {safeText(failureReason, "None")}
                  </strong>
                </div>
              ) : null}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                style={shellButtonSecondary()}
                onClick={() => setConfirmBulkAction("")}
                disabled={bulkSubmitting}
              >
                Cancel
              </button>

              <button
                type="button"
                style={shellButtonPrimary()}
                onClick={() => {
                  if (confirmBulkAction) void submitBulkAction(confirmBulkAction);
                }}
                disabled={bulkSubmitting}
              >
                {bulkSubmitting ? "Working..." : bulkConfirmationContent.buttonLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
