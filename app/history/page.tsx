"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { SectionStack } from "@/components/page-layout";

type HistoryRow = {
  id?: string;
  account_id?: string;
  question?: string;
  answer?: string;
  lang?: string;
  source?: string;
  from_cache?: boolean;
  canonical_key?: string;
  normalized_question?: string;
  plan_code?: string;
  credits_consumed?: number;
  usage_charged?: boolean;
  channel?: string;
  created_at?: string;
  updated_at?: string;
};

type HistoryResponse = {
  ok?: boolean;
  items?: HistoryRow[];
  rows?: HistoryRow[];
  history?: HistoryRow[] | { rows?: HistoryRow[]; items?: HistoryRow[] };
  data?: HistoryRow[];
  error?: string;
  message?: string;
};

const HISTORY_ENDPOINTS = [
  "/api/history",
  "/api/qa-history",
  "/api/qa/history",
  "/api/ask/history",
];

function safeText(value: unknown, fallback = "—"): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
        ? ""
        : String(value).trim();
  return text || fallback;
}

function safeLower(value: unknown): string {
  return safeText(value, "").toLowerCase();
}

function safeNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeQuestion(value: unknown): string {
  return safeText(value, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanAnswer(value: unknown): string {
  return safeText(value, "")
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-*_]{2,}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function previewAnswer(answer: string, limit = 360): string {
  const cleaned = cleanAnswer(answer);
  if (cleaned.length <= limit) return cleaned;
  return cleaned.slice(0, limit).trimEnd() + "...";
}

function formatDate(value: unknown): string {
  const text = safeText(value, "");
  if (!text) return "Date not shown";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: unknown): string {
  const text = safeText(value, "");
  if (!text) return "Date not shown";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractRows(data: HistoryResponse): HistoryRow[] {
  if (Array.isArray(data)) return data as HistoryRow[];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.data)) return data.data;

  if (Array.isArray(data.history)) return data.history;
  if (data.history && typeof data.history === "object") {
    if (Array.isArray(data.history.rows)) return data.history.rows;
    if (Array.isArray(data.history.items)) return data.history.items;
  }

  return [];
}

function rowKey(row: HistoryRow, index: number): string {
  return (
    safeText(row.id, "") ||
    `${normalizeQuestion(row.question)}-${safeText(row.created_at, "")}-${index}`
  );
}

function rowGroupKey(row: HistoryRow): string {
  return normalizeQuestion(row.normalized_question || row.question) || safeText(row.id, "");
}

function rowChannel(row: HistoryRow): string {
  const channel = safeLower(row.channel);
  const source = safeLower(row.source);

  const value =
    channel && channel !== "unknown"
      ? channel
      : source && source !== "unknown"
        ? source
        : "web";

  if (value === "whatsapp") return "WhatsApp";
  if (value === "telegram") return "Telegram";
  if (value === "database") return "Web";
  if (value === "ai") return "Web";
  if (value === "web") return "Web";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function rowLanguage(row: HistoryRow): string {
  const lang = safeLower(row.lang);
  if (!lang || lang === "unknown") return "English";
  if (lang === "en") return "English";
  if (lang === "yo") return "Yoruba";
  if (lang === "ha") return "Hausa";
  if (lang === "ig") return "Igbo";
  if (lang === "pidgin") return "Pidgin";
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

function rowChargeLabel(row: HistoryRow): string {
  const credits = safeNumber(row.credits_consumed);
  const charged = row.usage_charged === true || credits > 0;

  if (charged) return `Charged ${credits || 1}`;
  if (row.from_cache === true || safeLower(row.source) === "database") return "Cache-assisted";
  return "No charge";
}

function rowTone(row: HistoryRow): "good" | "warn" | "default" {
  const credits = safeNumber(row.credits_consumed);
  if (row.usage_charged || credits > 0) return "warn";
  if (row.from_cache || safeLower(row.source) === "database") return "good";
  return "default";
}

function badgeStyle(tone: "good" | "warn" | "default"): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    border:
      tone === "good"
        ? "1px solid rgba(22, 163, 74, 0.22)"
        : tone === "warn"
          ? "1px solid rgba(217, 119, 6, 0.25)"
          : "1px solid var(--border)",
    background:
      tone === "good"
        ? "rgba(240, 253, 244, 0.72)"
        : tone === "warn"
          ? "rgba(255, 251, 235, 0.78)"
          : "var(--surface-soft)",
    color:
      tone === "good"
        ? "#166534"
        : tone === "warn"
          ? "#92400e"
          : "var(--text-muted)",
  };
}

function buttonLikeStyle(kind: "primary" | "secondary" | "danger" = "secondary"): React.CSSProperties {
  if (kind === "primary") return shellButtonPrimary();
  if (kind === "danger") {
    return {
      ...shellButtonSecondary(),
      borderColor: "rgba(220, 38, 38, 0.22)",
      background: "rgba(254, 242, 242, 0.72)",
      color: "#7f1d1d",
    };
  }
  return shellButtonSecondary();
}

function answerBoxStyle(expanded: boolean): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 22,
    background: "var(--surface-soft)",
    padding: "18px 20px",
    color: "var(--text)",
    fontSize: "clamp(15px, 1.55vw, 17px)",
    lineHeight: 1.75,
    whiteSpace: "pre-wrap",
    maxHeight: expanded ? "none" : 230,
    overflow: "hidden",
  };
}

export default function HistoryPage() {
  const router = useRouter();

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visibleRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const aTime = new Date(safeText(a.created_at, "1970-01-01")).getTime();
      const bTime = new Date(safeText(b.created_at, "1970-01-01")).getTime();
      return bTime - aTime;
    });

    if (showDuplicates) return sorted;

    const seen = new Set<string>();
    const deduped: HistoryRow[] = [];

    for (const row of sorted) {
      const key = rowGroupKey(row);
      if (!key) {
        deduped.push(row);
        continue;
      }

      if (seen.has(key)) continue;

      seen.add(key);
      deduped.push(row);
    }

    return deduped;
  }, [rows, showDuplicates]);

  const hiddenDuplicateCount = Math.max(0, rows.length - visibleRows.length);

  async function fetchHistory() {
    setLoading(true);
    setError(null);

    try {
      let finalRows: HistoryRow[] = [];
      let lastError = "";

      for (const endpoint of HISTORY_ENDPOINTS) {
        try {
          const response = await fetch(endpoint, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          });

          const data = (await response.json().catch(() => ({}))) as HistoryResponse;

          if (!response.ok || data?.ok === false) {
            lastError = data?.message || data?.error || `${endpoint} failed`;
            continue;
          }

          finalRows = extractRows(data);
          if (Array.isArray(finalRows)) break;
        } catch (err) {
          lastError = err instanceof Error ? err.message : `${endpoint} failed`;
        }
      }

      if (!finalRows.length && lastError) {
        setError(lastError);
      }

      setRows(finalRows);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "History could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRow(row: HistoryRow) {
    const id = safeText(row.id, "");
    if (!id) {
      setError("This item cannot be deleted because it has no visible ID.");
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const candidates = [
        `/api/history/${encodeURIComponent(id)}`,
        `/api/qa-history/${encodeURIComponent(id)}`,
        `/api/qa/history/${encodeURIComponent(id)}`,
      ];

      let deleted = false;
      let lastError = "";

      for (const endpoint of candidates) {
        try {
          const response = await fetch(endpoint, {
            method: "DELETE",
            credentials: "include",
            headers: { Accept: "application/json" },
          });

          if (response.ok) {
            deleted = true;
            break;
          }

          const data = await response.json().catch(() => ({}));
          lastError = data?.message || data?.error || `${endpoint} failed`;
        } catch (err) {
          lastError = err instanceof Error ? err.message : `${endpoint} failed`;
        }
      }

      if (!deleted) {
        setError(lastError || "Delete endpoint is not available yet.");
        return;
      }

      setRows((current) => current.filter((item) => safeText(item.id, "") !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function reopenInAsk(row: HistoryRow) {
    const question = safeText(row.question, "");
    if (question) {
      try {
        window.sessionStorage.setItem("ntg_reopen_question", question);
      } catch {
        // Ignore sessionStorage failure.
      }
    }
    router.push("/ask");
  }

  async function copyQuestion(row: HistoryRow) {
    const question = safeText(row.question, "");
    if (!question) return;

    try {
      await navigator.clipboard.writeText(question);
    } catch {
      setError("Copy failed. Please copy the question manually.");
    }
  }

  React.useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell
      title="History"
      subtitle="Review saved tax questions, previous AI answers, and submitted tax filings."
      actions={
        <>
          <button type="button" onClick={() => router.push("/ask")} style={shellButtonPrimary()}>
            Ask Tax AI
          </button>
          <button type="button" onClick={() => router.push("/credits")} style={shellButtonSecondary()}>
            Credits
          </button>
          <button type="button" onClick={fetchHistory} disabled={loading} style={shellButtonSecondary()}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </>
      }
    >
      <SectionStack>
        {error ? (
          <Banner tone="danger" title="History issue" subtitle={error} />
        ) : null}

        <WorkspaceSectionCard
          title="Saved answers"
          subtitle={
            loaded
              ? `${visibleRows.length} item${visibleRows.length === 1 ? "" : "s"} shown${
                  hiddenDuplicateCount ? `, ${hiddenDuplicateCount} duplicate${hiddenDuplicateCount === 1 ? "" : "s"} hidden` : ""
                }.`
              : "Loading your saved questions and answers."
          }
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              Cached answers show as no-charge history. AI-generated answers show the credit used.
            </div>

            <button
              type="button"
              onClick={() => setShowDuplicates((value) => !value)}
              style={shellButtonSecondary()}
            >
              {showDuplicates ? "Hide Duplicates" : "Show Duplicates"}
            </button>
          </div>

          {loading && !rows.length ? (
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: 22,
                padding: 24,
                color: "var(--text-muted)",
              }}
            >
              Loading history...
            </div>
          ) : null}

          {!loading && loaded && !visibleRows.length ? (
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: 22,
                padding: 24,
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              No saved history yet. Ask a tax question to create your first saved answer.
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 18 }}>
            {visibleRows.map((row, index) => {
              const key = rowKey(row, index);
              const isExpanded = expanded[key] === true;
              const answer = cleanAnswer(row.answer);
              const charged = row.usage_charged === true || safeNumber(row.credits_consumed) > 0;
              const tone = rowTone(row);

              return (
                <article
                  key={key}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 26,
                    background: "var(--surface)",
                    padding: "22px",
                    display: "grid",
                    gap: 16,
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span style={badgeStyle("default")}>{rowChannel(row)}</span>
                    <span style={badgeStyle("default")}>{rowLanguage(row)}</span>
                    <span style={badgeStyle(tone)}>{rowChargeLabel(row)}</span>
                    {charged ? (
                      <span style={badgeStyle("warn")}>
                        {safeNumber(row.credits_consumed) || 1} credit used
                      </span>
                    ) : null}
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      color: "var(--text)",
                      fontSize: "clamp(18px, 2vw, 24px)",
                      lineHeight: 1.45,
                      fontWeight: 950,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {safeText(row.question, "Question not shown")}
                  </h2>

                  <div style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                    {formatDate(row.created_at)}
                    {row.created_at ? (
                      <span style={{ fontWeight: 500 }}> • {formatDateTime(row.created_at)}</span>
                    ) : null}
                  </div>

                  <div style={answerBoxStyle(isExpanded)}>
                    {isExpanded ? answer : previewAnswer(answer)}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
                      gap: 12,
                    }}
                    className="history-action-grid"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((current) => ({
                          ...current,
                          [key]: !isExpanded,
                        }))
                      }
                      style={buttonLikeStyle("secondary")}
                    >
                      {isExpanded ? "Collapse Item" : "Open Full Item"}
                    </button>

                    <button
                      type="button"
                      onClick={() => reopenInAsk(row)}
                      style={buttonLikeStyle("secondary")}
                    >
                      Reopen in Ask
                    </button>

                    <button
                      type="button"
                      onClick={() => copyQuestion(row)}
                      style={buttonLikeStyle("secondary")}
                    >
                      Copy Question
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteRow(row)}
                      disabled={deletingId === safeText(row.id, "")}
                      style={buttonLikeStyle("danger")}
                    >
                      {deletingId === safeText(row.id, "") ? "Deleting..." : "Delete Item"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </WorkspaceSectionCard>
      </SectionStack>

      <style jsx>{`
        @media (max-width: 920px) {
          .history-action-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 560px) {
          .history-action-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
