"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, MetricCard, ShortcutCard } from "@/components/ui";
import {
  CardsGrid,
  SectionStack,
  TwoColumnSection,
} from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { buildWorkspaceAlerts } from "@/lib/workspace-alerts";

type AskResult = {
  ok?: boolean;
  answer?: string;
  message?: string;
  error?: string;
  source?: string;
  mode?: string;
  meta?: {
    usage_charged?: boolean;
    credits_consumed?: number;
    credit_cost?: number;
    credits_left?: number;
    credit_balance?: number;
    plan_code?: string;
    source_kind?: string;
    reference?: string;
  };
};

type AnswerSection = {
  title: string;
  body: string;
  tone?: "primary" | "default" | "note";
};

type StarterQuestionGroup = {
  title: string;
  questions: string[];
};

const STARTER_QUESTIONS: StarterQuestionGroup[] = [
  {
    title: "Personal Income Tax",
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
      "when should paye be remitted?",
    ],
  },
  {
    title: "VAT",
    questions: [
      "what is vat in nigeria?",
      "who should register for vat?",
      "when is vat due?",
    ],
  },
  {
    title: "Company Tax",
    questions: [
      "what is company income tax?",
      "when should a company file income tax?",
      "can company salary reduce taxable profit?",
    ],
  },
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

function safeNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeAnswer(text: string): string {
  return safeText(text, "")
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-*_]{2,}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitAnswer(answer: string): AnswerSection[] {
  const clean = normalizeAnswer(answer);
  if (!clean) return [];

  const labels = ["Direct answer:", "Key points:", "What to do:", "Note:"];
  const sections: AnswerSection[] = [];

  const lower = clean.toLowerCase();
  const found = labels
    .map((label) => {
      const index = lower.indexOf(label.toLowerCase());
      return { label, index };
    })
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index);

  if (!found.length) {
    return [
      {
        title: "Answer",
        body: clean,
        tone: "primary",
      },
    ];
  }

  for (let i = 0; i < found.length; i += 1) {
    const current = found[i];
    const next = found[i + 1];
    const start = current.index + current.label.length;
    const end = next ? next.index : clean.length;
    const body = clean.slice(start, end).trim();

    if (!body) continue;

    const lowerLabel = current.label.toLowerCase();
    sections.push({
      title: current.label.replace(":", ""),
      body,
      tone:
        lowerLabel.startsWith("direct")
          ? "primary"
          : lowerLabel.startsWith("note")
            ? "note"
            : "default",
    });
  }

  return sections.length
    ? sections
    : [
        {
          title: "Answer",
          body: clean,
          tone: "primary",
        },
      ];
}

function formatBody(body: string): React.ReactNode {
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);

  if (!lines.length) return null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {lines.map((line, index) => {
        const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
        const bullet = line.match(/^[•-]\s+(.*)$/);

        if (numbered) {
          return (
            <div
              key={`${line}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr",
                gap: 10,
                alignItems: "start",
              }}
            >
              <span
                style={{
                  color: "var(--text-muted)",
                  fontWeight: 900,
                  textAlign: "right",
                }}
              >
                {numbered[1]}.
              </span>
              <span style={answerTextStyle}>{numbered[2]}</span>
            </div>
          );
        }

        if (bullet) {
          return (
            <div
              key={`${line}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "22px 1fr",
                gap: 8,
                alignItems: "start",
              }}
            >
              <span style={{ color: "var(--brand)", fontWeight: 900 }}>•</span>
              <span style={answerTextStyle}>{bullet[1]}</span>
            </div>
          );
        }

        return (
          <p key={`${line}-${index}`} style={answerTextStyle}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

function getPlanCode(subscription: unknown, billing: unknown): string {
  const s = subscription as Record<string, unknown> | null | undefined;
  const b = billing as Record<string, unknown> | null | undefined;
  return safeText(s?.plan_code || b?.plan_code || "free", "free").toLowerCase();
}

function getPlanName(subscription: unknown, billing: unknown): string {
  const s = subscription as Record<string, unknown> | null | undefined;
  const b = billing as Record<string, unknown> | null | undefined;
  return safeText(
    s?.plan_name || b?.plan_name || s?.plan_code || b?.plan_code || "Free Forever",
    "Free Forever"
  );
}

function getCreditBalance(credits: unknown, billing: unknown): number {
  const c = credits as Record<string, unknown> | null | undefined;
  const b = billing as Record<string, unknown> | null | undefined;

  return safeNumber(
    c?.balance ??
      c?.credit_balance ??
      c?.credits_balance ??
      b?.credit_balance ??
      b?.credits_balance ??
      b?.usage_credits
  );
}

function getChannelSummary(channelLinks: unknown): string {
  const links = channelLinks as Record<string, unknown> | null | undefined;
  const whatsapp = links?.whatsapp as Record<string, unknown> | null | undefined;
  const telegram = links?.telegram as Record<string, unknown> | null | undefined;

  const isLinked = (channel: Record<string, unknown> | null | undefined, rootKeys: string[]) => {
    const rootLinked = rootKeys.some((key) => {
      const value = links?.[key];
      return value === true || value === "true" || value === 1 || value === "1";
    });

    const channelLinked =
      channel?.linked === true ||
      channel?.verified === true ||
      channel?.is_verified === true ||
      channel?.connected === true ||
      channel?.is_connected === true ||
      String(channel?.linked || "").toLowerCase() === "true" ||
      String(channel?.verified || "").toLowerCase() === "true" ||
      String(channel?.is_verified || "").toLowerCase() === "true" ||
      String(channel?.status || "").toLowerCase() === "connected" ||
      String(channel?.status || "").toLowerCase() === "linked" ||
      Boolean(safeText(channel?.value)) ||
      Boolean(safeText(channel?.provider_user_id)) ||
      Boolean(safeText(channel?.phone)) ||
      Boolean(safeText(channel?.username));

    return rootLinked || channelLinked;
  };

  const whatsappLinked = isLinked(whatsapp, ["whatsapp_linked", "whatsapp_verified"]);
  const telegramLinked = isLinked(telegram, ["telegram_linked", "telegram_verified"]);

  if (whatsappLinked && telegramLinked) return "WhatsApp + Telegram";
  if (whatsappLinked) return "WhatsApp linked";
  if (telegramLinked) return "Telegram linked";
  return "No channel linked";
}

function sectionCardStyle(tone: AnswerSection["tone"]): React.CSSProperties {
  const primary = tone === "primary";
  const note = tone === "note";

  return {
    border: primary
      ? "1px solid rgba(22, 163, 74, 0.2)"
      : note
        ? "1px solid rgba(217, 119, 6, 0.22)"
        : "1px solid var(--border)",
    borderRadius: 22,
    background: primary
      ? "rgba(240, 253, 244, 0.72)"
      : note
        ? "rgba(255, 251, 235, 0.72)"
        : "var(--surface)",
    padding: primary ? "22px" : "20px",
    display: "grid",
    gap: 14,
    minWidth: 0,
    overflowWrap: "anywhere",
  };
}

const labelStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const answerTextStyle: React.CSSProperties = {
  color: "var(--text)",
  fontSize: "clamp(16px, 1.65vw, 18px)",
  lineHeight: 1.75,
  fontWeight: 500,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  margin: 0,
};

const directTextStyle: React.CSSProperties = {
  color: "var(--text)",
  fontSize: "clamp(18px, 2vw, 22px)",
  lineHeight: 1.55,
  fontWeight: 800,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  margin: 0,
};

const formInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: 22,
  background: "var(--surface)",
  color: "var(--text)",
  padding: "18px 20px",
  fontSize: "clamp(16px, 2vw, 18px)",
  lineHeight: 1.7,
  outline: "none",
  resize: "vertical",
  minHeight: 160,
  overflowWrap: "anywhere",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: 18,
  background: "var(--surface)",
  color: "var(--text)",
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
};

export default function AskPage() {
  const router = useRouter();

  const {
    profile,
    usage,
    subscription,
    channelLinks,
    billing,
    credits,
    refreshAll,
  } = useWorkspaceState();

  const [question, setQuestion] = useState("");
  const [lang, setLang] = useState("en");
  const [result, setResult] = useState<AskResult | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const allAlerts = useMemo(
    () =>
      buildWorkspaceAlerts({
        profile,
        usage,
        subscription,
        channelLinks,
        billing,
        credits,
      }),
    [profile, usage, subscription, channelLinks, billing, credits]
  );

  const planName = getPlanName(subscription, billing);
  const planCode = getPlanCode(subscription, billing);
  const balance = getCreditBalance(credits, billing);
  const channelSummary = getChannelSummary(channelLinks);
  const answerSections = splitAnswer(result?.answer || "");

  async function submitQuestion() {
    const trimmed = question.trim();

    if (!trimmed) {
      setLocalError("Please enter a tax question first.");
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: trimmed,
          lang,
          channel: "web",
        }),
      });

      const data = (await response.json().catch(() => ({}))) as AskResult;

      if (!response.ok || data?.ok === false) {
        setResult(data);
        setLocalError(
          data?.message ||
            data?.error ||
            "We could not complete your question right now."
        );
        return;
      }

      setLastQuestion(trimmed);
      setResult(data);
      await refreshAll();
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Network error. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      submitQuestion();
    }
  }

  return (
    <AppShell
      title="Ask Naija Tax Guide"
      subtitle="Ask a practical Nigerian tax question and get a structured response inside your workspace."
      actions={
        <>
          <button type="button" onClick={() => refreshAll()} style={shellButtonSecondary()}>
            Refresh
          </button>
          <button type="button" onClick={() => router.push("/plans")} style={shellButtonSecondary()}>
            Plans
          </button>
          <button type="button" onClick={() => router.push("/credits")} style={shellButtonPrimary()}>
            Credits
          </button>
        </>
      }
    >
      <SectionStack>
        {allAlerts
          .filter((alert) => /credit|plan|login|session/i.test(`${alert.title} ${alert.subtitle}`))
          .slice(0, 1)
          .map((alert) => (
            <Banner
              key={`${alert.title}-${alert.subtitle}`}
              tone={alert.tone}
              title={alert.title}
              subtitle={alert.subtitle}
            />
          ))}

        {localError ? (
          <Banner
            tone="danger"
            title="Ask request issue"
            subtitle={localError}
          />
        ) : null}

        <TwoColumnSection leftRatio={1.15} rightRatio={0.85} gap={18} collapseAt={1020}>
          <WorkspaceSectionCard
            title="Ask a tax question"
            subtitle="Use one clear question at a time. Database/library answers are free; AI fallback uses Usage Credits."
          >
            <CardsGrid min={180} gap={14}>
              <MetricCard
                label="Plan"
                value={planName}
                helper={`Code: ${planCode}`}
              />
              <MetricCard
                label="Credits"
                value={String(balance)}
                tone={balance > 10 ? "good" : balance > 0 ? "warn" : "danger"}
                helper="Available Usage Credits"
              />
              <MetricCard
                label="Channels"
                value={channelSummary}
                helper="Linked messaging access"
              />
            </CardsGrid>

            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              <label htmlFor="tax-question" style={{ fontWeight: 900, fontSize: 18 }}>
                Question
              </label>

              <textarea
                id="tax-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Example: As a company owner, will I still pay personal income tax on salary from my company?"
                style={formInputStyle}
              />

              <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                Tip: Press Ctrl + Enter to submit quickly.
              </p>

              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "minmax(180px, 0.8fr) minmax(220px, 1.2fr)",
                }}
                className="ask-form-actions-grid"
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <label htmlFor="reply-lang" style={{ fontWeight: 900 }}>
                    Reply language
                  </label>
                  <select
                    id="reply-lang"
                    value={lang}
                    onChange={(event) => setLang(event.target.value)}
                    style={selectStyle}
                  >
                    <option value="en">English</option>
                    <option value="pidgin">Pidgin English</option>
                    <option value="yo">Yoruba</option>
                    <option value="ha">Hausa</option>
                    <option value="ig">Igbo</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "end" }}>
                  <button
                    type="button"
                    onClick={submitQuestion}
                    disabled={submitting}
                    style={{
                      ...shellButtonPrimary(),
                      width: "100%",
                      justifyContent: "center",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Asking..." : "Ask Question"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuestion("");
                  setResult(null);
                  setLocalError(null);
                }}
                style={{
                  ...shellButtonSecondary(),
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                Clear
              </button>
            </div>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Starter questions"
            subtitle="Tap any question to load it into the ask box."
          >
            <div style={{ display: "grid", gap: 18 }}>
              {STARTER_QUESTIONS.map((group) => (
                <div key={group.title} style={{ display: "grid", gap: 10 }}>
                  <div style={labelStyle}>{group.title}</div>
                  {group.questions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuestion(item)}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 18,
                        background: "var(--surface)",
                        padding: "14px 16px",
                        textAlign: "left",
                        color: "var(--text)",
                        fontWeight: 850,
                        lineHeight: 1.45,
                        cursor: "pointer",
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </WorkspaceSectionCard>
        </TwoColumnSection>

        <WorkspaceSectionCard
          title="Latest answer"
          subtitle={
            result?.meta?.usage_charged
              ? `AI answer used ${result.meta.credits_consumed || result.meta.credit_cost || 1} Usage Credit.`
              : result?.answer
                ? "This answer was served without a new AI credit charge when cache/database was used."
                : "Your answer will appear here after you submit a question."
          }
        >
          {!result?.answer ? (
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: 22,
                padding: 24,
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              No answer yet. Ask a tax question above to see the structured response here.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  background: "var(--surface-soft)",
                  padding: "14px 16px",
                  color: "var(--text)",
                  fontWeight: 800,
                  lineHeight: 1.55,
                  overflowWrap: "anywhere",
                }}
              >
                Question: {lastQuestion || question}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 14,
                  maxWidth: 920,
                  width: "100%",
                  margin: "0 auto",
                }}
              >
                {answerSections.map((section, index) => (
                  <section
                    key={`${section.title}-${index}`}
                    style={sectionCardStyle(section.tone)}
                  >
                    <h3
                      style={{
                        color: "var(--text)",
                        fontSize:
                          section.tone === "primary"
                            ? "clamp(20px, 2.3vw, 26px)"
                            : "clamp(18px, 2vw, 22px)",
                        lineHeight: 1.25,
                        fontWeight: 950,
                        margin: 0,
                      }}
                    >
                      {section.title}
                    </h3>

                    <div
                      style={
                        section.tone === "primary"
                          ? directTextStyle
                          : { display: "grid", gap: 10 }
                      }
                    >
                      {section.tone === "primary"
                        ? section.body
                        : formatBody(section.body)}
                    </div>
                  </section>
                ))}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <span
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "8px 12px",
                    color: "var(--text-muted)",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  Source: {safeText(result.source || result.mode, "answer")}
                </span>
                <span
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "8px 12px",
                    color: "var(--text-muted)",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  Credits charged: {result.meta?.usage_charged ? "Yes" : "No"}
                </span>
                {typeof result.meta?.credits_left === "number" ? (
                  <span
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 999,
                      padding: "8px 12px",
                      color: "var(--text-muted)",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    Credits left: {result.meta.credits_left}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Quick actions"
          subtitle="Move to the next relevant workspace area."
        >
          <CardsGrid min={220} gap={14}>
            <ShortcutCard
              title="Credits"
              subtitle="Review balance, top-ups, and usage history."
              tone="good"
              onClick={() => router.push("/credits")}
            />
            <ShortcutCard
              title="Plans"
              subtitle="Upgrade if you need more Usage Credits or channels."
              tone="default"
              onClick={() => router.push("/plans")}
            />
            <ShortcutCard
              title="Help"
              subtitle="Read app guidance and support details."
              tone="default"
              onClick={() => router.push("/help")}
            />
            <ShortcutCard
              title="Support"
              subtitle="Open a support request if something does not match."
              tone="warn"
              onClick={() => router.push("/support")}
            />
          </CardsGrid>
        </WorkspaceSectionCard>
      </SectionStack>

      <style jsx>{`
        @media (max-width: 720px) {
          .ask-form-actions-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
