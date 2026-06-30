"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { SITE } from "@/lib/site";

const reviewLinks = [
  { href: "/pricing", title: "Pricing", text: "Plan limits, public prices, and credit top-ups." },
  { href: "/about", title: "About", text: "Ownership, product purpose, user audience, and channels." },
  { href: "/safety", title: "AI Safety", text: "Guidance boundaries, escalation cases, refusal cases, and source discipline." },
  { href: "/faq", title: "FAQ", text: "Plain-language reviewer questions and answers." },
  { href: "/startup-readiness", title: "Startup Readiness", text: "Current strengths, remaining risks, and next improvement priorities." },
  { href: "/support", title: "Support", text: "How users can get help." },
  { href: "/privacy", title: "Privacy", text: "How privacy commitments are presented publicly." },
  { href: "/terms", title: "Terms", text: "Terms of use and service boundaries." },
  { href: "/refund", title: "Refund", text: "Refund policy visibility." },
  { href: "/data-deletion", title: "Data Deletion", text: "User data deletion route." },
];

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

export default function ReviewPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Reviewer Index"
      subtitle="A single starting point for external AI reviewers, startup committees, and product due-diligence checks."
      actions={
        <>
          <button onClick={() => router.push("/startup-readiness")} style={shellButtonPrimary()}>
            Readiness
          </button>
          <button onClick={() => router.push("/")} style={shellButtonSecondary()}>
            Home
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="info"
          title="Review Naija Tax Guide from this page"
          subtitle={`Last reviewed: ${SITE.trustReviewDate}. ${SITE.name} is operated by ${SITE.companyName} and provides general Nigerian tax guidance, not formal professional representation.`}
        />

        <WorkspaceSectionCard title="Public review links" subtitle="Use these pages to inspect product clarity, trust, safety, pricing, and user support.">
          <CardsGrid min={240}>
            {reviewLinks.map((item) => (
              <Link key={item.href} href={item.href} style={{ ...card(), color: "inherit", textDecoration: "none" }}>
                <h2 style={{ margin: 0, color: "var(--text)", fontSize: "clamp(18px, 3.4vw, 21px)", lineHeight: 1.25, fontWeight: 950 }}>
                  {item.title}
                </h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "clamp(14px, 2.4vw, 15px)", lineHeight: 1.65 }}>
                  {item.text}
                </p>
              </Link>
            ))}
          </CardsGrid>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
