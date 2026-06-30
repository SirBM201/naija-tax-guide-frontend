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
    title: "Reviewed internal knowledge",
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
      subtitle="How Naija Tax Guide should handle tax sources, freshness, uncertainty, and reviewed knowledge."
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

        <WorkspaceSectionCard title="Product direction" subtitle="What the product should continue moving toward.">
          {list([
            "Add source category, jurisdiction, risk level, and last-reviewed date to curated answers.",
            "Show source metadata when an answer comes from reviewed internal knowledge.",
            "Ask users to verify current official guidance when a claim is time-sensitive or state-specific.",
            "Escalate sensitive audit, penalty, dispute, and formal filing matters to qualified professionals.",
          ])}
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
