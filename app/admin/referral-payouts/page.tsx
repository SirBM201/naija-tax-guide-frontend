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
import { CardsGrid, SectionStack, TwoColumnSection } from "@/components/page-layout";

type NoticeTone = "good" | "warn" | "danger" | "default";

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
};

type SinglePayoutResponse = {
  ok?: boolean;
  payout?: PayoutRow;
  error?: string;
  root_cause?: string;
};

const ADMIN_KEY_STORAGE_KEY = "nt_admin_api_key";
const DEFAULT_STATUS_FILTER = "pending,processing,failed";

function resolveApiBase(): string {
  const envBase =
    (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "").trim();

  if (envBase) {
    return envBase.replace(/\/+$/, "");
  }

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
    gap: 6,
    cursor: "pointer",
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
      data?.root_cause || data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
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

  const [notice, setNotice] = useState<{
    tone: NoticeTone;
    title: string;
    subtitle: string;
  } | null>(null);

  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = (window.localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || "").trim();
    if (stored) setAdminKey(stored);
  }, []);

  const queueRows = queueData?.rows || [];

  const metrics = useMemo(() => {
    const totalRows = queueRows.length;
    const pending = queueRows.filter((row) => safeText(row.status, "").toLowerCase() === "pending").length;
    const processing = queueRows.filter((row) => safeText(row.status, "").toLowerCase() === "processing").length;
    const failed = queueRows.filter((row) => safeText(row.status, "").toLowerCase() === "failed").length;
    const totalAmount = queueRows.reduce((sum, row) => sum + safeNumber(row.amount), 0);

    return { totalRows, pending, processing, failed, totalAmount };
  }, [queueRows]);

  async function loadSinglePayout(payoutId: string, keyOverride?: string) {
    const key = (keyOverride || adminKey).trim();
    if (!payoutId || !key) {
      setSelectedPayout(null);
      setSelectedPayoutId("");
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
    } catch (e: unknown) {
      setSelectedPayout(null);
      setSelectedPayoutId("");
      setErrorText(e instanceof Error ? e.message : "Could not load payout details.");
    }
  }

  async function loadQueue(showRefreshState = false) {
    if (!requireAuth()) return;

    const key = adminKey.trim();
    if (!key) {
      setLoading(false);
      setRefreshing(false);
      setQueueData({ ok: true, count: 0, rows: [] });
      setSelectedPayout(null);
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
        `/admin/referral-payouts?status=${encodeURIComponent(statusFilter)}&limit=50`,
        key
      );

      setQueueData(data);

      const firstRowId = selectedPayoutId || data?.rows?.[0]?.id || "";
      if (firstRowId) {
        await loadSinglePayout(firstRowId, key);
      } else {
        setSelectedPayout(null);
        setSelectedPayoutId("");
      }
    } catch (e: unknown) {
      setQueueData(null);
      setSelectedPayout(null);
      setSelectedPayoutId("");
      setErrorText(e instanceof Error ? e.message : "Could not load payout queue.");
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

  async function handleRefresh() {
    await loadQueue(true);
  }

  async function submitStatusUpdate(action: "mark-processing" | "mark-paid" | "mark-failed") {
    if (!requireAuth()) return;

    const key = adminKey.trim();
    const payoutId = selectedPayoutId.trim();

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

      setNotice({
        tone: "good",
        title: "Payout updated",
        subtitle: `The payout row was updated with action: ${action}.`,
      });

      await loadQueue(true);
    } catch (e: unknown) {
      setErrorText(e instanceof Error ? e.message : "Could not update payout row.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Admin Payout Queue"
      subtitle="Review pending referral payouts, inspect payout rows, and mark them as processing, paid, or failed."
      actions={
        <>
          <button
            type="button"
            style={shellButtonPrimary()}
            onClick={() => void handleRefresh()}
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
      <SectionStack>
        {notice ? (
          <Banner tone={notice.tone} title={notice.title} subtitle={notice.subtitle} />
        ) : null}

        {errorText ? (
          <Banner
            tone="danger"
            title="Admin payout queue could not load"
            subtitle={errorText}
          />
        ) : null}

        <WorkspaceSectionCard
          title="Admin access"
          subtitle="Enter the private admin key used by the backend admin payout routes."
        >
          <TwoColumnSection
            left={
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

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    style={shellButtonPrimary()}
                    onClick={() => void loadQueue(true)}
                  >
                    Load Queue
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
            }
            right={
              <CardsGrid min={180}>
                <MetricCard
                  label="Queue Rows"
                  value={String(metrics.totalRows)}
                  helper="Rows currently loaded into this admin queue view."
                />
                <MetricCard
                  label="Pending"
                  value={String(metrics.pending)}
                  helper="Requests waiting for action."
                />
                <MetricCard
                  label="Processing"
                  value={String(metrics.processing)}
                  helper="Rows already pushed into transfer processing."
                />
                <MetricCard
                  label="Failed"
                  value={String(metrics.failed)}
                  helper="Rows that need admin attention or retry."
                />
                <MetricCard
                  label="Queue Amount"
                  value={`NGN ${metrics.totalAmount.toFixed(2)}`}
                  helper="Combined visible amount in the loaded queue."
                />
              </CardsGrid>
            }
          />
        </WorkspaceSectionCard>

        {loading ? (
          <WorkspaceSectionCard
            title="Loading payout queue"
            subtitle="Please wait while the admin payout queue is being fetched."
          />
        ) : (
          <TwoColumnSection
            left={
              <WorkspaceSectionCard
                title="Payout queue"
                subtitle="Select a payout row to inspect and manage."
              >
                {queueRows.length === 0 ? (
                  <div style={infoBoxStyle()}>
                    <div style={{ fontWeight: 800 }}>No payout rows found</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      Try another status filter or refresh the queue again.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {queueRows.map((row) => {
                      const active = row.id === selectedPayoutId;
                      return (
                        <div
                          key={row.id}
                          style={listRowStyle(active)}
                          onClick={() => void loadSinglePayout(row.id)}
                        >
                          <div style={{ fontWeight: 800, color: "var(--text)" }}>
                            {safeText(row.id)}
                          </div>
                          <div style={{ color: "var(--text-muted)" }}>
                            Account: {safeText(row.account_id)}
                          </div>
                          <div style={{ color: "var(--text-muted)" }}>
                            Amount: {safeText(row.currency, "NGN")} {safeText(row.amount, "0")}
                          </div>
                          <div style={{ color: "var(--text-muted)" }}>
                            Status: {safeText(row.status)} • Requested: {formatDate(row.requested_at || row.created_at)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </WorkspaceSectionCard>
            }
            right={
              <WorkspaceSectionCard
                title="Payout details"
                subtitle="Inspect the selected payout row and update its processing state."
              >
                {!selectedPayout ? (
                  <div style={infoBoxStyle()}>
                    <div style={{ fontWeight: 800 }}>No payout selected</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      Click a payout row from the queue to view its details.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    <CardsGrid min={180}>
                      <MetricCard
                        label="Amount"
                        value={`${safeText(selectedPayout.currency, "NGN")} ${safeText(selectedPayout.amount, "0")}`}
                        helper="Requested payout amount."
                      />
                      <MetricCard
                        label="Status"
                        value={safeText(selectedPayout.status)}
                        helper="Current backend payout state."
                      />
                      <MetricCard
                        label="Requested"
                        value={formatDate(selectedPayout.requested_at || selectedPayout.created_at)}
                        helper="When this payout entered the queue."
                      />
                      <MetricCard
                        label="Processed"
                        value={formatDate(selectedPayout.processed_at)}
                        helper="When processing last started or completed."
                      />
                    </CardsGrid>

                    <div style={infoBoxStyle()}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                        Payout ID
                      </div>
                      <div style={{ fontWeight: 800, color: "var(--text)" }}>
                        {safeText(selectedPayout.id)}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                          Provider Reference
                        </div>
                        <input
                          type="text"
                          value={providerReference}
                          onChange={(e) => setProviderReference(e.target.value)}
                          placeholder="Example: PSTK-TRANSFER-001"
                          style={appInputStyle()}
                        />
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                          Provider Transfer Code
                        </div>
                        <input
                          type="text"
                          value={providerTransferCode}
                          onChange={(e) => setProviderTransferCode(e.target.value)}
                          placeholder="Example: TRF-001"
                          style={appInputStyle()}
                        />
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                          Failure Reason
                        </div>
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
                        style={shellButtonSecondary()}
                        disabled={submitting}
                        onClick={() => void submitStatusUpdate("mark-processing")}
                      >
                        {submitting ? "Working." : "Mark Processing"}
                      </button>

                      <button
                        type="button"
                        style={shellButtonPrimary()}
                        disabled={submitting}
                        onClick={() => void submitStatusUpdate("mark-paid")}
                      >
                        {submitting ? "Working." : "Mark Paid"}
                      </button>

                      <button
                        type="button"
                        style={shellButtonSecondary()}
                        disabled={submitting}
                        onClick={() => void submitStatusUpdate("mark-failed")}
                      >
                        {submitting ? "Working." : "Mark Failed"}
                      </button>
                    </div>

                    <div style={infoBoxStyle()}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                        Provider
                      </div>
                      <div style={{ fontWeight: 800, color: "var(--text)" }}>
                        {safeText(selectedPayout.provider)}
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginTop: 8 }}>
                        Last Failure Reason
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--text)" }}>
                        {safeText(selectedPayout.failure_reason, "None")}
                      </div>
                    </div>
                  </div>
                )}
              </WorkspaceSectionCard>
            }
          />
        )}
      </SectionStack>
    </AppShell>
  );
}
