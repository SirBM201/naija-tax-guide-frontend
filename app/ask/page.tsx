"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AppShell from "@/components/app-shell";
import { type HistoryItem, saveHistoryItem } from "@/lib/history-storage";
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

type StarterGroup = {
  title: string;
  questions: string[];
};

type AnswerSection = {
  title: string;
  lines: string[];
  ordered?: boolean;
};

type ParsedAnswer = {
  lead: string;
  sections: AnswerSection[];
  source: string;
};

const SHOW_ASK_DEBUG = process.env.NEXT_PUBLIC_SHOW_ASK_DEBUG === "true";

const LANGUAGE_OPTIONS = ["English", "Pidgin", "Yoruba", "Igbo", "Hausa"];

const STARTER_GROUPS: StarterGroup[] = [
  {
    title: "PERSONAL INCOME TAX",
    questions: [
      "what is personal income tax?",
      "what is the personal income tax rate?",
      "which tax authority handles personal income tax?",
    ],
  },
  {
    title: "PAYE",
    questions: [
      "what is paye?",
      "who must deduct paye?",
      "how do i remit paye?",
    ],
  },
  {
    title: "VAT",
    questions: [
      "how do i register for vat?",
      "how do i file vat?",
      "how do i pay vat?",
    ],
  },
  {
    title: "WITHHOLDING TAX",
    questions: [
      "what is the withholding tax rate?",
      "how do i remit withholding tax?",
    ],
  },
  {
    title: "COMPANY INCOME TAX",
    questions: [
      "what is the company income tax rate?",
      "how do i file company income tax?",
      "how do i pay company income tax?",
    ],
  },
];

function languageToCode(label: string) {
  const v = String(label || "").trim().toLowerCase();
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

function normalizeText(value: unknown) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

function sanitizeAnswerForDisplay(value: string) {
  return normalizeText(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeText(value: unknown, fallback = "—") {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
      ? ""
      : String(value).trim();
  return text || fallback;
}

function safeNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return ["1", "true", "yes", "linked", "active", "enabled", "paid"].includes(raw);
  }
  return false;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readPath(root: unknown, path: string[]): unknown {
  let cursor: unknown = root;
  for (const key of path) {
    const record = asRecord(cursor);
    if (!record) return undefined;
    cursor = record[key];
  }
  return cursor;
}

function titleFromCode(value: string, fallback = "Free") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function toneForMetric(
  tone: "default" | "good" | "warn" | "danger" = "default"
): React.CSSProperties {
  if (tone === "good") {
    return {
      border: "1px solid var(--success-border)",
      background: "var(--success-bg)",
    };
  }

  if (tone === "warn") {
    return {
      border: "1px solid var(--warn-border)",
      background: "var(--warn-bg)",
    };
  }

  if (tone === "danger") {
    return {
      border: "1px solid var(--danger-border)",
      background: "var(--danger-bg)",
    };
  }

  return {
    border: "1px solid var(--border)",
    background: "var(--surface)",
  };
}

function pageCardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    borderRadius: 28,
    border: "1px solid var(--border)",
    background: "var(--panel-bg)",
    padding: 28,
    boxShadow: "0 10px 34px rgba(15, 23, 42, 0.04)",
    ...extra,
  };
}

function innerCardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    borderRadius: 22,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 22,
    ...extra,
  };
}

function metricCardStyle(
  tone: "default" | "good" | "warn" | "danger" = "default"
): React.CSSProperties {
  return {
    borderRadius: 22,
    padding: 18,
    minHeight: 112,
    display: "grid",
    gap: 8,
    ...toneForMetric(tone),
  };
}

function pillButtonStyle(active = false): React.CSSProperties {
  return {
    minHeight: 54,
    padding: "0 22px",
    borderRadius: 18,
    border: active ? "1px solid var(--accent-border)" : "1px solid var(--border-strong)",
    background: active ? "var(--button-bg-strong)" : "var(--button-bg)",
    color: "var(--text)",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
  };
}

function secondaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    minHeight: 56,
    padding: "0 26px",
    borderRadius: 18,
    border: "1px solid var(--border-strong)",
    background: disabled ? "var(--surface-soft)" : "var(--button-bg)",
    color: disabled ? "var(--text-faint)" : "var(--text)",
    fontWeight: 900,
    fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
  };
}

function primaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    minHeight: 56,
    padding: "0 26px",
    borderRadius: 18,
    border: "1px solid var(--accent-border)",
    background: disabled ? "var(--surface-soft)" : "var(--button-bg-strong)",
    color: disabled ? "var(--text-faint)" : "var(--text)",
    fontWeight: 900,
    fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
  };
}

function textareaStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 230,
    borderRadius: 24,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "22px 20px",
    resize: "vertical",
    fontSize: 20,
    lineHeight: 1.7,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    outline: "none",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 58,
    borderRadius: 18,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "0 18px",
    fontSize: 17,
    outline: "none",
  };
}

function chipStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 40,
    padding: "0 16px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontWeight: 800,
    fontSize: 14,
  };
}

function parseAnswer(rawAnswer: string): ParsedAnswer {
  const raw = sanitizeAnswerForDisplay(rawAnswer);
  if (!raw) {
    return { lead: "", sections: [], source: "" };
  }

  const blocks = raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  let lead = "";
  let source = "";
  const sections: AnswerSection[] = [];

  for (const block of blocks) {
    const rawLines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!rawLines.length) continue;

    if (/^source\s*:/i.test(rawLines[0])) {
      source = block.replace(/^source\s*:\s*/i, "").trim();
      continue;
    }

    if (!lead && !/:$/.test(rawLines[0])) {
      const containsBullets = rawLines.some((line) => /^[-•]\s+/.test(line));
      const containsOrdered = rawLines.some((line) => /^\d+\.\s+/.test(line));

      if (!containsBullets && !containsOrdered) {
        lead = rawLines.join(" ");
        continue;
      }
    }

    let title = "";
    let bodyLines = rawLines.slice();

    if (/:$/.test(rawLines[0])) {
      title = rawLines[0].replace(/:$/, "").trim();
      bodyLines = rawLines.slice(1);
    }

    const ordered = bodyLines.some((line) => /^\d+\.\s+/.test(line));
    const cleanedLines = bodyLines
      .map((line) => line.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    if (!cleanedLines.length) continue;

    sections.push({
      title: title || "More details",
      lines: cleanedLines,
      ordered,
    });
  }

  if (!lead) {
    lead = sections.length
      ? sections[0].lines[0]
      : raw.replace(/\n+/g, " ").trim();
  }

  return {
    lead,
    sections,
    source,
  };
}

function AttentionCard({
  title,
  message,
  tone = "warn",
}: {
  title: string;
  message: string;
  tone?: "warn" | "danger" | "good";
}) {
  return (
    <div
      style={{
        ...pageCardStyle(),
        ...toneForMetric(tone),
        display: "grid",
        gap: 10,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 19,
          fontWeight: 950,
          color: "var(--text)",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "var(--text-muted)",
          fontSize: 15,
          lineHeight: 1.8,
        }}
      >
        {message}
      </div>
    </div>
  );
}

export default function AskPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { refreshSession } = useAuth();
  const answerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    busy: workspaceBusy,
    status,
    load,
    activeNow,
    planCode,
    creditBalance,
    dailyUsage,
    dailyLimit,
  } = useWorkspaceState({
    refreshSession,
    autoLoad: true,
    includeAccount: false,
    includeBilling: true,
    includeDebug: true,
    loadingMessage: "Loading your assistant...",
  });

  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("English");
  const [answer, setAnswer] = useState("");
  const [friendlyError, setFriendlyError] = useState("");
  const [clarificationPrompt, setClarificationPrompt] = useState("");
  const [citations, setCitations] = useState<string[]>([]);
  const [lastAskDebug, setLastAskDebug] = useState<unknown>(null);
  const [resultOk, setResultOk] = useState<boolean | null>(null);

  const busy = workspaceBusy || submitting;

  useEffect(() => {
    const q = (sp?.get("q") || sp?.get("question") || "").trim();
    const lang = (sp?.get("lang") || "").trim();

    if (q) setQuestion(q);
    if (lang) setLanguage(normalizeLanguageLabel(lang));
  }, [sp]);

  const parsed = useMemo(() => parseAnswer(answer), [answer]);

  const channelSummary = useMemo(() => {
    const whatsappLinked = truthyValue(
      readPath(status, ["channel_links", "whatsapp_linked"]) ??
        readPath(status, ["channel_links", "whatsapp", "linked"]) ??
        readPath(status, ["workspace", "channel_links", "whatsapp_linked"]) ??
        readPath(status, ["workspace", "channel_links", "whatsapp", "linked"]) ??
        readPath(status, ["whatsapp_linked"]) ??
        readPath(status, ["whatsapp", "linked"])
    );

    const telegramLinked = truthyValue(
      readPath(status, ["channel_links", "telegram_linked"]) ??
        readPath(status, ["channel_links", "telegram", "linked"]) ??
        readPath(status, ["workspace", "channel_links", "telegram_linked"]) ??
        readPath(status, ["workspace", "channel_links", "telegram", "linked"]) ??
        readPath(status, ["telegram_linked"]) ??
        readPath(status, ["telegram", "linked"])
    );

    if (telegramLinked && whatsappLinked) return "Telegram + WhatsApp linked";
    if (telegramLinked) return "Telegram linked";
    if (whatsappLinked) return "WhatsApp linked";
    return "No channel linked";
  }, [status]);

  const planLabel = useMemo(() => {
    if (safeText(planCode, "") === "") return "Free";
    return titleFromCode(String(planCode || ""), "Free");
  }, [planCode]);

  const dailyLeft = useMemo(() => {
    if (dailyLimit <= 0) return "—";
    const left = Math.max(dailyLimit - dailyUsage, 0);
    return String(left);
  }, [dailyLimit, dailyUsage]);

  const accountAttention = useMemo(() => {
    if (!activeNow && creditBalance <= 0) {
      return {
        title: "Account attention needed",
        message:
          "Starter or already-covered questions may still work, but some live asks can be blocked until plan and credits are active.",
        tone: "warn" as const,
      };
    }

    if (!activeNow) {
      return {
        title: "Subscription attention needed",
        message:
          "The page is working, but your billing state may still block some fresh questions until the subscription shows active.",
        tone: "warn" as const,
      };
    }

    if (dailyLimit > 0 && dailyUsage >= dailyLimit) {
      return {
        title: "Daily limit reached",
        message:
          "You have reached your current visible daily question limit. You can still review starter questions, history, and existing answers.",
        tone: "warn" as const,
      };
    }

    return null;
  }, [activeNow, creditBalance, dailyLimit, dailyUsage]);

  const handleStarterClick = (starterQuestion: string) => {
    setQuestion(starterQuestion);
    setFriendlyError("");
    setClarificationPrompt("");
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const handleClear = () => {
    setQuestion("");
    setAnswer("");
    setFriendlyError("");
    setClarificationPrompt("");
    setCitations([]);
    setLastAskDebug(null);
    setResultOk(null);
    textareaRef.current?.focus();
  };

  const handleAsk = async () => {
    const q = question.trim();

    if (!q) {
      setResultOk(false);
      setFriendlyError("Please enter your question before continuing.");
      setAnswer("");
      setClarificationPrompt("");
      setCitations([]);
      setLastAskDebug(null);
      return;
    }

    if (dailyLimit > 0 && dailyUsage >= dailyLimit) {
      setResultOk(false);
      setFriendlyError("You have reached your daily question limit for today.");
      setAnswer("");
      setClarificationPrompt("");
      setCitations([]);
      setLastAskDebug(null);
      return;
    }

    setSubmitting(true);
    setResultOk(null);
    setFriendlyError("");
    setAnswer("");
    setClarificationPrompt("");
    setCitations([]);
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
      }

      await load("Refreshing assistant state...");

      if (data?.ok && data?.answer) {
        const answerText = sanitizeAnswerForDisplay(String(data.answer || ""));

        if (!answerText) {
          setResultOk(false);
          setFriendlyError(
            "We could not prepare a clean final answer for that question yet. Please ask it again in a shorter, more direct way."
          );
          return;
        }

        setResultOk(true);
        setAnswer(answerText);
        setClarificationPrompt(normalizeText(data?.clarification_prompt || ""));
        setCitations(
          Array.isArray(data?.citations)
            ? data.citations.map((item) => safeText(item, "")).filter(Boolean)
            : []
        );

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
      const clarification = normalizeText(data?.clarification_prompt || "");

      if (clarification) {
        setClarificationPrompt(clarification);
      }

      if (code === "insufficient_credits" || code === "insufficient_credits_uncached") {
        setResultOk(false);
        setFriendlyError(
          "No fresh AI credits are available right now. Cached starter questions may still work, but new uncached questions need available credits."
        );
      } else if (code === "subscription_required") {
        setResultOk(false);
        setFriendlyError(
          "Starter or already-covered questions may still work, but this question needs active plan or credits before live AI can continue."
        );
      } else if (code === "daily_limit_reached") {
        setResultOk(false);
        setFriendlyError("You have reached your daily question limit for today.");
      } else if (clarification) {
        setResultOk(false);
        setFriendlyError("This question needs a little more detail before the answer can continue.");
      } else {
        setResultOk(false);
        setFriendlyError(
          safeText(data?.fix, "") ||
            safeText(data?.root_cause, "") ||
            "We could not complete this request right now."
        );
      }
    } catch (err: unknown) {
      await load("Refreshing assistant state...");

      if (isApiError(err)) {
        const apiErr = err as {
          data?: {
            error?: string;
            fix?: string;
            root_cause?: string;
            debug?: unknown;
            clarification_prompt?: string;
          };
          message?: string;
        };

        if (SHOW_ASK_DEBUG) {
          setLastAskDebug(apiErr?.data?.debug || apiErr?.data || null);
        }

        const code = String(apiErr?.data?.error || "").trim().toLowerCase();
        const clarification = normalizeText(apiErr?.data?.clarification_prompt || "");

        if (clarification) {
          setClarificationPrompt(clarification);
        }

        if (code === "insufficient_credits" || code === "insufficient_credits_uncached") {
          setFriendlyError(
            "No fresh AI credits are available right now. Cached starter questions may still work, but new uncached questions need available credits."
          );
        } else if (code === "subscription_required") {
          setFriendlyError(
            "Starter or already-covered questions may still work, but this question needs active plan or credits before live AI can continue."
          );
        } else if (code === "daily_limit_reached") {
          setFriendlyError("You have reached your daily question limit for today.");
        } else {
          setFriendlyError(
            safeText(apiErr?.data?.fix, "") ||
              safeText(apiErr?.data?.root_cause, "") ||
              safeText(apiErr?.message, "") ||
              "We could not complete this request right now."
          );
        }
      } else {
        setFriendlyError("We could not complete this request right now.");
      }

      setResultOk(false);
      setAnswer("");
    } finally {
      setSubmitting(false);
    }
  };

  const latestQuestionLabel = question.trim() || "No question selected";

  return (
    <AppShell
      title="Ask Naija Tax Guide"
      subtitle="Ask a practical Nigerian tax question and get a structured response inside your workspace."
    >
      <div
        style={{
          display: "grid",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => {
              void load("Refreshing assistant state...");
            }}
            style={secondaryButtonStyle(busy)}
            disabled={busy}
          >
            Refresh
          </button>

          <button
            onClick={() => router.push("/plans")}
            style={secondaryButtonStyle(false)}
          >
            Plans
          </button>

          <button
            onClick={() => router.push("/credits")}
            style={secondaryButtonStyle(false)}
          >
            Credits
          </button>
        </div>

        {accountAttention ? (
          <AttentionCard
            title={accountAttention.title}
            message={accountAttention.message}
            tone={accountAttention.tone}
          />
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.6fr) minmax(320px, 0.95fr)",
            gap: 22,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 20 }}>
            <div style={pageCardStyle()}>
              <div
                style={{
                  display: "grid",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 16,
                  }}
                >
                  <div style={metricCardStyle("warn")}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: "var(--text-faint)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Plan
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 950,
                        color: "var(--text)",
                      }}
                    >
                      {planLabel}
                    </div>
                  </div>

                  <div style={metricCardStyle(creditBalance > 0 ? "good" : "warn")}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: "var(--text-faint)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Credits
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 950,
                        color: "var(--text)",
                      }}
                    >
                      {String(creditBalance)}
                    </div>
                  </div>

                  <div style={metricCardStyle("default")}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: "var(--text-faint)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Daily left
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 950,
                        color: "var(--text)",
                      }}
                    >
                      {dailyLeft}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    maxWidth: 240,
                    ...metricCardStyle(
                      channelSummary === "No channel linked" ? "default" : "good"
                    ),
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: "var(--text-faint)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Channels
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 950,
                      color: "var(--text)",
                      lineHeight: 1.35,
                    }}
                  >
                    {channelSummary}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      color: "var(--text)",
                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    Question
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Example: how do i register for vat?"
                    style={textareaStyle()}
                  />

                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 14,
                      lineHeight: 1.7,
                    }}
                  >
                    Tip: use one clear question at a time. Press Ctrl + Enter to submit quickly.
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(220px, 1fr) auto auto",
                    gap: 14,
                    alignItems: "end",
                  }}
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    <div
                      style={{
                        color: "var(--text)",
                        fontSize: 15,
                        fontWeight: 900,
                      }}
                    >
                      Reply language
                    </div>

                    <select
                      value={language}
                      onChange={(e) => setLanguage(normalizeLanguageLabel(e.target.value))}
                      style={selectStyle()}
                    >
                      {LANGUAGE_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      void handleAsk();
                    }}
                    style={primaryButtonStyle(busy)}
                    disabled={busy}
                  >
                    {submitting ? "Asking..." : "Ask Question"}
                  </button>

                  <button
                    onClick={handleClear}
                    style={secondaryButtonStyle(busy)}
                    disabled={busy}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div ref={answerRef} style={pageCardStyle()}>
              {resultOk === null && !answer && !friendlyError ? (
                <div
                  style={{
                    ...innerCardStyle(),
                    display: "grid",
                    gap: 10,
                    minHeight: 120,
                    alignContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 950,
                      color: "var(--text)",
                    }}
                  >
                    No response yet
                  </div>

                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 15,
                      lineHeight: 1.8,
                    }}
                  >
                    Ask a question above or tap any starter question to test this section.
                  </div>
                </div>
              ) : null}

              {(friendlyError || clarificationPrompt) && resultOk === false ? (
                <div
                  style={{
                    ...innerCardStyle(),
                    ...toneForMetric("warn"),
                    display: "grid",
                    gap: 12,
                  }}
                >
                  {friendlyError ? (
                    <div
                      style={{
                        color: "var(--text)",
                        fontSize: 17,
                        fontWeight: 900,
                        lineHeight: 1.6,
                      }}
                    >
                      {friendlyError}
                    </div>
                  ) : null}

                  {clarificationPrompt ? (
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 15,
                        lineHeight: 1.8,
                      }}
                    >
                      {clarificationPrompt}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {resultOk && answer ? (
                <div style={{ display: "grid", gap: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div style={chipStyle()}>Latest answer</div>
                    <div style={chipStyle()}>
                      Question: {latestQuestionLabel}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 28,
                      border: "1px solid var(--success-border)",
                      background: "var(--success-bg)",
                      padding: 28,
                      display: "grid",
                      gap: 18,
                    }}
                  >
                    <div
                      style={{
                        color: "var(--text)",
                        fontSize: 26,
                        fontWeight: 950,
                        lineHeight: 1.55,
                        letterSpacing: -0.2,
                      }}
                    >
                      {parsed.lead}
                    </div>

                    {parsed.sections.map((section, index) => (
                      <div key={`${section.title}-${index}`} style={innerCardStyle()}>
                        <div
                          style={{
                            color: "var(--text)",
                            fontSize: 18,
                            fontWeight: 950,
                            marginBottom: 14,
                          }}
                        >
                          {section.title}
                        </div>

                        {section.ordered ? (
                          <ol
                            style={{
                              margin: 0,
                              paddingLeft: 28,
                              display: "grid",
                              gap: 12,
                              color: "var(--text)",
                              fontSize: 17,
                              lineHeight: 1.8,
                            }}
                          >
                            {section.lines.map((line, lineIndex) => (
                              <li key={`${section.title}-${lineIndex}`}>{line}</li>
                            ))}
                          </ol>
                        ) : (
                          <div
                            style={{
                              display: "grid",
                              gap: 12,
                              color: "var(--text)",
                              fontSize: 17,
                              lineHeight: 1.8,
                            }}
                          >
                            {section.lines.map((line, lineIndex) => (
                              <div key={`${section.title}-${lineIndex}`}>- {line}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {parsed.source ? (
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          paddingTop: 16,
                          color: "var(--text-muted)",
                          fontSize: 14,
                          lineHeight: 1.8,
                        }}
                      >
                        <strong style={{ color: "var(--text)" }}>Source:</strong>{" "}
                        {parsed.source}
                      </div>
                    ) : null}

                    {citations.length ? (
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          paddingTop: 16,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            color: "var(--text)",
                            fontSize: 15,
                            fontWeight: 900,
                          }}
                        >
                          Visible citations
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gap: 8,
                            color: "var(--text-muted)",
                            fontSize: 14,
                            lineHeight: 1.7,
                          }}
                        >
                          {citations.map((citation, index) => (
                            <div key={`${citation}-${index}`}>{citation}</div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {SHOW_ASK_DEBUG && lastAskDebug ? (
                <div style={{ marginTop: 18 }}>
                  <div
                    style={{
                      color: "var(--text)",
                      fontSize: 15,
                      fontWeight: 900,
                      marginBottom: 10,
                    }}
                  >
                    Ask debug
                  </div>

                  <pre
                    style={{
                      margin: 0,
                      padding: 16,
                      borderRadius: 18,
                      border: "1px solid var(--border)",
                      background: "var(--surface-soft)",
                      color: "var(--text-muted)",
                      whiteSpace: "pre-wrap",
                      overflowX: "auto",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {JSON.stringify(lastAskDebug, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>

          <div
            style={{
              ...pageCardStyle(),
              position: "sticky",
              top: 16,
              maxHeight: "calc(100vh - 120px)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 950,
                  color: "var(--text)",
                }}
              >
                Starter questions
              </div>

              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                Tap any question below to load it into the ask box.
              </div>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              {STARTER_GROUPS.map((group) => (
                <div key={group.title} style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      color: "var(--text-faint)",
                      fontSize: 13,
                      fontWeight: 950,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                    }}
                  >
                    {group.title}
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {group.questions.map((starterQuestion) => {
                      const active =
                        question.trim().toLowerCase() === starterQuestion.trim().toLowerCase();

                      return (
                        <button
                          key={starterQuestion}
                          onClick={() => handleStarterClick(starterQuestion)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            minHeight: 62,
                            padding: "14px 16px",
                            borderRadius: 20,
                            border: active
                              ? "1px solid var(--accent-border)"
                              : "1px solid var(--border)",
                            background: active ? "var(--accent-soft)" : "var(--surface)",
                            color: "var(--text)",
                            fontWeight: 900,
                            fontSize: 16,
                            lineHeight: 1.45,
                            cursor: "pointer",
                          }}
                        >
                          {starterQuestion}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
