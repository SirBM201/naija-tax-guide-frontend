"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { apiJson, isApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { type HistoryItem, saveHistoryItem } from "@/lib/history-storage";

type AskResp = {
  ok?: boolean;
  answer?: string;
  error?: string;
  fix?: string;
  root_cause?: string;
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
    questions: ["what is paye?", "who must deduct paye?", "how do i remit paye?"],
  },
  {
    title: "VAT",
    questions: ["how do i register for vat?", "how do i file vat?", "how do i pay vat?"],
  },
  {
    title: "WITHHOLDING TAX",
    questions: ["what is the withholding tax rate?", "how do i remit withholding tax?"],
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
    const rec = asRecord(cursor);
    if (!rec) return undefined;
    cursor = rec[key];
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

function pageCardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    borderRadius: 28,
    border: "1px solid var(--border)",
    background: "var(--panel-bg)",
    padding: "clamp(18px, 3vw, 28px)",
    boxShadow: "0 10px 34px rgba(15, 23, 42, 0.04)",
    width: "100%",
    minWidth: 0,
    ...extra,
  };
}

function innerCardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    borderRadius: 22,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: "clamp(16px, 2.5vw, 22px)",
    width: "100%",
    minWidth: 0,
    ...extra,
  };
}

function toneStyles(
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

function metricCardStyle(
  tone: "default" | "good" | "warn" | "danger" = "default"
): React.CSSProperties {
  return {
    borderRadius: 22,
    padding: 18,
    minHeight: 108,
    display: "grid",
    gap: 8,
    width: "100%",
    minWidth: 0,
    ...toneStyles(tone),
  };
}

function secondaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    minHeight: 54,
    width: "100%",
    padding: "0 22px",
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
    minHeight: 54,
    width: "100%",
    padding: "0 22px",
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
    minHeight: 210,
    borderRadius: 24,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "18px 18px",
    resize: "vertical",
    fontSize: "max(16px, 1rem)",
    lineHeight: 1.7,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    outline: "none",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 56,
    borderRadius: 18,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "0 16px",
    fontSize: 16,
    outline: "none",
  };
}

function chipStyle(fullWidth = false): React.CSSProperties {
  return {
    display: fullWidth ? "flex" : "inline-flex",
    alignItems: "center",
    width: fullWidth ? "100%" : "auto",
    minHeight: 40,
    padding: "0 16px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontWeight: 800,
    fontSize: 14,
    minWidth: 0,
    overflowWrap: "anywhere",
  };
}

function gridAutoFit(minWidth: number): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}px), 1fr))`,
    gap: 16,
    alignItems: "start",
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
      const hasBullets = rawLines.some((line) => /^[-•]\s+/.test(line));
      const hasOrdered = rawLines.some((line) => /^\d+\.\s+/.test(line));

      if (!hasBullets && !hasOrdered) {
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
    lead = sections.length ? sections[0].lines[0] : raw.replace(/\n+/g, " ").trim();
  }

  return { lead, sections, source };
}

function AskPageFallback() {
  return (
    <AppShell
      title="Ask Naija Tax Guide"
      subtitle="Ask a practical Nigerian tax question and get a structured response inside your workspace."
    >
      <div style={{ display: "grid", gap: 20 }}>
        <div style={pageCardStyle()}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "var(--text)",
            }}
          >
            Loading ask page...
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function AskPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  } = useWorkspaceState({
    refreshSession,
    autoLoad: true,
    includeAccount: true,
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
  const [resultOk, setResultOk] = useState<boolean | null>(null);

  const busy = workspaceBusy || submitting;

  useEffect(() => {
    const q = (searchParams?.get("q") || searchParams?.get("question") || "").trim();
    const lang = (searchParams?.get("lang") || "").trim();

    if (q) setQuestion(q);
    if (lang) setLanguage(normalizeLanguageLabel(lang));
  }, [searchParams]);

  const parsed = useMemo(() => parseAnswer(answer), [answer]);

  const channelSummary = useMemo(() => {
    const whatsappLinked = truthyValue(
      readPath(status, ["channel_links", "whatsapp_linked"]) ??
        readPath(status, ["channel_links", "whatsapp", "linked"]) ??
        readPath(status, ["workspace", "channel_links", "whatsapp_linked"]) ??
        readPath(status, ["workspace", "channel_links", "whatsapp", "linked"]) ??
        readPath(status, ["account", "channel_links", "whatsapp_linked"]) ??
        readPath(status, ["account", "channel_links", "whatsapp", "linked"]) ??
        readPath(status, ["whatsapp_linked"]) ??
        readPath(status, ["whatsapp", "linked"])
    );

    const telegramLinked = truthyValue(
      readPath(status, ["channel_links", "telegram_linked"]) ??
        readPath(status, ["channel_links", "telegram", "linked"]) ??
        readPath(status, ["workspace", "channel_links", "telegram_linked"]) ??
        readPath(status, ["workspace", "channel_links", "telegram", "linked"]) ??
        readPath(status, ["account", "channel_links", "telegram_linked"]) ??
        readPath(status, ["account", "channel_links", "telegram", "linked"]) ??
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

  const attention = useMemo(() => {
    if (!activeNow && creditBalance <= 0) {
      return {
        title: "Account attention needed",
        message:
          "Starter or already-covered questions may still work, but some live asks can be blocked until plan and credits are active.",
      };
    }

    if (!activeNow) {
      return {
        title: "Subscription attention needed",
        message:
          "The page is working, but your billing state may still block some fresh questions until the subscription shows active.",
      };
    }

    return null;
  }, [activeNow, creditBalance]);

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
      return;
    }

    setSubmitting(true);
    setResultOk(null);
    setFriendlyError("");
    setAnswer("");
    setClarificationPrompt("");
    setCitations([]);

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
            clarification_prompt?: string;
          };
          message?: string;
        };

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
      <div style={{ display: "grid", gap: 20 }}>
        <div style={gridAutoFit(160)}>
          <button
            onClick={() => {
              void load("Refreshing assistant state...");
            }}
            style={secondaryButtonStyle(busy)}
            disabled={busy}
          >
            Refresh
          </button>

          <button onClick={() => router.push("/plans")} style={secondaryButtonStyle(false)}>
            Plans
          </button>

          <button onClick={() => router.push("/credits")} style={secondaryButtonStyle(false)}>
            Credits
          </button>
        </div>

        {attention ? (
          <div
            style={{
              ...pageCardStyle(),
              ...toneStyles("warn"),
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
              {attention.title}
            </div>

            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 15,
                lineHeight: 1.8,
              }}
            >
              {attention.message}
            </div>
          </div>
        ) : null}

        <div
          style={{
            ...gridAutoFit(320),
            gap: 22,
          }}
        >
          <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
            <div style={pageCardStyle()}>
              <div style={{ display: "grid", gap: 16 }}>
                <div style={gridAutoFit(180)}>
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
                      PLAN
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 950, color: "var(--text)" }}>
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
                      CREDITS
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 950, color: "var(--text)" }}>
                      {String(creditBalance)}
                    </div>
                  </div>

                  <div
                    style={metricCardStyle(
                      channelSummary === "No channel linked" ? "default" : "good"
                    )}
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
                      CHANNELS
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 950,
                        color: "var(--text)",
                        lineHeight: 1.35,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {channelSummary}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
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
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        void handleAsk();
                      }
                    }}
                    placeholder="Ask one clear tax question at a time."
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
                    ...gridAutoFit(220),
                    gap: 14,
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

                  <button onClick={handleClear} style={secondaryButtonStyle(busy)} disabled={busy}>
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
                    ...toneStyles("warn"),
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
                <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
                  <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                    <div style={chipStyle()}>Latest answer</div>
                    <div style={chipStyle(true)}>Question: {latestQuestionLabel}</div>
                  </div>

                  <div
                    style={{
                      borderRadius: 28,
                      border: "1px solid var(--success-border)",
                      background: "var(--success-bg)",
                      padding: "clamp(18px, 3vw, 28px)",
                      display: "grid",
                      gap: 18,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        color: "var(--text)",
                        fontSize: "clamp(20px, 4vw, 26px)",
                        fontWeight: 950,
                        lineHeight: 1.55,
                        letterSpacing: -0.2,
                        overflowWrap: "anywhere",
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
                            overflowWrap: "anywhere",
                          }}
                        >
                          {section.title}
                        </div>

                        {section.ordered ? (
                          <ol
                            style={{
                              margin: 0,
                              paddingLeft: 24,
                              display: "grid",
                              gap: 12,
                              color: "var(--text)",
                              fontSize: 16,
                              lineHeight: 1.8,
                              overflowWrap: "anywhere",
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
                              fontSize: 16,
                              lineHeight: 1.8,
                              overflowWrap: "anywhere",
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
                          overflowWrap: "anywhere",
                        }}
                      >
                        <strong style={{ color: "var(--text)" }}>Source:</strong> {parsed.source}
                      </div>
                    ) : null}

                    {citations.length ? (
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          paddingTop: 16,
                          display: "grid",
                          gap: 8,
                          minWidth: 0,
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
                            overflowWrap: "anywhere",
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
            </div>
          </div>

          <div
            style={{
              ...pageCardStyle(),
              position: "relative",
              minWidth: 0,
            }}
          >
            <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
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
                            overflowWrap: "anywhere",
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

export default function AskPage() {
  return (
    <Suspense fallback={<AskPageFallback />}>
      <AskPageContent />
    </Suspense>
  );
}
