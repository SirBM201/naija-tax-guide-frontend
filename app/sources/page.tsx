"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { SITE } from "@/lib/site";

const sourceCategories = [
  {
    title: "Primary law and regulations",
    text: "Acts, regulations, and official tax instruments should be the strongest basis for rates, thresholds, deadlines, penalties, and filing obligations.",
  },
  {
    title: "Federal tax authority guidance",
    text: "Federal circulars, public notices, filing guidance, and official portal instructions should be used carefully and reviewed for current applicability.",
  },
  {
    title: "State tax authority practice",
    text: "Personal income tax, PAYE, and state-level administration can depend on residence and state practice, so answers should avoid treating one state process as universal.",
  },
  {
    title: "Reviewed platform knowledge",
    text: "Curated answers should carry review status, risk level, source category, and last-reviewed date before being treated as reliable user guidance.",
  },
];

const highRiskClaims = [
  "tax rates and thresholds",
  "filing or payment deadlines",
  "penalties and interest",
  "effective dates for new laws or reforms",
  "official portals and payment routes",
  "state-specific processes",
];

const updateLogItems = [
  "Record when answer policy, reviewed content, source discipline, or safety wording changes.",
  "Record reviewer feedback before marking an answer as professionally reviewed.",
  "Record corrections after user complaints, expert feedback, or changes in official guidance.",
  "Track source-sensitive answers that still need structured citation metadata.",
];

const metadataExamples = [
  "Source category: law/regulation, FIRS/NRS guidance, state tax authority practice, or reviewed platform knowledge.",
  "Jurisdiction and tax head: for example federal VAT, Lagos PAYE, WHT, company income tax, or personal income tax.",
  "Review state: drafted, reviewed, needs update, or requires professional escalation.",
  "Freshness details: last reviewed date, effective date where known, and next review trigger for reform-sensitive topics.",
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
    minWidth: 0,
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

export default function SourcesPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Source Transparency"
      subtitle="How Naija Tax Guide should handle tax sources, freshness, uncertainty, reviewed knowledge, and content updates."
      actions={
        <>
          <button onClick={() => router.push("/safety")} style={shellButtonPrimary()}>
            AI Safety
          </button>
          <button onClick={() => router.push("/review")} style={shellButtonSecondary()}>
            Reviewer Index
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="warn"
          title="Tax content must be treated as time-sensitive"
          subtitle={`${SITE.name} should not present rates, deadlines, penalties, or filing instructions as permanent truth. Sensitive claims should carry source awareness and review discipline.`}
        />

        <WorkspaceSectionCard title="Preferred source categories" subtitle="A practical hierarchy for Nigerian tax guidance quality.">
          <CardsGrid min={240}>
            {sourceCategories.map((item) => (
              <article key={item.title} style={card()}>
                <h2 style={{ margin: 0, color: "var(--text)", fontSize: "clamp(18px, 3.4vw, 21px)", lineHeight: 1.25, fontWeight: 950 }}>
                  {item.title}
                </h2>
                <p style={body()}>{item.text}</p>
              </article>
            ))}
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Claims that need extra caution" subtitle="These are the claims most likely to harm users if stale or wrong.">
          {list(highRiskClaims)}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Update-log discipline" subtitle="A product that gives tax guidance needs a controlled record of important tax-content and safety changes.">
          <div style={{ display: "grid", gap: 14 }}>
            <p style={body()}>
              Naija Tax Guide maintains a tax-content update log for important guidance and safety changes. This helps separate product-control evidence from marketing claims and gives reviewers a clearer path for checking what changed, when it changed, and what still needs expert validation.
            </p>
            {list(updateLogItems)}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Current-state metadata examples" subtitle="The product should make source-sensitive guidance easier to assess before users act on it.">
          {list(metadataExamples)}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Product direction" subtitle="What the product should continue moving toward.">
          {list([
            "Add source category, jurisdiction, risk level, and last-reviewed date to curated answers.",
            "Show source metadata when an answer comes from reviewed platform knowledge.",
            "Ask users to verify current official guidance when a claim is time-sensitive or state-specific.",
            "Escalate sensitive audit, penalty, dispute, and formal filing matters to qualified professionals.",
          ])}
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
