"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/site";
import { themeVars, useSharedTheme } from "@/lib/theme";

type BillingCycle = "monthly" | "quarterly" | "yearly";

type PublicPlan = {
  name: string;
  audience: string;
  prices: Record<BillingCycle, string>;
  credits: string;
  channels: string;
  support: string;
  highlights: string[];
  recommended?: boolean;
};

const billingOptions: { key: BillingCycle; label: string; helper: string }[] = [
  { key: "monthly", label: "Monthly", helper: "Pay month to month" },
  { key: "quarterly", label: "Quarterly", helper: "Pay every 3 months" },
  { key: "yearly", label: "Yearly", helper: "Pay once per year" },
];

const plans: PublicPlan[] = [
  {
    name: "Starter",
    audience: "Individuals, salary earners, and light tax guidance needs.",
    prices: {
      monthly: "₦5,000",
      quarterly: "₦14,000",
      yearly: "₦51,000",
    },
    credits: "100 monthly credits",
    channels: "Web + WhatsApp or Telegram",
    support: "Standard support",
    highlights: [
      "AI tax answers using Usage Credits",
      "Custom deadlines and reminders",
      "Basic document drafts and summaries",
      "Credit top-ups while subscription is active",
    ],
  },
  {
    name: "Professional",
    audience: "Freelancers, consultants, creators, and growing SMEs.",
    prices: {
      monthly: "₦12,000",
      quarterly: "₦33,600",
      yearly: "₦122,400",
    },
    credits: "300 monthly credits",
    channels: "Web + WhatsApp + Telegram",
    support: "Priority support",
    recommended: true,
    highlights: [
      "Everything in Starter",
      "Advanced AI tax explanations",
      "Document generation using credits",
      "Filing checklist support",
    ],
  },
  {
    name: "Business",
    audience: "Teams, businesses, consultants, and heavier compliance workflows.",
    prices: {
      monthly: "₦25,000",
      quarterly: "₦70,000",
      yearly: "₦255,000",
    },
    credits: "800 monthly credits",
    channels: "More channel capacity",
    support: "Priority business support",
    highlights: [
      "Everything in Professional",
      "Advanced business tax workflows",
      "Document generation and review",
      "Usage reports and audit trail",
    ],
  },
];

const topUps = [
  "10 credits - ₦500",
  "50 credits - ₦2,000",
  "100 credits - ₦3,500",
  "500 credits - ₦15,000",
];

function pageShell(): React.CSSProperties {
  return {
    minHeight: "100vh",
    background: "var(--app-bg)",
    color: "var(--text)",
    padding: "20px 14px 64px",
  };
}

function card(accent = false): React.CSSProperties {
  return {
    borderRadius: 22,
    border: accent ? "1px solid var(--gold)" : "1px solid var(--border)",
    background: "var(--panel-bg)",
    padding: 20,
    display: "grid",
    gap: 14,
    minWidth: 0,
    boxShadow: accent ? "var(--shadow-soft)" : undefined,
  };
}

function button(primary = true): React.CSSProperties {
  return {
    borderRadius: 16,
    border: primary ? "1px solid var(--accent-border)" : "1px solid var(--border-strong)",
    background: primary ? "var(--button-bg-strong)" : "var(--button-bg)",
    color: "var(--text)",
    fontWeight: 900,
    padding: "14px 16px",
    cursor: "pointer",
    width: "100%",
    fontSize: 14,
  };
}

function cycleButton(active: boolean): React.CSSProperties {
  return {
    borderRadius: 16,
    border: active ? "1px solid var(--accent-border)" : "1px solid var(--border)",
    background: active ? "var(--accent-soft)" : "var(--surface)",
    color: "var(--text)",
    padding: "12px 14px",
    cursor: "pointer",
    display: "grid",
    gap: 4,
    textAlign: "left",
    minWidth: 0,
  };
}

function pill(tone: "default" | "warn" | "good" = "default"): React.CSSProperties {
  const border = tone === "warn" ? "var(--warn-border)" : tone === "good" ? "var(--success-border)" : "var(--border)";
  const bg = tone === "warn" ? "var(--warn-bg)" : tone === "good" ? "var(--success-bg)" : "var(--surface)";
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: `1px solid ${border}`,
    background: bg,
    padding: "7px 11px",
    color: "var(--text-soft)",
    fontSize: 12,
    fontWeight: 800,
    width: "fit-content",
    maxWidth: "100%",
    overflowWrap: "anywhere",
  };
}

function billingLabel(cycle: BillingCycle): string {
  if (cycle === "quarterly") return "per quarter";
  if (cycle === "yearly") return "per year";
  return "per month";
}

export default function PublicPricingPage() {
  const router = useRouter();
  const { resolvedMode } = useSharedTheme();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <main style={{ ...pageShell(), ...themeVars(resolvedMode) }}>
      <div style={{ maxWidth: 1260, margin: "0 auto", display: "grid", gap: 28 }}>
        <header style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => router.push("/")} style={{ ...button(false), width: "auto" }}>
              Back Home
            </button>
            <button onClick={() => router.push("/login?next=/plans")} style={{ ...button(true), width: "auto" }}>
              Login to Choose Plan
            </button>
          </div>

          <section style={card(true)}>
            <div style={pill("good")}>Public pricing transparency</div>
            <h1 style={{ margin: 0, color: "var(--text)", fontSize: "clamp(34px, 7vw, 56px)", lineHeight: 1.02 }}>
              Clear plans before you create or upgrade an account.
            </h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "clamp(16px, 2.6vw, 18px)", lineHeight: 1.8, maxWidth: 900 }}>
              {SITE.name} shows monthly pricing first for Starter, Professional, and Business. Use the billing switch to compare quarterly or yearly payment structures without crowding each plan card.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={pill()}>Free tools remain available in the app</span>
              <span style={pill()}>Prices shown in Nigerian Naira</span>
              <span style={pill("warn")}>Secure checkout confirms final active price</span>
              <span style={pill()}>Information updated: {SITE.trustReviewDate}</span>
            </div>
          </section>
        </header>

        <section style={{ ...card(), gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, color: "var(--text)", fontSize: 24, lineHeight: 1.25 }}>Choose billing period</h2>
            <p style={{ margin: "8px 0 0", color: "var(--text-muted)", lineHeight: 1.65 }}>
              Monthly is shown by default. Switch only when you want to compare quarterly or yearly totals.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {billingOptions.map((option) => {
              const active = billingCycle === option.key;
              return (
                <button key={option.key} type="button" onClick={() => setBillingCycle(option.key)} style={cycleButton(active)}>
                  <span style={{ fontWeight: 950, fontSize: 15 }}>{option.label}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.4 }}>{option.helper}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {plans.map((plan) => (
            <article key={plan.name} style={card(Boolean(plan.recommended))}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0, color: "var(--text)", fontSize: 24, lineHeight: 1.2 }}>{plan.name}</h2>
                  <p style={{ margin: "8px 0 0", color: "var(--text-muted)", lineHeight: 1.65 }}>{plan.audience}</p>
                </div>
                {plan.recommended ? <span style={pill("good")}>Recommended</span> : null}
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--surface)", padding: 16 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>
                  {billingCycle} billing
                </div>
                <div style={{ marginTop: 6, color: "var(--text)", fontSize: "clamp(30px, 6vw, 42px)", lineHeight: 1.05, fontWeight: 950 }}>
                  {plan.prices[billingCycle]}
                </div>
                <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 14, fontWeight: 800 }}>
                  {billingLabel(billingCycle)}
                </div>
              </div>

              <div style={{ display: "grid", gap: 8, color: "var(--text)", lineHeight: 1.6 }}>
                <strong>{plan.credits}</strong>
                <span>{plan.channels}</span>
                <span>{plan.support}</span>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {plan.highlights.map((item) => (
                  <div key={item} style={{ display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)", gap: 8, color: "var(--text-muted)", lineHeight: 1.55 }}>
                    <strong style={{ color: "var(--accent)" }}>-</strong>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push("/login?next=/plans")} style={button(true)}>
                Choose {plan.name}
              </button>
            </article>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          <div style={card()}>
            <div style={pill()}>Credit top-ups</div>
            <h2 style={{ margin: 0, color: "var(--text)", fontSize: 26 }}>Optional credits for active paid users</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.8 }}>
              Top-ups add Usage Credits only. They do not extend subscription validity, and they are available only when a paid subscription is active.
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {topUps.map((item) => (
                <div key={item} style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", padding: 12, color: "var(--text)", fontWeight: 800 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={card()}>
            <div style={pill("warn")}>Important tax guidance boundary</div>
            <h2 style={{ margin: 0, color: "var(--text)", fontSize: 26 }}>Guidance, not official tax representation</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.8 }}>
              {SITE.name} provides general Nigerian tax information and guided support. It is not a government portal, law firm, accounting firm, or substitute for a qualified tax professional in sensitive matters, audits, disputes, penalties, or formal filing decisions.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              <button onClick={() => router.push("/terms")} style={button(false)}>Terms</button>
              <button onClick={() => router.push("/privacy")} style={button(false)}>Privacy</button>
              <button onClick={() => router.push("/support")} style={button(false)}>Support</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
