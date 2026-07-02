"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, MetricCard, appInputStyle } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";

type QueueRow = {
  id?: string | number;
  ticket_id?: string;
  subject?: string;
  status?: string;
  priority?: string;
  category?: string;
  created_at?: string;
  last_message_preview?: string;
};

type CoverageRow = {
  table: string;
  sampled_rows?: number;
  missing_source_category?: number;
  missing_review_date?: number;
  stale_review?: number;
  high_risk?: number;
  sample_missing?: Array<Record<string, unknown>>;
  ok?: boolean;
  error?: string;
};

const ADMIN_KEY_STORAGE = "ntg-admin-key";

function safeText(value: unknown, fallback = "-") {
  const text = typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  return text || fallback;
}

function rowCard(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    borderRadius: 18,
    padding: 16,
    display: "grid",
    gap: 8,
    minWidth: 0,
  };
}

function muted(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text-muted)",
    lineHeight: 1.65,
    fontSize: 14,
    overflowWrap: "anywhere",
  };
}

export default function ExpertReviewAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setAdminKey(sessionStorage.getItem(ADMIN_KEY_STORAGE) || "");
    } catch {
      setAdminKey("");
    }
  }, []);

  const totals = useMemo(() => {
    return coverage.reduce(
      (acc, item) => {
        acc.sampled += Number(item.sampled_rows || 0);
        acc.missingSource += Number(item.missing_source_category || 0);
        acc.missingReview += Number(item.missing_review_date || 0);
        acc.stale += Number(item.stale_review || 0);
        acc.highRisk += Number(item.high_risk || 0);
        return acc;
      },
      { sampled: 0, missingSource: 0, missingReview: 0, stale: 0, highRisk: 0 }
    );
  }, [coverage]);

  function saveKey() {
    try {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey.trim());
    } catch {
      // ignore
    }
    setNotice("Admin key saved for this browser session.");
    setError("");
  }

  async function adminFetch(path: string) {
    const key = adminKey.trim();
    if (!key) throw new Error("Enter the backend admin key first.");
    const response = await fetch(path, {
      method: "GET",
      credentials: "include",
      headers: { "X-Admin-Key": key },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }
    return data;
  }

  async function refreshAdminData() {
    setLoading(true);
    setNotice("");
    setError("");
    try {
      const [queueData, coverageData] = await Promise.all([
        adminFetch("/api/expert-review/admin/queue?limit=100"),
        adminFetch("/api/expert-review/admin/source-coverage?limit=1000&stale_days=180"),
      ]);
      setQueue(Array.isArray(queueData?.rows) ? queueData.rows : []);
      setCoverage(Array.isArray(coverageData?.coverage) ? coverageData.coverage : []);
      setNotice("Admin evidence refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh admin evidence.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Expert Review Admin"
      subtitle="Admin evidence view for professional-review queue and source metadata coverage."
      actions={
        <>
          <button type="button" onClick={saveKey} style={shellButtonSecondary()}>
            Save Key
          </button>
          <button type="button" onClick={refreshAdminData} disabled={loading} style={shellButtonPrimary()}>
            {loading ? "Refreshing..." : "Refresh Evidence"}
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="warn"
          title="Admin-only page"
          subtitle="This page requires the backend admin key. It is intended for internal review, source metadata coverage checks, and expert-review queue monitoring."
        />

        {notice ? <Banner tone="good" title="Admin notice" subtitle={notice} /> : null}
        {error ? <Banner tone="danger" title="Admin error" subtitle={error} /> : null}

        <WorkspaceSectionCard title="Admin key" subtitle="Stored only in this browser session storage.">
          <div style={{ display: "grid", gap: 12 }}>
            <input
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Enter backend admin key"
              type="password"
              style={appInputStyle()}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <button type="button" onClick={saveKey} style={shellButtonSecondary()}>
                Save for Session
              </button>
              <button type="button" onClick={refreshAdminData} disabled={loading} style={shellButtonPrimary()}>
                {loading ? "Loading..." : "Load Evidence"}
              </button>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Source metadata coverage" subtitle="Coverage is sampled from qa_library, qa_cache, and qa_history.">
          <CardsGrid min={190}>
            <MetricCard label="Rows Sampled" value={String(totals.sampled)} />
            <MetricCard label="Missing Source" value={String(totals.missingSource)} tone={totals.missingSource ? "warn" : "good"} />
            <MetricCard label="Missing Review Date" value={String(totals.missingReview)} tone={totals.missingReview ? "warn" : "good"} />
            <MetricCard label="Stale Review" value={String(totals.stale)} tone={totals.stale ? "warn" : "good"} />
            <MetricCard label="High Risk" value={String(totals.highRisk)} tone={totals.highRisk ? "warn" : "default"} />
          </CardsGrid>

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {coverage.length ? coverage.map((item) => (
              <div key={item.table} style={rowCard()}>
                <strong style={{ color: "var(--text)", fontSize: 16 }}>{item.table}</strong>
                {item.error ? <p style={muted()}>Error: {item.error}</p> : null}
                <p style={muted()}>
                  Sampled: {item.sampled_rows || 0} | Missing source: {item.missing_source_category || 0} | Missing review date: {item.missing_review_date || 0} | Stale: {item.stale_review || 0} | High risk: {item.high_risk || 0}
                </p>
              </div>
            )) : <p style={muted()}>No coverage data loaded yet.</p>}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Professional review queue" subtitle="Requests created through the protected expert-review flow.">
          <div style={{ display: "grid", gap: 12 }}>
            {queue.length ? queue.map((row, index) => (
              <div key={`${row.ticket_id || row.id || index}`} style={rowCard()}>
                <strong style={{ color: "var(--text)", fontSize: 16 }}>{safeText(row.ticket_id || row.id)} - {safeText(row.subject, "Review request")}</strong>
                <p style={muted()}>
                  Status: {safeText(row.status)} | Priority: {safeText(row.priority)} | Category: {safeText(row.category)} | Created: {safeText(row.created_at)}
                </p>
                {row.last_message_preview ? <p style={muted()}>{row.last_message_preview}</p> : null}
              </div>
            )) : <p style={muted()}>No professional-review requests loaded yet.</p>}
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
