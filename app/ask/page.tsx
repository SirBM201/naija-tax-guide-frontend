"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";

type UnknownRecord = Record<string, unknown>;

type WorkspaceSummary = {
  planLabel: string;
  creditsLabel: string;
  dailyLeftLabel: string;
  channelsLabel: string;
  companyName: string;
  companyPhone: string;
  whatsappLinked: boolean;
  telegramLinked: boolean;
};

type AnswerSection = {
  title: string;
  lines: string[];
  ordered: boolean;
};

type StructuredAnswer = {
  question: string;
  lead: string;
  sections: AnswerSection[];
  source?: string;
};

type StarterCategory = {
  title: string;
  questions: string[];
};

const STARTER_QUESTIONS: StarterCategory[] = [
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

const SUMMARY_ENDPOINTS = [
  "/api/web/workspace/summary",
  "/api/workspace/summary",
  "/api/web/account/summary",
  "/api/account/summary",
];

const ASK_ENDPOINTS = ["/api/web/ask", "/api/ask"];

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : null;
}

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "yes", "linked", "active"].includes(normalized);
  }
  return false;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function cleanQuestion(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeSummary(payload: unknown): WorkspaceSummary {
  const root = asRecord(payload) ?? {};
  const data =
    asRecord(root.data) ??
    asRecord(root.summary) ??
    asRecord(root.account) ??
    root;

  const channelLinks = asRecord(data.channel_links) ?? asRecord(data.channels);

  const whatsappLinked = truthyValue(
    channelLinks?.whatsapp_linked ?? asRecord(channelLinks?.whatsapp)?.linked
  );

  const telegramLinked = truthyValue(
    channelLinks?.telegram_linked ?? asRecord(channelLinks?.telegram)?.linked
  );

  const planLabel =
    firstString(
      data.plan_label,
      data.plan_name,
      data.plan,
      asRecord(data.subscription)?.plan_name,
      asRecord(data.subscription)?.plan
    ) ?? "Free";

  const credits =
    firstNumber(
      data.credits_balance,
      data.credit_balance,
      data.credits,
      asRecord(data.wallet)?.credits,
      asRecord(data.limits)?.credits_left
    ) ?? 0;

  const dailyLeft =
    firstNumber(
      data.daily_left,
      asRecord(data.limits)?.daily_left,
      asRecord(data.ask_limits)?.daily_left
    ) ?? null;

  let channelsLabel = "No channel linked";
  if (telegramLinked && whatsappLinked) channelsLabel = "Telegram + WhatsApp linked";
  else if (telegramLinked) channelsLabel = "Telegram linked";
  else if (whatsappLinked) channelsLabel = "WhatsApp linked";

  return {
    planLabel,
    creditsLabel: String(credits),
    dailyLeftLabel: dailyLeft === null ? "—" : String(dailyLeft),
    channelsLabel,
    companyName:
      firstString(
        data.company_name,
        asRecord(data.company)?.name,
        asRecord(data.workspace)?.company_name
      ) ?? "BMS Creative Concept",
    companyPhone:
      firstString(
        data.company_phone,
        asRecord(data.company)?.phone,
        asRecord(data.workspace)?.company_phone
      ) ?? "+2347034941158",
    whatsappLinked,
    telegramLinked,
  };
}

function normalizeSection(item: unknown): AnswerSection | null {
  const record = asRecord(item);
  if (!record) return null;

  const title =
    firstString(record.title, record.heading, record.label, record.name) ?? "Details";

  const ordered = truthyValue(record.ordered);

  const rawItems = Array.isArray(record.lines)
    ? record.lines
    : Array.isArray(record.items)
      ? record.items
      : Array.isArray(record.points)
        ? record.points
        : null;

  let lines: string[] = [];

  if (rawItems) {
    lines = rawItems
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);
  } else {
    const body = firstString(record.body, record.text, record.content);
    if (body) {
      lines = body
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, ""));
    }
  }

  if (!lines.length) return null;

  return { title, lines, ordered };
}

function parseStructuredText(question: string, text: string): StructuredAnswer {
  const normalized = text.replace(/\r/g, "").trim();

  let source: string | undefined;
  let body = normalized;

  const sourceMatch = normalized.match(/\n?Source:\s*(.+)$/is);
  if (sourceMatch && typeof sourceMatch.index === "number") {
    source = sourceMatch[1].trim();
    body = normalized.slice(0, sourceMatch.index).trim();
  }

  const blocks = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const lead = blocks.shift() ?? "";

  const sections: AnswerSection[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) continue;

    let title = "Details";

    if (lines[0].endsWith(":")) {
      title = lines[0].replace(/:$/, "").trim();
      lines.shift();
    } else if (
      lines.length > 1 &&
      /^[A-Z][A-Za-z0-9\s/()'-]+$/.test(lines[0]) &&
      lines[0].length < 50
    ) {
      title = lines[0].trim();
      lines.shift();
    }

    const ordered = lines.every((line) => /^\d+\.\s+/.test(line));
    const cleanedLines = lines.map((line) =>
      line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "")
    );

    if (!cleanedLines.length) continue;

    sections.push({
      title,
      lines: cleanedLines,
      ordered,
    });
  }

  return {
    question,
    lead,
    sections,
    source,
  };
}

function normalizeAnswerPayload(question: string, payload: unknown): StructuredAnswer {
  const root = asRecord(payload) ?? {};
  const candidate =
    asRecord(root.data) ??
    asRecord(root.answer) ??
    asRecord(root.response) ??
    asRecord(root.result) ??
    root;

  const lead =
    firstString(candidate.lead, candidate.summary, candidate.intro, candidate.headline) ??
    undefined;

  const source =
    firstString(candidate.source, candidate.sources, candidate.reference) ?? undefined;

  const questionText =
    firstString(candidate.question, root.question, question) ?? question;

  const sectionCandidates = [
    candidate.sections,
    candidate.blocks,
    candidate.cards,
    candidate.parts,
  ];

  for (const entry of sectionCandidates) {
    if (Array.isArray(entry)) {
      const sections = entry
        .map((item) => normalizeSection(item))
        .filter((item): item is AnswerSection => item !== null);

      if (sections.length) {
        return {
          question: questionText,
          lead:
            lead ??
            firstString(candidate.answer_text, candidate.text, candidate.body) ??
            "",
          sections,
          source,
        };
      }
    }
  }

  const fullText =
    firstString(
      candidate.answer_text,
      candidate.answer,
      candidate.text,
      candidate.body,
      root.answer,
      root.text,
      root.message
    ) ?? "";

  if (fullText) {
    return parseStructuredText(questionText, fullText);
  }

  return {
    question: questionText,
    lead: "No answer was returned for this question.",
    sections: [],
    source,
  };
}

async function tryJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json();
}

function SidebarLink({
  href,
  label,
  active = false,
  badge,
}: {
  href: string;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Link href={href} className={`sidebarLink ${active ? "sidebarLinkActive" : ""}`}>
      <span>{label}</span>
      {badge ? <span className="sidebarBadge">{badge}</span> : null}
    </Link>
  );
}

function StatCard({
  title,
  value,
  green = false,
}: {
  title: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className={`statCard ${green ? "statCardGreen" : ""}`}>
      <div className="statTitle">{title}</div>
      <div className="statValue">{value}</div>
    </div>
  );
}

function StarterRail({
  currentQuestion,
  onSelect,
}: {
  currentQuestion: string;
  onSelect: (question: string) => void;
}) {
  const normalizedCurrent = cleanQuestion(currentQuestion);

  return (
    <aside className="panel starterRail">
      <div className="starterTitle">Starter questions</div>
      <div className="starterSubtext">
        Tap any question below to load it into the ask box.
      </div>

      <div className="starterGroups">
        {STARTER_QUESTIONS.map((group) => (
          <div key={group.title} className="starterGroup">
            <div className="starterGroupTitle">{group.title}</div>

            <div className="starterButtons">
              {group.questions.map((starter) => {
                const active = cleanQuestion(starter) === normalizedCurrent;

                return (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => onSelect(starter)}
                    className={`starterButton ${active ? "starterButtonActive" : ""}`}
                  >
                    {starter}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function AnswerView({ answer }: { answer: StructuredAnswer | null }) {
  if (!answer) {
    return <div className="panel emptyAnswerPanel" />;
  }

  return (
    <section className="panel answerOuterPanel">
      <div className="answerMetaRow">
        <span className="pill">Latest answer</span>
        <span className="pill">Question: {answer.question}</span>
      </div>

      <div className="answerCard">
        <h2 className="answerLead">{answer.lead}</h2>

        <div className="answerSections">
          {answer.sections.map((section) => (
            <div
              key={`${section.title}-${section.lines.join("|")}`}
              className="answerSectionCard"
            >
              <div className="answerSectionTitle">{section.title}</div>

              {section.ordered ? (
                <ol className="answerOrderedList">
                  {section.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              ) : (
                <ul className="answerBulletList">
                  {section.lines.map((line) => (
                    <li key={line}>
                      <span className="bulletDot" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {answer.source ? (
          <div className="answerSource">
            <span className="answerSourceLabel">Source:</span> {answer.source}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function AskPage() {
  const [summary, setSummary] = useState<WorkspaceSummary>({
    planLabel: "Free",
    creditsLabel: "0",
    dailyLeftLabel: "—",
    channelsLabel: "No channel linked",
    companyName: "BMS Creative Concept",
    companyPhone: "+2347034941158",
    whatsappLinked: false,
    telegramLinked: false,
  });

  const [question, setQuestion] = useState("");
  const [replyLanguage, setReplyLanguage] = useState("English");
  const [answer, setAnswer] = useState<StructuredAnswer | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoadingSummary(true);

    try {
      for (const endpoint of SUMMARY_ENDPOINTS) {
        try {
          const payload = await tryJson(endpoint, { method: "GET" });
          setSummary(normalizeSummary(payload));
          return;
        } catch {
          // try next endpoint
        }
      }
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handleStarterSelect = useCallback((starter: string) => {
    setQuestion(starter);
    setErrorText(null);
  }, []);

  const handleClear = useCallback(() => {
    setQuestion("");
    setErrorText(null);
  }, []);

  const handleAsk = useCallback(async () => {
    const trimmed = question.trim();

    if (!trimmed) {
      setErrorText("Enter one clear question before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);
    setNotice(null);

    try {
      let lastError = "Unable to submit your question right now.";

      for (const endpoint of ASK_ENDPOINTS) {
        try {
          const payload = await tryJson(endpoint, {
            method: "POST",
            body: JSON.stringify({
              question: trimmed,
              language: replyLanguage,
            }),
          });

          const normalized = normalizeAnswerPayload(trimmed, payload);
          setAnswer(normalized);
          setNotice(
            "Starter or already-covered questions may still work. Some live asks can require an active plan or available credits."
          );
          void loadSummary();
          return;
        } catch (error) {
          lastError =
            error instanceof Error && error.message.trim()
              ? error.message.trim()
              : lastError;
        }
      }

      setErrorText(lastError);
    } finally {
      setIsSubmitting(false);
    }
  }, [loadSummary, question, replyLanguage]);

  const onQuestionKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && event.ctrlKey) {
        event.preventDefault();
        void handleAsk();
      }
    },
    [handleAsk]
  );

  const selectedStarterText = useMemo(() => cleanQuestion(question), [question]);

  return (
    <div className="askPage">
      <div className="askGrid">
        <div className="leftColumn">
          <div className="panel">
            <button type="button" className="collapseButton">
              Collapse
            </button>
          </div>

          <div className="panel brandPanel">
            <div className="brandRow">
              <div className="brandLogo">NTG</div>
              <div className="brandText">
                <div className="brandName">Naija Tax Guide</div>
                <div className="brandCompany">{summary.companyName}</div>
                <div className="brandDesc">Structured tax guidance workspace</div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="sidebarHeading">WORKSPACE</div>
            <div className="sidebarLinks">
              <SidebarLink href="/dashboard" label="Dashboard" />
              <SidebarLink href="/ask" label="Ask" active />
              <SidebarLink href="/channels" label="Channels" badge="Full" />
              <SidebarLink href="/workspace" label="Workspace" badge="Full" />
              <SidebarLink href="/history" label="History" />
            </div>
          </div>

          <div className="panel">
            <div className="contactTitle">Company Contact</div>
            <div className="contactLine">{summary.companyName}</div>
            <div className="contactLine">{summary.companyPhone}</div>

            <div className="contactLinks">
              <Link href="/contact">Contact</Link>
              <Link href="/support">Support</Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </div>
        </div>

        <div className="centerColumn">
          <div className="panel pageShell">
            <div className="pageHeader">
              <div>
                <h1 className="pageTitle">Ask Naija Tax Guide</h1>
                <p className="pageSubtitle">
                  Ask a practical Nigerian tax question and get a structured response
                  inside your workspace.
                </p>
              </div>

              <div className="headerActions">
                <button
                  type="button"
                  className="topActionButton"
                  onClick={() => {
                    void loadSummary();
                  }}
                >
                  Refresh
                </button>

                <Link href="/plans" className="topActionButton topActionButtonMuted">
                  Plans
                </Link>

                <Link href="/credits" className="topActionButton topActionButtonSoft">
                  Credits
                </Link>
              </div>
            </div>

            <div className="attentionBox">
              <div className="attentionTitle">
                {isLoadingSummary ? "Loading account status..." : "Account attention needed"}
              </div>
              <div className="attentionText">
                {notice ??
                  "Starter or already-covered questions may still work, but some live asks can be blocked until plan and credits are active."}
              </div>
            </div>

            <div className="statsGrid">
              <StatCard title="PLAN" value={summary.planLabel} />
              <StatCard title="CREDITS" value={summary.creditsLabel} />
              <StatCard title="DAILY LEFT" value={summary.dailyLeftLabel} />
              <StatCard title="CHANNELS" value={summary.channelsLabel} green />
            </div>

            <div className="panel formPanel">
              <label htmlFor="ask-question" className="fieldLabel">
                Question
              </label>

              <textarea
                id="ask-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={onQuestionKeyDown}
                placeholder="Ask one clear tax question at a time."
                className="questionInput"
              />

              <div className="tipText">
                Tip: use one clear question at a time. Press Ctrl + Enter to submit
                quickly.
              </div>

              <div className="controlsRow">
                <div className="languageBlock">
                  <label className="fieldLabel">Reply language</label>
                  <select
                    value={replyLanguage}
                    onChange={(event) => setReplyLanguage(event.target.value)}
                    className="languageSelect"
                  >
                    <option value="English">English</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="primaryButton"
                  disabled={isSubmitting}
                  onClick={() => {
                    void handleAsk();
                  }}
                >
                  {isSubmitting ? "Asking..." : "Ask Question"}
                </button>

                <button
                  type="button"
                  className="secondaryButton"
                  disabled={isSubmitting}
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>

              {errorText ? <div className="errorBox">{errorText}</div> : null}
            </div>
          </div>

          <AnswerView answer={answer} />

          <footer className="panel footerPanel">
            <div className="footerTop">
              <div>
                <div className="footerBrand">Naija Tax Guide</div>
                <div className="footerText">Operated by {summary.companyName}.</div>
                <div className="footerText">General contact: {summary.companyPhone}</div>
                <div className="footerCopy">
                  © 2026 Naija Tax Guide · {summary.companyName}. All rights reserved.
                </div>
              </div>

              <div className="footerLinks">
                <Link href="/contact">Contact</Link>
                <Link href="/support">Support</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/refund">Refund</Link>
                <Link href="/data-deletion">Data Deletion</Link>
              </div>
            </div>
          </footer>
        </div>

        <div className="rightColumn">
          <StarterRail
            currentQuestion={selectedStarterText}
            onSelect={handleStarterSelect}
          />
        </div>
      </div>

      <style jsx global>{`
        .askPage {
          min-height: 100vh;
          background: #f6f7fb;
          color: #0f172a;
          padding: 16px;
          box-sizing: border-box;
        }

        .askPage * {
          box-sizing: border-box;
        }

        .askPage .askGrid {
          max-width: 1800px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr) 420px;
          gap: 24px;
          align-items: start;
        }

        .askPage .leftColumn,
        .askPage .centerColumn,
        .askPage .rightColumn {
          min-width: 0;
        }

        .askPage .leftColumn,
        .askPage .centerColumn {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .askPage .rightColumn {
          position: sticky;
          top: 16px;
          align-self: start;
        }

        .askPage .panel {
          background: #ffffff;
          border: 1px solid #dbe1ea;
          border-radius: 28px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .askPage .collapseButton {
          width: 100%;
          border: 1px solid #dbe1ea;
          background: #f8fafc;
          color: #0f172a;
          border-radius: 22px;
          padding: 18px 20px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
        }

        .askPage .brandPanel {
          padding: 20px;
        }

        .askPage .brandRow {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .askPage .brandLogo {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: #0f172a;
          color: #fbbf24;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          flex: 0 0 auto;
        }

        .askPage .brandText {
          min-width: 0;
        }

        .askPage .brandName {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }

        .askPage .brandCompany {
          font-size: 18px;
          font-weight: 800;
          color: #b45309;
          margin-top: 4px;
        }

        .askPage .brandDesc {
          margin-top: 6px;
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
        }

        .askPage .sidebarHeading {
          padding: 20px 20px 0;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #64748b;
        }

        .askPage .sidebarLinks {
          padding: 16px 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .askPage .sidebarLink {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px;
          border-radius: 22px;
          border: 1px solid transparent;
          background: transparent;
          color: #0f172a;
          font-size: 18px;
          font-weight: 800;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .askPage .sidebarLink:hover {
          background: #f8fafc;
          border-color: #dbe1ea;
        }

        .askPage .sidebarLinkActive {
          background: #eef2ff;
          border-color: #c7d2fe;
        }

        .askPage .sidebarBadge {
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #fde68a;
          background: #fffbeb;
          color: #b45309;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
          flex: 0 0 auto;
        }

        .askPage .contactTitle {
          padding: 20px 20px 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .askPage .contactLine {
          padding: 0 20px;
          margin-top: 14px;
          font-size: 16px;
          color: #475569;
        }

        .askPage .contactLinks {
          padding: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .askPage .contactLinks a {
          color: #0f172a;
          text-decoration: none;
          font-size: 16px;
          font-weight: 700;
        }

        .askPage .pageShell {
          overflow: hidden;
        }

        .askPage .pageHeader {
          padding: 28px 30px 22px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }

        .askPage .pageTitle {
          margin: 0;
          font-size: 34px;
          line-height: 1.15;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #0f172a;
        }

        .askPage .pageSubtitle {
          margin: 10px 0 0;
          font-size: 18px;
          line-height: 1.7;
          color: #64748b;
        }

        .askPage .headerActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .askPage .topActionButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 120px;
          padding: 15px 22px;
          border-radius: 20px;
          border: 1px solid #c7d2fe;
          background: #ffffff;
          color: #0f172a;
          font-size: 18px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
        }

        .askPage .topActionButtonMuted {
          border-color: #cbd5e1;
          background: #e9edf5;
        }

        .askPage .topActionButtonSoft {
          border-color: #fecdd3;
          background: #ffffff;
        }

        .askPage .attentionBox {
          margin: 24px 30px 0;
          padding: 22px 24px;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #f8fafc;
        }

        .askPage .attentionTitle {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .askPage .attentionText {
          margin-top: 10px;
          font-size: 17px;
          line-height: 1.8;
          color: #64748b;
        }

        .askPage .statsGrid {
          margin: 24px 30px 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .askPage .statCard {
          padding: 20px;
          border-radius: 22px;
          border: 1px solid #fde7c7;
          background: #fffaf0;
        }

        .askPage .statCardGreen {
          border-color: #cce7dd;
          background: #f0fbf6;
        }

        .askPage .statTitle {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #64748b;
        }

        .askPage .statValue {
          margin-top: 10px;
          font-size: 22px;
          line-height: 1.4;
          font-weight: 900;
          color: #0f172a;
        }

        .askPage .formPanel {
          margin: 24px 30px 30px;
          padding: 24px;
        }

        .askPage .fieldLabel {
          display: block;
          margin-bottom: 10px;
          font-size: 18px;
          font-weight: 800;
          color: #1e293b;
        }

        .askPage .questionInput {
          width: 100%;
          min-height: 240px;
          resize: vertical;
          border: 1px solid #cbd5e1;
          border-radius: 24px;
          background: #ffffff;
          padding: 22px 24px;
          font-size: 20px;
          line-height: 1.8;
          color: #0f172a;
          outline: none;
        }

        .askPage .questionInput:focus {
          border-color: #a5b4fc;
          box-shadow: 0 0 0 4px rgba(165, 180, 252, 0.2);
        }

        .askPage .tipText {
          margin-top: 14px;
          font-size: 16px;
          line-height: 1.7;
          color: #64748b;
        }

        .askPage .controlsRow {
          margin-top: 22px;
          display: grid;
          grid-template-columns: minmax(220px, 320px) minmax(180px, 220px) minmax(160px, 180px);
          gap: 16px;
          align-items: end;
        }

        .askPage .languageBlock {
          min-width: 0;
        }

        .askPage .languageSelect {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          background: #ffffff;
          padding: 15px 18px;
          font-size: 18px;
          color: #0f172a;
          outline: none;
        }

        .askPage .languageSelect:focus {
          border-color: #a5b4fc;
          box-shadow: 0 0 0 4px rgba(165, 180, 252, 0.2);
        }

        .askPage .primaryButton,
        .askPage .secondaryButton {
          width: 100%;
          border-radius: 20px;
          padding: 15px 20px;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .askPage .primaryButton {
          border: 1px solid #c7d2fe;
          background: #ffffff;
          color: #0f172a;
        }

        .askPage .secondaryButton {
          border: 1px solid #cbd5e1;
          background: #e9edf5;
          color: #0f172a;
        }

        .askPage .primaryButton:disabled,
        .askPage .secondaryButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .askPage .errorBox {
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid #fecdd3;
          background: #fff1f2;
          color: #be123c;
          font-size: 16px;
          line-height: 1.7;
        }

        .askPage .emptyAnswerPanel {
          min-height: 420px;
        }

        .askPage .answerOuterPanel {
          padding: 24px;
        }

        .askPage .answerMetaRow {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
        }

        .askPage .pill {
          display: inline-flex;
          align-items: center;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid #dbe1ea;
          background: #ffffff;
          color: #0f172a;
          font-size: 15px;
          font-weight: 800;
        }

        .askPage .answerCard {
          border: 1px solid #cfe6da;
          border-radius: 28px;
          background: #f5fbf7;
          padding: 30px;
        }

        .askPage .answerLead {
          margin: 0;
          font-size: 28px;
          line-height: 1.5;
          font-weight: 900;
          color: #0f172a;
        }

        .askPage .answerSections {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .askPage .answerSectionCard {
          border: 1px solid #dde4ea;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.85);
          padding: 28px;
        }

        .askPage .answerSectionTitle {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
        }

        .askPage .answerOrderedList {
          margin: 18px 0 0;
          padding-left: 28px;
          font-size: 18px;
          line-height: 2;
          color: #0f172a;
        }

        .askPage .answerOrderedList li + li {
          margin-top: 6px;
        }

        .askPage .answerBulletList {
          list-style: none;
          margin: 18px 0 0;
          padding: 0;
        }

        .askPage .answerBulletList li {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 18px;
          line-height: 2;
          color: #0f172a;
        }

        .askPage .answerBulletList li + li {
          margin-top: 6px;
        }

        .askPage .bulletDot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #334155;
          margin-top: 14px;
          flex: 0 0 auto;
        }

        .askPage .answerSource {
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid #dde4ea;
          font-size: 15px;
          line-height: 1.9;
          color: #64748b;
        }

        .askPage .answerSourceLabel {
          font-weight: 800;
          color: #334155;
        }

        .askPage .starterRail {
          padding: 24px;
          max-height: calc(100vh - 32px);
          overflow: auto;
        }

        .askPage .starterTitle {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
        }

        .askPage .starterSubtext {
          margin-top: 8px;
          font-size: 15px;
          line-height: 1.7;
          color: #64748b;
        }

        .askPage .starterGroups {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .askPage .starterGroupTitle {
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.04em;
          color: #64748b;
        }

        .askPage .starterButtons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .askPage .starterButton {
          width: 100%;
          border-radius: 20px;
          border: 1px solid #dbe1ea;
          background: #ffffff;
          color: #0f172a;
          padding: 16px 18px;
          text-align: left;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
          line-height: 1.5;
        }

        .askPage .starterButton:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .askPage .starterButtonActive {
          background: #eef2ff;
          border-color: #c7d2fe;
        }

        .askPage .footerPanel {
          padding: 24px 28px;
        }

        .askPage .footerTop {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .askPage .footerBrand {
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
        }

        .askPage .footerText {
          margin-top: 8px;
          font-size: 17px;
          line-height: 1.8;
          color: #64748b;
        }

        .askPage .footerCopy {
          margin-top: 16px;
          font-size: 16px;
          color: #94a3b8;
        }

        .askPage .footerLinks {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          align-content: flex-start;
        }

        .askPage .footerLinks a {
          color: #0f172a;
          text-decoration: none;
          font-size: 17px;
          font-weight: 700;
        }

        @media (max-width: 1400px) {
          .askPage .askGrid {
            grid-template-columns: 320px minmax(0, 1fr);
          }

          .askPage .rightColumn {
            grid-column: 2;
            position: static;
          }

          .askPage .starterRail {
            max-height: none;
            overflow: visible;
          }
        }

        @media (max-width: 1100px) {
          .askPage .askGrid {
            grid-template-columns: 1fr;
          }

          .askPage .rightColumn {
            grid-column: auto;
          }

          .askPage .controlsRow {
            grid-template-columns: 1fr;
          }

          .askPage .statsGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .askPage {
            padding: 10px;
          }

          .askPage .pageHeader,
          .askPage .attentionBox,
          .askPage .formPanel,
          .askPage .statsGrid {
            margin-left: 16px;
            margin-right: 16px;
          }

          .askPage .formPanel {
            margin-bottom: 20px;
          }

          .askPage .pageTitle {
            font-size: 28px;
          }

          .askPage .pageSubtitle,
          .askPage .attentionText,
          .askPage .tipText,
          .askPage .footerText {
            font-size: 16px;
          }

          .askPage .statsGrid {
            grid-template-columns: 1fr;
          }

          .askPage .answerCard,
          .askPage .answerSectionCard,
          .askPage .starterRail,
          .askPage .footerPanel {
            padding: 20px;
          }

          .askPage .questionInput {
            min-height: 180px;
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
