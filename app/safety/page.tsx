"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { SITE } from "@/lib/site";

function body(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text)",
    fontSize: "clamp(15px, 2.6vw, 16px)",
    lineHeight: 1.85,
    overflowWrap: "anywhere",
  };
}

function box(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 18,
    minWidth: 0,
    display: "grid",
    gap: 10,
    height: "100%",
  };
}

function badge(tone: "default" | "warn" | "good" = "default"): React.CSSProperties {
  const border = tone === "warn" ? "var(--warn-border)" : tone === "good" ? "var(--success-border)" : "var(--border)";
  const background = tone === "warn" ? "var(--warn-bg)" : tone === "good" ? "var(--success-bg)" : "var(--surface-soft)";
  return {
    width: "fit-content",
    border: `1px solid ${border}`,
    background,
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 850,
    color: "var(--text-soft)",
  };
}

function title(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text)",
    fontSize: "clamp(18px, 4vw, 22px)",
    lineHeight: 1.25,
    fontWeight: 950,
  };
}

function list(items: string[]): React.ReactNode {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item) => (
        <div key={item} style={{ display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)", gap: 8, color: "var(--text-muted)", lineHeight: 1.65 }}>
          <strong style={{ color: "var(--accent)" }}>-</strong>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function SafetyPage() {
  const router = useRouter();

  return (
    <AppShell
      title="AI Safety & Tax Accuracy"
      subtitle="How Naija Tax Guide is positioned to reduce AI tax-risk while still giving users practical help."
      actions={
        <>
          <button onClick={() => router.push("/pricing")} style={shellButtonPrimary()}>
            View Pricing
          </button>
          <button onClick={() => router.push("/")} style={shellButtonSecondary()}>
            Back Home
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="warn"
          title="Guidance, not formal tax representation"
          subtitle={`${SITE.name} gives general Nigerian tax information and guided support. It should not be treated as a government ruling, legal opinion, accounting sign-off, or substitute for a qualified professional in sensitive cases.`}
        />

        <WorkspaceSectionCard title="Safety principles" subtitle="The product should be useful while staying honest about uncertainty.">
          <CardsGrid min={240}>
            <div style={box()}>
              <span style={badge("good")}>Principle 1</span>
              <h2 style={title()}>Answer the exact question</h2>
              <p style={body()}>The assistant should answer directly, avoid generic filler, and state assumptions when the user has not provided enough facts.</p>
            </div>
            <div style={box()}>
              <span style={badge("good")}>Principle 2</span>
              <h2 style={title()}>Separate simple guidance from high-risk advice</h2>
              <p style={body()}>Simple explanations can be handled inside the product. Audits, disputes, penalties, formal filings, or large-value decisions should be escalated.</p>
            </div>
            <div style={box()}>
              <span style={badge("good")}>Principle 3</span>
              <h2 style={title()}>Do not pretend to be an authority</h2>
              <p style={body()}>The product should not claim to be FIRS, NRS, a State Internal Revenue Service, a law firm, an accounting firm, or a licensed tax representative.</p>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="When the assistant should warn or escalate" subtitle="These cases need extra care because wrong guidance can cause user harm.">
          <CardsGrid min={260}>
            <div style={box()}>
              <span style={badge("warn")}>Warn</span>
              {list([
                "The question depends on tax year, state of residence, business structure, or turnover.",
                "The user asks for a tax calculation with real financial consequence.",
                "The issue involves current reform, changing rules, or uncertain implementation.",
              ])}
            </div>
            <div style={box()}>
              <span style={badge("warn")}>Escalate</span>
              {list([
                "The user received an official tax notice, audit letter, penalty, or assessment.",
                "The matter involves formal filing, representation, dispute, litigation, or back-duty exposure.",
                "The user asks for business restructuring or cross-border tax advice.",
              ])}
            </div>
            <div style={box()}>
              <span style={badge("warn")}>Refuse</span>
              {list([
                "Requests to hide income, falsify invoices, evade tax, or misrepresent facts.",
                "Requests to impersonate a professional, government officer, or official tax authority.",
                "Requests that require illegal deception or document manipulation.",
              ])}
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Source and freshness direction" subtitle="The product should grow toward stronger citation and update discipline.">
          <div style={{ display: "grid", gap: 14 }}>
            <p style={body()}>
              Naija Tax Guide should keep strengthening its reviewed Nigerian tax knowledge base and should show users when content was last reviewed. Numeric claims such as rates, deadlines, penalties, thresholds, and effective dates should be treated as high-risk and should carry source/date awareness wherever possible.
            </p>
            {list([
              "Use curated database/library answers for common questions before AI fallback.",
              "Treat AI-generated answers as guidance that needs review and improvement over time.",
              "Maintain an internal expert-reviewed benchmark of common Nigerian tax questions.",
              "Add source references for PITA, CITA, VAT, WHT, Finance Act updates, FIRS/NRS guidance, and state tax authority practice where applicable.",
            ])}
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
