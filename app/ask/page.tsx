"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AppShell from "@/components/app-shell";
import WorkspaceActionBar from "@/components/workspace-action-bar";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import {
  Banner,
  MetricCard,
  appInputStyle,
  appSelectStyle,
  appTextareaStyle,
  formatDate,
  toneSurface,
} from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { HistoryItem, saveHistoryItem } from "@/lib/history-storage";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";

type AskResp = {
  ok?: boolean;
  answer?: string;
  error?: string;
  fix?: string;
  root_cause?: string;
  details?: unknown;
  debug?: unknown;
  meta?: {
    ai_used_month?: number;
    monthly_ai_used?: number;
    ai_used_this_month?: number;
    used_this_month?: number;
  } | null;
  citations?: string[];
  clarification_prompt?: string;
};

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

const SHOW_ASK_DEBUG = process.env.NEXT_PUBLIC_SHOW_ASK_DEBUG === "true";

const LANGUAGE_OPTIONS = [
  { label: "English", value: "English" },
  { label: "Pidgin", value: "Pidgin" },
  { label: "Yoruba", value: "Yoruba" },
  { label: "Igbo", value: "Igbo" },
  { label: "Hausa", value: "Hausa" },
];

function languageToCode(label: string) {
  const v = (label || "").trim().toLowerCase();
  if (v === "english") return "en";
  if (v === "pidgin") return "pcm";
  if (v === "yoruba") return "yo";
  if (v === "igbo") return "ig";
  if (v === "hausa") return "ha";
  return "en";
}

function normalizeLanguageLabel(value: string) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "en" || v === "english") return "English";
  if (v === "pcm" || v === "pidgin") return "Pidgin";
  if (v === "yo" || v === "yoruba") return "Yoruba";
  if (v === "ig" || v === "igbo") return "Igbo";
  if (v === "ha" || v === "hausa") return "Hausa";
  return "English";
}

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
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

function safeText(value: unknown, fallback = "—"): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
      ? ""
      : String(value).trim();
  return text || fallback;
}

function fieldLabelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text-muted)",
    marginBottom: 8,
  };
}

function actionRowStyle(): React.CSSProperties {
  return {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  };
}

function looksLikeBrokenAnswer(text: string): boolean {
  const raw = String(text || "").toLowerCase();
  if (!raw.trim()) return true;

  const badSignals = [
    "candidate 1",
    "candidate 2",
    "candidate 3",
    "grounded basis",
    "grounding context",
    "grounding summary",
    "strict rules",
    "question classification",
    "trust_score",
    "similarity",
    "match_type",
    "invalid_api_key",
    "incorrect api key provided",
    "sk-proj-",
    "you are answering as",
    "no evidence provided",
  ];

  return badSignals.some((signal) => raw.includes(signal));
}

function sanitizeAnswerForDisplay(text: string): string {
  const raw = String(text || "").trim();
  if (!raw) return "";
  if (looksLikeBrokenAnswer(raw)) return "";
  return raw;
}

function summaryGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

function AskPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { refreshSession } = useAuth();

  const {
    busy: workspaceBusy,
    status,
    load,
    activeNow,
    planCode,
    creditBalance,
    dailyUsage,
    dailyLimit,
    expiresAt,
    channelLinks,
  } = useWorkspaceState({
    refreshSession,
    autoLoad: true,
    includeAccount: false,
    includeBilling: true,
    includeDebug: true,
    includeLinkStatus: true,
    loadingMessage: "Loading your assistant...",
  });

  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("English");
  const [answer, setAnswer] = useState("");
  const [resultOk, setResultOk] = useState<boolean | null>(null);
  const [friendlyError, setFriendlyError] = useState("");
  const [lastAskDebug, setLastAskDebug] = useState<unknown>(null);
  const [citations, setCitations] = useState<string[]>([]);
  const [clarificationPrompt, setClarificationPrompt] = useState("");
  const [monthlyAiUsed, setMonthlyAiUsed] = useState(0);
  const [limitsData, setLimitsData] = useState<WorkspaceLimitsResponse | null>(null);
  const [limitsError, setLimitsError] = useState("");

  const busy = workspaceBusy || submitting;

  useEffect(() => {
    const q = (sp?.get("q") || "").trim();
    const lang = (sp?.get("lang") || "").trim();

    if (q) setQuestion(q);
    if (lang) setLanguage(normalizeLanguageLabel(lang));
  }, [sp]);

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
          ? error.message || "Unable to load ask-page readiness state."
          : error instanceof Error
          ? error.message || "Unable to load ask-page readiness state."
          : "Unable to load ask-page readiness state.";
        setLimitsError(message);
      }
    }

    void loadLimits();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAsk = async () => {
    const q = question.trim();

    if (!q) {
      setResultOk(false);
      setFriendlyError("Please enter your question before continuing.");
      setAnswer("");
      setCitations([]);
      setClarificationPrompt("");
      setLastAskDebug(null);
      return;
    }

    if (dailyLimit > 0 && dailyUsage >= dailyLimit) {
      setResultOk(false);
      setFriendlyError("You have reached your daily question limit for today.");
      setAnswer("");
      setCitations([]);
      setClarificationPrompt("");
      setLastAskDebug(null);
      return;
    }

    setSubmitting(true);
    setResultOk(null);
    setFriendlyError("");
    setAnswer("");
    setCitations([]);
    setClarificationPrompt("");
    setLastAskDebug(null);

    try {
      const data = await apiJson<AskResp>("/ask", {
        method: "POST",
        timeoutMs: 45000,
        useAuthToken: false,
        body: {
          question: q,
          lang: languageToCode(language),
          channel: "web",
        },
      });

      if (SHOW_ASK_DEBUG) {
        setLastAskDebug(data?.debug || null);
      } else {
        setLastAskDebug(null);
      }

      await load("Refreshing assistant state...");

      const returnedMonthlyAiUsed = safeNumber(
        data?.meta?.ai_used_month ??
          data?.meta?.monthly_ai_used ??
          data?.meta?.ai_used_this_month ??
          data?.meta?.used_this_month
      );

      if (returnedMonthlyAiUsed > 0 || data?.meta) {
        setMonthlyAiUsed(returnedMonthlyAiUsed);
      }

      if (data?.ok && data?.answer) {
        const answerText = sanitizeAnswerForDisplay(String(data.answer || "").trim());

        if (!answerText) {
          setResultOk(false);
          setFriendlyError(
            "We could not prepare a clean final answer for that question yet. Please ask it again in a shorter, more direct way."
          );
          setCitations([]);
          setClarificationPrompt("");
          return;
        }

        setResultOk(true);
        setAnswer(answerText);
        setCitations(Array.isArray(data?.citations) ? data.citations.filter(Boolean) : []);
        setClarificationPrompt(normalizeText(data?.clarification_prompt || ""));

        const item: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          question: q,
          answer: answerText,
          language,
          created_at: new Date().toISOString(),
          source: "web",
        };
        saveHistoryItem(item);
        return;
      }

      const code = String(data?.error || "").trim().toLowerCase();

      if (code === "insufficient_credits" || code === "insufficient_credits_uncached") {
        setResultOk(false);
        setFriendlyError(
          "No fresh AI credits are available right now. Cached questions can still return answers, but new uncached questions need available credits."
        );
      } else if (code === "subscription_required") {
        setResultOk(false);
        setFriendlyError(
          "Your subscription is not active yet. Please open Plans or Billing to restore full access."
        );
      } else if (code === "daily_limit_reached") {
        setResultOk(false);
        setFriendlyError("You have reached your daily question limit for today.");
      } else {
        setResultOk(false);
        setFriendlyError("We could not complete this request right now.");
      }
    } catch (err: unknown) {
      await load("Refreshing assistant state...");

      if (isApiError(err)) {
        const code = String(err?.data?.error || "").trim().toLowerCase();

        if (SHOW_ASK_DEBUG) {
          setLastAskDebug(err?.data?.debug || err?.data || null);
        } else {
          setLastAskDebug(null);
        }

        if (code === "insufficient_credits" || code === "insufficient_credits_uncached") {
          setResultOk(false);
          setFriendlyError(
            "No fresh AI credits are available right now. Cached questions can still return answers, but new uncached questions need available credits."
          );
        } else if (code === "subscription_required") {
          setResultOk(false);
          setFriendlyError(
            "Your subscription is not active yet. Please open Plans or Billing to restore full access."
          );
        } else if (code === "daily_limit_reached") {
          setResultOk(false);
          setFriendlyError("You have reached your daily question limit for today.");
        } else if (code === "unauthorized" || err?.status === 401) {
          setResultOk(false);
          setFriendlyError("Your session is no longer valid. Please log in again.");
          router.push(`/login?next=${encodeURIComponent("/ask")}`);
        } else {
          setResultOk(false);
          setFriendlyError("We could not complete your request right now.");
        }
      } else {
        setResultOk(false);
        setFriendlyError("We could not reach the service right now.");

        if (SHOW_ASK_DEBUG) {
          setLastAskDebug(err instanceof Error ? err.message : String(err));
        } else {
          setLastAskDebug(null);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const clearAll = () => {
    setQuestion("");
    setAnswer("");
    setResultOk(null);
    setFriendlyError("");
    setCitations([]);
    setClarificationPrompt("");
    setLastAskDebug(null);
  };

  const submitDisabled =
    busy || !question.trim() || (dailyLimit > 0 && dailyUsage >= dailyLimit);

  const topTone =
    dailyLimit > 0 && dailyUsage >= dailyLimit
      ? "warn"
      : creditBalance <= 0
      ? "warn"
      : !activeNow
      ? "warn"
      : "good";

  const topTitle =
    dailyLimit > 0 && dailyUsage >= dailyLimit
      ? "Daily question limit reached"
      : creditBalance <= 0
      ? "Credit balance is empty"
      : !activeNow
      ? "Subscription attention needed"
      : "Assistant is ready";

  const topSubtitle =
    dailyLimit > 0 && dailyUsage >= dailyLimit
      ? "You have used all visible daily question capacity for today. Wait for reset or review your plan."
      : creditBalance <= 0
      ? "New uncached questions may fail until credits are available, even if the account still appears active."
      : !activeNow
      ? "Your workspace does not currently show an active subscription. You can still submit a question now to test the live flow, but the backend may still reject it until billing is active."
      : status || "Write your question clearly and choose the reply language before submitting.";

  const planName =
    limitsData?.entitlements?.plan?.name ||
    safeText(planCode || "", "Free");

  const workspaceMaxUsers = safeNumber(
    limitsData?.entitlements?.workspace_limits?.max_workspace_users
  );
  const workspaceUsed = safeNumber(limitsData?.counts?.owner_included_total);
  const workspaceAvailable =
    workspaceMaxUsers > 0 ? Math.max(workspaceMaxUsers - workspaceUsed, 0) : 0;

  const maxTotalChannels = safeNumber(
    limitsData?.entitlements?.channel_limits?.max_total_channels
  );
  const whatsappLinked = truthyValue(
    channelLinks?.whatsapp_linked || channelLinks?.whatsapp?.linked
  );
  const telegramLinked = truthyValue(
    channelLinks?.telegram_linked || channelLinks?.telegram?.linked
  );
  const linkedChannelsUsed = (whatsappLinked ? 1 : 0) + (telegramLinked ? 1 : 0);
  const channelStatusLabel =
    whatsappLinked && telegramLinked
      ? "All linked"
      : whatsappLinked || telegramLinked
      ? "Partially linked"
      : "Not linked";

  return (
    <AppShell
      title="Ask Naija Tax Guide"
      subtitle="Ask a practical Nigerian tax question and get a structured response inside your workspace."
      actions={
        <WorkspaceActionBar
          primaryLabel="Refresh"
          onPrimary={() => load("Refreshing assistant state...")}
          secondaryLabel="Plans"
          onSecondary={() => router.push("/plans")}
          dangerLabel="Credits"
          onDanger={() => router.push("/credits")}
        />
      }
    >
      <SectionStack>
        <Banner tone={topTone} title={topTitle} subtitle={topSubtitle} />

        {limitsError ? (
          <Banner
            tone="warn"
            title="Ask-page readiness could not be fully loaded"
            subtitle={limitsError}
          />
        ) : null}

        <div style={summaryGridStyle()}>
          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>Plan</div>
            <div style={summaryValueStyle()}>{planName}</div>
            <div style={summarySubStyle()}>
              Status: {activeNow ? "Active" : "Attention needed"}
            </div>
          </div>

          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>Credits</div>
            <div style={summaryValueStyle()}>{creditBalance}</div>
            <div style={summarySubStyle()}>
              AI used this month: {monthlyAiUsed}
            </div>
          </div>

          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>Workspace</div>
            <div style={summaryValueStyle()}>
              {workspaceUsed} / {workspaceMaxUsers || 0}
            </div>
            <div style={summarySubStyle()}>
              Available slots: {workspaceAvailable}
            </div>
          </div>

          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>Channels</div>
            <div style={summaryValueStyle()}>
              {linkedChannelsUsed} / {maxTotalChannels}
            </div>
            <div style={summarySubStyle()}>
              {channelStatusLabel} · WhatsApp: {whatsappLinked ? "Linked" : "Not linked"} · Telegram:{" "}
              {telegramLinked ? "Linked" : "Not linked"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.8fr) minmax(280px, 0.95fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <WorkspaceSectionCard
            title="Ask your question"
            subtitle="Keep the question direct and specific for the best result."
          >
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={fieldLabelStyle()}>Question</div>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Example: How do I register for TIN as a freelancer in Nigeria?"
                  rows={8}
                  style={{
                    ...appTextareaStyle(),
                    minHeight: 220,
                    fontSize: 17,
                    lineHeight: 1.7,
                  }}
                />
              </div>

              <div style={{ maxWidth: 280 }}>
                <div style={fieldLabelStyle()}>Reply language</div>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  style={appSelectStyle()}
                >
                  {LANGUAGE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={actionRowStyle()}>
                <button
                  onClick={() => {
                    void handleAsk();
                  }}
                  disabled={submitDisabled}
                  style={{
                    ...appInputStyle("button"),
                    minWidth: 180,
                    opacity: submitDisabled ? 0.65 : 1,
                    cursor: submitDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Submitting..." : "Ask Question"}
                </button>

                <button
                  onClick={clearAll}
                  disabled={submitting}
                  style={{
                    ...appInputStyle("buttonSecondary"),
                    minWidth: 140,
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Current access"
            subtitle="The small readiness summary that matters before asking."
          >
            <CardsGrid min={180}>
              <MetricCard
                label="Plan"
                value={planName}
                tone={activeNow ? "good" : "warn"}
                helper="Visible active plan in your workspace."
              />
              <MetricCard
                label="Credits"
                value={String(creditBalance)}
                tone={creditBalance > 0 ? "good" : "danger"}
                helper="Visible AI credits currently available."
              />
              <MetricCard
                label="Workspace"
                value={`${workspaceUsed}/${workspaceMaxUsers || 0}`}
                tone={workspaceAvailable > 0 ? "good" : "warn"}
                helper={`Available slots: ${workspaceAvailable}`}
              />
              <MetricCard
                label="Channels"
                value={`${linkedChannelsUsed}/${maxTotalChannels}`}
                tone={linkedChannelsUsed > 0 ? "good" : "warn"}
                helper={channelStatusLabel}
              />
              <MetricCard
                label="AI Used This Month"
                value={String(monthlyAiUsed)}
                helper="Total AI usage recorded for the current month if provided by the backend."
              />
              <MetricCard
                label="Expires"
                value={expiresAt ? formatDate(expiresAt) : "Not shown"}
                helper="Current visible expiry date if available."
              />
            </CardsGrid>
          </WorkspaceSectionCard>
        </div>

        <WorkspaceSectionCard
          title="Answer"
          subtitle="Your latest response will appear here after submission."
        >
          {resultOk === null && !answer && !friendlyError ? (
            <div
              style={{
                borderRadius: 18,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                padding: 18,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
                No response yet
              </div>
              <div
                style={{
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  fontSize: 15,
                }}
              >
                Submit a question above to generate an answer.
              </div>
            </div>
          ) : resultOk ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={toneSurface("good")}>
                <div style={{ fontWeight: 900, marginBottom: 10, fontSize: 16 }}>
                  Answer
                </div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    fontSize: 16,
                  }}
                >
                  {answer || "No answer returned."}
                </div>
              </div>

              {citations.length ? (
                <div style={toneSurface("default")}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>References</div>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                    {citations.map((citation, index) => (
                      <li key={`${citation}-${index}`}>{citation}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {clarificationPrompt ? (
                <Banner
                  tone="warn"
                  title="Clarification may be needed"
                  subtitle={clarificationPrompt}
                />
              ) : null}
            </div>
          ) : (
            <Banner
              tone="danger"
              title="Question could not be completed"
              subtitle={friendlyError || "Something went wrong while processing your question."}
            />
          )}
        </WorkspaceSectionCard>

        {SHOW_ASK_DEBUG && lastAskDebug ? (
          <WorkspaceSectionCard
            title="Ask debug"
            subtitle="Visible only when NEXT_PUBLIC_SHOW_ASK_DEBUG=true"
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 12,
                lineHeight: 1.6,
                color: "var(--text-soft)",
              }}
            >
              {typeof lastAskDebug === "string"
                ? lastAskDebug
                : JSON.stringify(lastAskDebug, null, 2)}
            </pre>
          </WorkspaceSectionCard>
        ) : null}
      </SectionStack>
    </AppShell>
  );
}

function AskPageFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--app-bg)",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          padding: 24,
          textAlign: "center",
        }}
      >
        Loading ask page...
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={<AskPageFallback />}>
      <AskPageContent />
    </Suspense>
  );
}
