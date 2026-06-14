"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, Card, MetricCard, appSelectStyle } from "@/components/ui";
import { apiJson } from "@/lib/api";

type QuizOption = { label: string; option_id: string; text: string };
type QuizQuestion = {
  id?: string;
  db_id?: string;
  question_code?: string;
  category?: string;
  difficulty?: string;
  question?: string;
  options?: QuizOption[];
  source_reference?: string;
};
type QuizLimit = { paid?: boolean; daily_limit?: number | null; attempts_today?: number; remaining_today?: number | null; limit_reached?: boolean };
type QuestionResp = { ok?: boolean; question?: QuizQuestion; limit?: QuizLimit; message?: string; error?: string };
type AnswerResp = { ok?: boolean; is_correct?: boolean; selected?: { label?: string; text?: string }; correct?: { label?: string; text?: string }; explanation?: string; premium_explanation?: string; source_reference?: string; limit?: QuizLimit; message?: string; error?: string };
type ScoreResp = { ok?: boolean; score?: { attempts_today?: number; correct_today?: number; wrong_today?: number }; limit?: QuizLimit };

const FALLBACK_CATEGORIES = ["Mixed", "PAYE", "VAT", "Company Tax", "WHT", "Records", "Deadlines", "Penalties"];

function safeText(value: unknown, fallback = "—") {
  const text = typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  return text || fallback;
}

function limitLabel(limit?: QuizLimit) {
  if (!limit) return "—";
  if (limit.paid) return "Unlimited";
  return `${Math.max(0, Number(limit.remaining_today ?? 0))} left today`;
}

function scorePercent(correct: number, attempts: number) {
  if (!attempts) return "0%";
  return `${Math.round((correct / attempts) * 100)}%`;
}

export default function QuizPage() {
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [category, setCategory] = useState("Mixed");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [answer, setAnswer] = useState<AnswerResp | null>(null);
  const [score, setScore] = useState<ScoreResp["score"] | null>(null);
  const [limit, setLimit] = useState<QuizLimit | undefined>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedOption = useMemo(() => (question?.options || []).find((option) => option.option_id === selectedOptionId), [question, selectedOptionId]);

  async function loadCategories() {
    try {
      const res = await apiJson<{ ok?: boolean; categories?: string[] }>("/web/quiz/categories", { method: "GET", timeoutMs: 20000, useAuthToken: false });
      const list = Array.isArray(res.categories) && res.categories.length ? res.categories : FALLBACK_CATEGORIES;
      setCategories(["Mixed", ...list.filter((item) => item && item !== "Mixed")]);
    } catch {
      setCategories(FALLBACK_CATEGORIES);
    }
  }

  async function loadScore() {
    try {
      const res = await apiJson<ScoreResp>("/web/quiz/score", { method: "GET", timeoutMs: 20000, useAuthToken: false });
      if (res.ok) {
        setScore(res.score || null);
        setLimit(res.limit);
      }
    } catch {}
  }

  async function loadQuestion(nextCategory = category) {
    setLoading(true);
    setError("");
    setAnswer(null);
    setSelectedOptionId("");
    try {
      const query: Record<string, string> = {};
      if (nextCategory && nextCategory !== "Mixed") query.category = nextCategory;
      const res = await apiJson<QuestionResp>("/web/quiz/question", { method: "GET", query, timeoutMs: 20000, useAuthToken: false });
      if (!res.ok || !res.question) {
        setError(res.message || res.error || "Unable to load quiz question.");
        setQuestion(null);
        setLimit(res.limit);
        return;
      }
      setQuestion(res.question);
      setLimit(res.limit);
    } catch (err: any) {
      setError(err?.message || "Unable to load quiz question.");
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!question || !selectedOption) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await apiJson<AnswerResp>("/web/quiz/answer", {
        method: "POST",
        body: {
          question_id: question.db_id,
          question_code: question.question_code || question.id,
          selected_option_id: selectedOption.option_id,
          selected_label: selectedOption.label,
        },
        timeoutMs: 20000,
        useAuthToken: false,
      });
      if (!res.ok) {
        setError(res.message || res.error || "Unable to submit answer.");
        setLimit(res.limit);
        return;
      }
      setAnswer(res);
      setLimit(res.limit);
      await loadScore();
    } catch (err: any) {
      setError(err?.message || "Unable to submit answer.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    void loadCategories();
    void loadScore();
    void loadQuestion("Mixed");
  }, []);

  const attempts = Number(score?.attempts_today || limit?.attempts_today || 0);
  const correct = Number(score?.correct_today || 0);
  const wrong = Number(score?.wrong_today || 0);

  return (
    <AppShell title="Tax Quiz" subtitle="Practice Nigerian tax concepts with non-AI quiz questions and convincing answer options.">
      <div style={{ display: "grid", gap: 18 }}>
        <Banner tone="good" title="Learn by testing yourself" subtitle="Free users get 12 non-AI quiz attempts daily. Paid users get unlimited non-AI quiz attempts. Quiz questions come from the learning bank, not live AI." />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          <MetricCard label="Attempts today" value={String(attempts)} helper="Non-AI quiz attempts" />
          <MetricCard label="Correct" value={String(correct)} helper={`Score: ${scorePercent(correct, attempts)}`} tone="good" />
          <MetricCard label="Wrong" value={String(wrong)} helper="Use explanations to improve" tone={wrong ? "warn" : "default"} />
          <MetricCard label="Remaining" value={limitLabel(limit)} helper={limit?.paid ? "Paid plan" : "Free daily limit"} />
        </div>

        <WorkspaceSectionCard title="Start quiz" subtitle="Choose a category, answer the question, then review the explanation.">
          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: "var(--text)", fontWeight: 900 }}>Category</span>
              <select value={category} onChange={(event) => { const next = event.target.value; setCategory(next); void loadQuestion(next); }} style={appSelectStyle()}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            {error ? <Card tone="danger"><div style={{ color: "var(--text)", fontWeight: 900 }}>{error}</div></Card> : null}

            {question ? (
              <Card>
                <div style={{ display: "grid", gap: 18 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span style={styles.pill}>{safeText(question.category, "General")}</span>
                    <span style={styles.pill}>{safeText(question.difficulty, "basic")}</span>
                  </div>
                  <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 22, lineHeight: 1.45 }}>{question.question}</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {(question.options || []).map((option) => {
                      const active = selectedOptionId === option.option_id;
                      return (
                        <button key={option.option_id} type="button" disabled={Boolean(answer)} onClick={() => setSelectedOptionId(option.option_id)} style={{ ...styles.optionButton, borderColor: active ? "rgba(99,102,241,0.85)" : "var(--border)", background: active ? "rgba(99,102,241,0.22)" : "var(--surface)" }}>
                          <strong>{option.label}.</strong> {option.text}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button type="button" onClick={submitAnswer} disabled={!selectedOptionId || Boolean(answer) || submitting} style={styles.primaryButton}>{submitting ? "Checking..." : "Submit answer"}</button>
                    <button type="button" onClick={() => loadQuestion(category)} disabled={loading} style={styles.secondaryButton}>{loading ? "Loading..." : "Next question"}</button>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </WorkspaceSectionCard>

        {answer ? (
          <WorkspaceSectionCard title={answer.is_correct ? "Correct" : "Review answer"}>
            <Card tone={answer.is_correct ? "good" : "warn"}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ color: "var(--text)", fontSize: 22, fontWeight: 900 }}>{answer.is_correct ? "Well done." : "Not quite."}</div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>Your answer: <strong>{safeText(answer.selected?.label)}</strong> — {safeText(answer.selected?.text)}</div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>Correct answer: <strong>{safeText(answer.correct?.label)}</strong> — {safeText(answer.correct?.text)}</div>
                <div style={{ color: "var(--text)", lineHeight: 1.85, fontWeight: 700 }}>{safeText(answer.explanation, "Review this topic and try another question.")}</div>
                {answer.source_reference ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Source: {answer.source_reference}</div> : null}
              </div>
            </Card>
          </WorkspaceSectionCard>
        ) : null}
      </div>
    </AppShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pill: { display: "inline-flex", alignItems: "center", borderRadius: 999, border: "1px solid var(--border)", padding: "7px 10px", color: "var(--text-muted)", fontWeight: 800, fontSize: 13 },
  optionButton: { width: "100%", borderRadius: 16, border: "1px solid var(--border)", color: "var(--text)", padding: "14px 16px", textAlign: "left", cursor: "pointer", fontWeight: 800, lineHeight: 1.65 },
  primaryButton: { borderRadius: 16, border: "1px solid var(--accent-border)", background: "var(--button-bg-strong)", color: "var(--text)", padding: "14px 18px", fontWeight: 900, cursor: "pointer" },
  secondaryButton: { borderRadius: 16, border: "1px solid var(--border-strong)", background: "var(--button-bg)", color: "var(--text)", padding: "14px 18px", fontWeight: 900, cursor: "pointer" },
};
