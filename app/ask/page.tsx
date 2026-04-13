"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AppShell from "@/components/app-shell";
import WorkspaceActionBar from "@/components/workspace-action-bar";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import {
  Banner,
  appInputStyle,
  appSelectStyle,
  appTextareaStyle,
} from "@/components/ui";
import { SectionStack } from "@/components/page-layout";
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

type AnswerSection = {
  title: string;
  body: string;
};

type ParsedAnswer = {
  lead: string;
  sections: AnswerSection[];
  source: string;
};

const SHOW_ASK_DEBUG = process.env.NEXT_PUBLIC_SHOW_ASK_DEBUG === "true";

const LANGUAGE_OPTIONS = [
  { label: "English", value: "English" },
  { label: "Pidgin", value: "Pidgin" },
  { label: "Yoruba", value: "Yoruba" },
  { label: "Igbo", value: "Igbo" },
  { label: "Hausa", value: "Hausa" },
];

const STARTER_GROUPS: Array<{ title: string; items: string[] }> = [
  {
    title: "Personal Income Tax",
    items: [
      "what is personal income tax?",
      "what is the personal income tax rate?",
      "which tax authority handles personal income tax?",
    ],
  },
  {
    title: "PAYE",
    items: [
      "what is paye?",
      "who must deduct paye?",
      "how do i remit paye?",
    ],
  },
  {
    title: "VAT",
    items: [
      "how do i register for vat?",
      "how do i file vat?",
      "how do i pay vat?",
    ],
  },
  {
    title: "Withholding Tax",
    items: [
      "what is the withholding tax rate?",
      "how do i remit withholding tax?",
    ],
  },
  {
    title: "Company Income Tax",
    items: [
      "what is the company income tax rate?",
      "how do i file company income tax?",
      "how do i pay company income tax?",
    ],
  },
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
    ].includes(raw);
  }
  return false;
}

function prettifyPlanName(value: string | null | undefined): string {
  const raw = String(value || "").trim();
  if (!raw) return "Free";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
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

function cleanLineEndings(value: string): string {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function parseStructuredAnswer(text: string): ParsedAnswer {
  const raw = cleanLineEndings(text);
  if (!raw) {
    return { lead: "", sections: [], source: "" };
  }

  let working = raw;
  let source = "";

  const sourceMatch = working.match(/(?:\n|^)\s*Source:\s*([\s\S]*)$/i);
  if (sourceMatch && sourceMatch.index != null) {
    source = String(sourceMatch[1] || "").trim();
    working = working.slice(0, sourceMatch.index).trim();
  }

  const blocks = working
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  let lead = "";
  const sections: AnswerSection[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.trim().length > 0);

    if (!lines.length) continue;

    const firstLine = lines[0].trim();
    const looksLikeHeading =
      firstLine.endsWith(":") &&
      firstLine.length <= 80 &&
      lines.length > 1;

    if (looksLikeHeading) {
      sections.push({
        title: firstLine.replace(/:$/, ""),
        body: lines.slice(1).join("\n"),
      });
      continue;
    }

    if (!lead) {
      lead = lines.join("\n");
      continue;
    }

    sections.push({
      title: "More detail",
      body: lines.join("\n"),
    });
  }

  return {
    lead,
    sections,
    source,
  };
}

function statusTileStyle(
  tone: "good" | "warn" | "default" = "default"
): React.CSSProperties {
  const toneMap = {
    good: {
      background: "rgba(16, 185, 129, 0.08)",
      border: "1px solid rgba(16, 185, 129, 0.18)",
    },
    warn: {
      background: "rgba(245, 158, 11, 0.08)",
      border: "1px solid rgba(245, 158, 11, 0.18)",
    },
    default: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
    },
  } as const;

  return {
    ...toneMap[tone],
    borderRadius: 18,
    padding: "12px 14px",
    minWidth: 150,
    display: "grid",
    gap: 4,
  };
}

function starterButtonStyle(isActive: boolean): React.CSSProperties {
  return {
    width: "100%",
    textAlign: "left",
    padding: "14px 16px",
    borderRadius: 18,
    border: isActive
      ? "1px solid rgba(99, 102, 241, 0.35)"
      : "1px solid var(--border)",
    background: isActive
      ? "rgba(99, 102, 241, 0.08)"
      : "var(--surface)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.5,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.03)",
  };
}

function answerSurfaceStyle(): React.CSSProperties {
  return {
    border: "1px solid rgba(16, 185, 129, 0.16)",
    background: "rgba(16, 185, 129, 0.04)",
    borderRadius: 26,
    padding: 22,
    display: "grid",
    gap: 16,
  };
}

function answerSectionStyle(): React.CSSProperties {
  return {
    border: "1px solid rgba(15, 23, 42, 0.08)",
    background: "rgba(255,255,255,0.58)",
    borderRadius: 20,
    padding: 18,
    display: "grid",
    gap: 10,
  };
}

function chipStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text)",
  };
}

function fieldLabelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text-muted)",
    marginBottom: 8,
  };
}

function helperCardStyle(): React.CSSProperties {
  return {
    borderRadius: 22,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 18,
    display: "grid",
    gap: 12,
  };
}

function AskPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { refreshSession } = useAuth();
  const answerRef = useRef<HTMLDivElement | null>(null);

  const {
    busy: workspaceBusy,
    status,
    load,
    activeNow,
    planCode,
    creditBalance,
    dailyUsage,
    dailyLimit,
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

  const busy = workspaceBusy || submitting;

  useEffect(() => {
    const q = (sp?.get("q") || "").trim();
    const lang = (sp?.get("lang") || "").trim();

    if (q) setQuestion(q);
    if (lang) setLanguage(normalizeLanguageLabel(lang));
  }, [sp]);

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

        requestAnimationFrame(() => {
          answerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });

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

  const parsedAnswer = useMemo(() => parseStructuredAnswer(answer), [answer]);

  const submitDisabled =
    busy || !question.trim() || (dailyLimit > 0 && dailyUsage >= dailyLimit);

  const hasAnswerState =
    resultOk !== null || Boolean(answer) || Boolean(friendlyError);

  const planName = prettifyPlanName(planCode);
  const dailyRemaining =
    dailyLimit > 0 ? Math.max(dailyLimit - dailyUsage, 0) : 0;

  const whatsappLinked = truthyValue(
    channelLinks?.whatsapp_linked || channelLinks?.whatsapp?.linked
  );
  const telegramLinked = truthyValue(
    channelLinks?.telegram_linked || channelLinks?.telegram?.linked
  );

  const channelStatus = whatsappLinked && telegramLinked
    ? "WhatsApp + Telegram linked"
    : whatsappLinked
    ? "WhatsApp linked"
    : telegramLinked
    ? "Telegram linked"
    : "No channel linked";

  const topTone =
    dailyLimit > 0 && dailyUsage >= dailyLimit
      ? "warn"
      : !activeNow || creditBalance <= 0
      ? "warn"
      : "good";

  const topTitle =
    dailyLimit > 0 && dailyUsage >= dailyLimit
      ? "Daily question limit reached"
      : !activeNow || creditBalance <= 0
      ? "Account attention needed"
      : "Ask page is ready";

  const topSubtitle =
    dailyLimit > 0 && dailyUsage >= dailyLimit
      ? "You can still review the starter questions below, but new submissions may stop until the daily limit resets."
      : !activeNow || creditBalance <= 0
      ? "Starter or already-covered questions may still work, but some live asks can be blocked until plan and credits are active."
      : status || "Write one direct tax question or tap any starter question on the right.";

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

        <WorkspaceSectionCard
          title="Ask your question"
          subtitle="Starter questions stay on the right. Ask box stays on the left."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.28fr) minmax(320px, 0.86fr)",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={statusTileStyle(activeNow ? "good" : "warn")}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Plan
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{planName}</div>
                </div>

                <div style={statusTileStyle(creditBalance > 0 ? "good" : "warn")}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Credits
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{creditBalance}</div>
                </div>

                <div
                  style={statusTileStyle(
                    dailyLimit > 0 && dailyRemaining === 0 ? "warn" : "default"
                  )}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Daily Left
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>
                    {dailyLimit > 0 ? dailyRemaining : "—"}
                  </div>
                </div>

                <div
                  style={statusTileStyle(
                    whatsappLinked || telegramLinked ? "good" : "default"
                  )}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Channels
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{channelStatus}</div>
                </div>
              </div>

              <div>
                <div style={fieldLabelStyle()}>Question</div>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                      event.preventDefault();
                      if (!submitDisabled) {
                        void handleAsk();
                      }
                    }
                  }}
                  placeholder="Example: how do i register for vat?"
                  rows={7}
                  style={{
                    ...appTextareaStyle(),
                    minHeight: 180,
                    fontSize: 18,
                    lineHeight: 1.8,
                    borderRadius: 22,
                  }}
                />
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  Tip: use one clear question at a time. Press Ctrl + Enter to submit quickly.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "end",
                }}
              >
                <div style={{ minWidth: 240, flex: "1 1 240px" }}>
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

                <button
                  onClick={() => {
                    void handleAsk();
                  }}
                  disabled={submitDisabled}
                  style={{
                    ...appInputStyle("button"),
                    minWidth: 190,
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

            <div
              style={{
                position: "sticky",
                top: 14,
                display: "grid",
                gap: 14,
              }}
            >
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 24,
                  background: "var(--surface)",
                  padding: 18,
                  display: "grid",
                  gap: 14,
                  maxHeight: "calc(100vh - 180px)",
                  overflowY: "auto",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: "var(--text)",
                      marginBottom: 4,
                    }}
                  >
                    Starter questions
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      lineHeight: 1.7,
                    }}
                  >
                    Tap any question below to load it into the ask box.
                  </div>
                </div>

                {STARTER_GROUPS.map((group) => (
                  <div key={group.title} style={{ display: "grid", gap: 8 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {group.title}
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      {group.items.map((item) => {
                        const isActive =
                          question.trim().toLowerCase() === item.trim().toLowerCase();

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setQuestion(item);
                              setResultOk(null);
                              setFriendlyError("");
                              setClarificationPrompt("");
                            }}
                            style={starterButtonStyle(isActive)}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WorkspaceSectionCard>

        {hasAnswerState ? (
          <div ref={answerRef}>
            <WorkspaceSectionCard
              title="Latest answer"
              subtitle="The answer below is the current result for your question."
            >
              {resultOk ? (
                <div style={{ display: "grid", gap: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div style={chipStyle()}>Latest answer</div>
                    {question.trim() ? (
                      <div style={chipStyle()}>
                        Question: {question.trim()}
                      </div>
                    ) : null}
                  </div>

                  <div style={answerSurfaceStyle()}>
                    {parsedAnswer.lead ? (
                      <div
                        style={{
                          fontSize: 19,
                          lineHeight: 1.85,
                          color: "var(--text)",
                          fontWeight: 700,
                        }}
                      >
                        {parsedAnswer.lead}
                      </div>
                    ) : null}

                    {parsedAnswer.sections.map((section, index) => (
                      <div key={`${section.title}-${index}`} style={answerSectionStyle()}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 900,
                            color: "var(--text)",
                          }}
                        >
                          {section.title}
                        </div>
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.85,
                            fontSize: 16,
                            color: "var(--text)",
                          }}
                        >
                          {section.body}
                        </div>
                      </div>
                    ))}

                    {!parsedAnswer.lead && parsedAnswer.sections.length === 0 ? (
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.85,
                          fontSize: 16,
                          color: "var(--text)",
                        }}
                      >
                        {answer}
                      </div>
                    ) : null}

                    {parsedAnswer.source ? (
                      <div
                        style={{
                          borderTop: "1px solid rgba(15, 23, 42, 0.08)",
                          paddingTop: 12,
                          fontSize: 13,
                          color: "var(--text-muted)",
                          lineHeight: 1.7,
                        }}
                      >
                        <strong>Source:</strong> {parsedAnswer.source}
                      </div>
                    ) : null}
                  </div>

                  {citations.length ? (
                    <div style={helperCardStyle()}>
                      <div style={{ fontWeight: 900, color: "var(--text)" }}>
                        References
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 18,
                          lineHeight: 1.8,
                          color: "var(--text-muted)",
                        }}
                      >
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
                  subtitle={
                    friendlyError || "Something went wrong while processing your question."
                  }
                />
              )}
            </WorkspaceSectionCard>
          </div>
        ) : null}

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
