"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { SITE } from "@/lib/site";

const strengths = [
  "Clear Nigerian tax guidance problem with real demand from individuals, freelancers, SMEs, and founders.",
  "Multi-channel access through web, WhatsApp, and Telegram, matching how many Nigerian users already ask for help.",
  "Public pricing, legal links, support contact, and product ownership are now visible for reviewer trust.",
  "AI prompt policy now separates general guidance from high-risk advice and instructs escalation for sensitive matters.",
];

const remainingRisks = [
  "Formal citation coverage needs to keep improving for rates, thresholds, deadlines, and effective dates.",
  "High-risk tax cases need a clearer human professional escalation workflow before heavy enterprise use.",
  "The team should maintain a reviewed benchmark set of Nigerian tax questions for regression testing.",
  "Public proof points such as customer examples, expert reviewer names, or update logs should be added over time.",
];

const evidence = [
  {
    label: "Trust pages",
    text: "Privacy, terms, refund, support, contact, about, safety, FAQ, and pricing pages give reviewers the basic public product evidence they expect.",
  },
  {
    label: "Guidance boundary",
    text: "The product now states that it provides general Nigerian tax information and should not replace a qualified professional in sensitive cases.",
  },
  {
    label: "Channel visibility",
    text: `The public pages now expose WhatsApp ${SITE.whatsappDisplay} and Telegram @${SITE.telegramBot} so reviewers can understand how users access the service.`,
  },
];

function body(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text-muted)",
    fontSize: "clamp(15px, 2.6vw, 16px)",
    lineHeight: 1.75,
    overflowWrap: "anywhere",
  };
}

function card(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 18,
    display: "grid",
    gap: 10,
    height: "100%",
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

export default function StartupReadinessPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Startup Readiness"
      subtitle="A practical reviewer-facing summary of strengths, controls, and remaining improvement work."
      actions={
        <>
          <button onClick={() => router.push("/safety")} style={shellButtonPrimary()}>
            AI Safety
          </button>
          <button onClick={() => router.push("/faq")} style={shellButtonSecondary()}>
            FAQ
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="good"
          title="Committee-readiness focus"
          subtitle={`Last reviewed: ${SITE.trustReviewDate}. This page records what Naija Tax Guide currently does well and what should still be strengthened before deeper external review.`}
        />

        <WorkspaceSectionCard title="Readiness position" subtitle="The product is commercially plausible, but trust controls must remain visible and continuously improved.">
          <CardsGrid min={260}>
            <div style={card()}>
              <h2 style={{ margin: 0, color: "var(--text)", fontSize: 20, fontWeight: 950 }}>Current strengths</h2>
              {list(strengths)}
            </div>
            <div style={card()}>
              <h2 style={{ margin: 0, color: "var(--text)", fontSize: 20, fontWeight: 950 }}>Remaining risks</h2>
              {list(remainingRisks)}
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Evidence added" subtitle="These are the practical improvements reviewers can inspect in the public product.">
          <CardsGrid min={240}>
            {evidence.map((item) => (
              <article key={item.label} style={card()}>
                <span style={{ width: "fit-content", border: "1px solid var(--success-border)", background: "var(--success-bg)", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 850, color: "var(--text-soft)" }}>
                  {item.label}
                </span>
                <p style={body()}>{item.text}</p>
              </article>
            ))}
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Next improvement priority" subtitle="Recommended Batch 2 and Batch 3 engineering focus.">
          <div style={{ display: "grid", gap: 12 }}>
            {list([
              "Add source/date metadata to curated tax answers and expose it in web, WhatsApp, and Telegram responses.",
              "Add human escalation routing for audit, dispute, penalty, filing, and high-value business cases.",
              "Create automated regression tests for common Nigerian tax Q&A and unsafe request refusal behavior.",
              "Publish a lightweight update log for tax content reviews and policy changes.",
            ])}
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
