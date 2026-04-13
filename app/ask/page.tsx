"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type UnknownRecord = Record<string, unknown>;

type WorkspaceChannelLinks = {
  whatsapp_linked?: boolean | null;
  telegram_linked?: boolean | null;
  whatsapp?: { linked?: boolean | null } | null;
  telegram?: { linked?: boolean | null } | null;
};

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

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
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

function cleanQuestion(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeSummary(payload: unknown): WorkspaceSummary {
  const root = asRecord(payload) ?? {};
  const data =
    asRecord(root.data) ??
    asRecord(root.summary) ??
    asRecord(root.account) ??
    root;

  const channelLinks =
    (asRecord(data.channel_links) as WorkspaceChannelLinks | null) ??
    (asRecord(data.channels) as WorkspaceChannelLinks | null) ??
    null;

  type ChannelLinksShape = {
    whatsapp_linked?: unknown;
    telegram_linked?: unknown;
    whatsapp?: { linked?: unknown } | null;
    telegram?: { linked?: unknown } | null;
  };

  const channelLinksValue = (channelLinks ?? null) as ChannelLinksShape | null;

  const whatsappLinked = truthyValue(
    channelLinksValue?.whatsapp_linked ?? channelLinksValue?.whatsapp?.linked
  );

  const telegramLinked = truthyValue(
    channelLinksValue?.telegram_linked ?? channelLinksValue?.telegram?.linked
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
    firstString(record.title, record.heading, record.label, record.name) ??
    "Details";

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
  if (sourceMatch && sourceMatch.index !== undefined) {
    source = sourceMatch[1].trim();
    body = normalized.slice(0, sourceMatch.index).trim();
  }

  const blocks = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const lead = blocks.shift() ?? "";

  const sections: AnswerSection[] = blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) return null;

      let title = "Details";

      if (lines[0].endsWith(":")) {
        title = lines.shift()!.replace(/:$/, "").trim();
      } else if (
        lines.length > 1 &&
        /^[A-Z][A-Za-z0-9\s/()-]+$/.test(lines[0]) &&
        lines[0].length < 40
      ) {
        title = lines.shift()!.trim();
      }

      const ordered = lines.every((line) => /^\d+\.\s+/.test(line));
      const cleanedLines = lines.map((line) =>
        line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "")
      );

      if (!cleanedLines.length) return null;

      return { title, lines: cleanedLines, ordered };
    })
    .filter((section): section is AnswerSection => section !== null);

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
      root.answer as string | undefined,
      root.text as string | undefined,
      root.message as string | undefined
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

async function tryJson(url: string, init?: RequestInit) {
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

function SidebarCard({
  companyName,
  companyPhone,
}: {
  companyName: string;
  companyPhone: string;
}) {
  return (
    <>
      <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-center text-[18px] font-semibold text-slate-900"
        >
          Collapse
        </button>
      </div>

      <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-amber-300">
            NTG
          </div>
          <div className="min-w-0">
            <div className="text-[19px] font-extrabold text-slate-900">
              Naija Tax Guide
            </div>
            <div className="text-[17px] font-bold text-amber-700">
              {companyName}
            </div>
            <div className="mt-1 text-[15px] leading-6 text-slate-600">
              Structured tax guidance workspace
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-[14px] font-extrabold tracking-[0.08em] text-slate-500">
          WORKSPACE
        </div>

        <nav className="space-y-3">
          <SidebarLink href="/dashboard" label="Dashboard" />
          <SidebarLink href="/ask" label="Ask" active />
          <SidebarLink href="/channels" label="Channels" badge="Full" />
          <SidebarLink href="/workspace" label="Workspace" badge="Full" />
          <SidebarLink href="/history" label="History" />
        </nav>
      </div>

      <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-[18px] font-extrabold text-slate-900">
          Company Contact
        </div>
        <div className="mt-4 text-[16px] text-slate-700">{companyName}</div>
        <div className="mt-2 text-[16px] text-slate-700">{companyPhone}</div>

        <div className="mt-6 flex flex-wrap gap-4 text-[16px] font-semibold text-slate-900">
          <Link href="/contact" className="hover:text-slate-700">
            Contact
          </Link>
          <Link href="/support" className="hover:text-slate-700">
            Support
          </Link>
          <Link href="/privacy" className="hover:text-slate-700">
            Privacy
          </Link>
        </div>
      </div>
    </>
  );
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
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-[22px] border px-4 py-4 text-[18px] font-bold transition-colors",
        active
          ? "border-indigo-200 bg-indigo-50 text-slate-900"
          : "border-transparent bg-transparent text-slate-800 hover:border-slate-200 hover:bg-slate-50"
      )}
    >
      <span>{label}</span>
      {badge ? (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[13px] font-bold text-amber-700">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function StatCard({
  title,
  value,
  accent = "default",
}: {
  title: string;
  value: string;
  accent?: "default" | "soft-green";
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border p-5 shadow-sm",
        accent === "soft-green"
          ? "border-emerald-100 bg-emerald-50"
          : "border-amber-100 bg-amber-50/50"
      )}
    >
      <div className="text-[13px] font-extrabold tracking-[0.08em] text-slate-600">
        {title}
      </div>
      <div className="mt-2 text-[22px] font-extrabold text-slate-900">{value}</div>
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
    <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-[18px] font-extrabold text-slate-900">
        Starter questions
      </div>
      <div className="mt-2 text-[15px] leading-6 text-slate-600">
        Tap any question below to load it into the ask box.
      </div>

      <div className="mt-6 space-y-6">
        {STARTER_QUESTIONS.map((group) => (
          <div key={group.title}>
            <div className="mb-3 text-[14px] font-extrabold tracking-[0.04em] text-slate-600">
              {group.title}
            </div>

            <div className="space-y-3">
              {group.questions.map((starter) => {
                const active = cleanQuestion(starter) === normalizedCurrent;

                return (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => onSelect(starter)}
                    className={cn(
                      "w-full rounded-[20px] border px-5 py-4 text-left text-[18px] font-bold transition-colors",
                      active
                        ? "border-indigo-300 bg-indigo-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                    )}
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
    return (
      <div className="min-h-[420px] rounded-[28px] border border-slate-200 bg-white shadow-sm" />
    );
  }

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap gap-3">
        <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[15px] font-bold text-slate-900">
          Latest answer
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[15px] font-bold text-slate-900">
          Question: {answer.question}
        </span>
      </div>

      <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/40 p-8">
        <h2 className="text-[24px] font-extrabold leading-[1.45] text-slate-900 md:text-[28px]">
          {answer.lead}
        </h2>

        <div className="mt-8 space-y-6">
          {answer.sections.map((section) => (
            <div
              key={`${section.title}-${section.lines.join("|")}`}
              className="rounded-[24px] border border-slate-200 bg-white/70 p-7"
            >
              <div className="text-[22px] font-extrabold text-slate-900">
                {section.title}
              </div>

              {section.ordered ? (
                <ol className="mt-5 list-decimal space-y-4 pl-7 text-[17px] leading-9 text-slate-900 md:text-[18px]">
                  {section.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              ) : (
                <ul className="mt-5 space-y-4 text-[17px] leading-9 text-slate-900 md:text-[18px]">
                  {section.lines.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span className="mt-[14px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {answer.source ? (
          <div className="mt-8 border-t border-slate-200 pt-6 text-[15px] leading-8 text-slate-600">
            <span className="font-bold text-slate-800">Source:</span> {answer.source}
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
          setIsLoadingSummary(false);
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
          setIsSubmitting(false);
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

  const selectedStarterText = useMemo(() => cleanQuestion(question), [question]);

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-6 p-4 lg:grid-cols-[360px_minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <SidebarCard
            companyName={summary.companyName}
            companyPhone={summary.companyPhone}
          />
        </div>

        <div className="space-y-5">
          <div className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 md:px-8">
              <div>
                <h1 className="text-[30px] font-extrabold tracking-[-0.02em] text-slate-900 md:text-[34px]">
                  Ask Naija Tax Guide
                </h1>
                <p className="mt-2 text-[18px] leading-8 text-slate-600">
                  Ask a practical Nigerian tax question and get a structured
                  response inside your workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void loadSummary();
                  }}
                  className="rounded-[20px] border border-indigo-200 bg-white px-6 py-4 text-[18px] font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
                <Link
                  href="/plans"
                  className="rounded-[20px] border border-slate-300 bg-slate-100 px-6 py-4 text-[18px] font-bold text-slate-900 transition hover:bg-slate-200"
                >
                  Plans
                </Link>
                <Link
                  href="/credits"
                  className="rounded-[20px] border border-rose-200 bg-white px-6 py-4 text-[18px] font-bold text-slate-900 transition hover:bg-rose-50"
                >
                  Credits
                </Link>
              </div>
            </div>

            <div className="px-6 py-6 md:px-8">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-5">
                <div className="text-[18px] font-extrabold text-slate-900">
                  {isLoadingSummary ? "Loading account status..." : "Account attention needed"}
                </div>
                <div className="mt-2 text-[17px] leading-8 text-slate-600">
                  {notice ??
                    "Starter or already-covered questions may still work, but some live asks can be blocked until plan and credits are active."}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard title="PLAN" value={summary.planLabel} />
                <StatCard title="CREDITS" value={summary.creditsLabel} />
                <StatCard title="DAILY LEFT" value={summary.dailyLeftLabel} />
                <StatCard
                  title="CHANNELS"
                  value={summary.channelsLabel}
                  accent="soft-green"
                />
              </div>

              <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <label
                  htmlFor="ask-question"
                  className="mb-3 block text-[18px] font-bold text-slate-800"
                >
                  Question
                </label>

                <textarea
                  id="ask-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask one clear tax question at a time."
                  className="min-h-[240px] w-full resize-y rounded-[24px] border border-slate-300 bg-white px-6 py-5 font-mono text-[20px] leading-9 text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />

                <div className="mt-4 text-[16px] leading-7 text-slate-600">
                  Tip: use one clear question at a time. Press Ctrl + Enter to
                  submit quickly.
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[320px_220px_180px]">
                  <div>
                    <label className="mb-3 block text-[18px] font-bold text-slate-800">
                      Reply language
                    </label>
                    <select
                      value={replyLanguage}
                      onChange={(event) => setReplyLanguage(event.target.value)}
                      className="w-full rounded-[20px] border border-slate-300 bg-white px-5 py-4 text-[18px] text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="English">English</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleAsk();
                    }}
                    disabled={isSubmitting}
                    className="self-end rounded-[20px] border border-indigo-200 bg-white px-6 py-4 text-[18px] font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Asking..." : "Ask Question"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isSubmitting}
                    className="self-end rounded-[20px] border border-slate-300 bg-slate-100 px-6 py-4 text-[18px] font-bold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>

                {errorText ? (
                  <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-[16px] leading-7 text-rose-700">
                    {errorText}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <AnswerView answer={answer} />

          <footer className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[20px] font-extrabold text-slate-900">
                  Naija Tax Guide
                </div>
                <div className="mt-2 text-[17px] leading-8 text-slate-600">
                  Operated by {summary.companyName}.
                </div>
                <div className="mt-1 text-[17px] leading-8 text-slate-600">
                  General contact: {summary.companyPhone}
                </div>
                <div className="mt-4 text-[16px] text-slate-500">
                  © 2026 Naija Tax Guide · {summary.companyName}. All rights
                  reserved.
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3 text-[17px] font-semibold text-slate-900">
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

        <div>
          <StarterRail
            currentQuestion={selectedStarterText}
            onSelect={handleStarterSelect}
          />
        </div>
      </div>
    </main>
  );
}
