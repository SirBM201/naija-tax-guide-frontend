"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { SectionStack } from "@/components/page-layout";
import { SITE } from "@/lib/site";

const faqs = [
  {
    question: "What is Naija Tax Guide?",
    answer:
      "Naija Tax Guide is a Nigerian tax guidance product for individuals, freelancers, SMEs, and founders who need clearer explanations of common tax obligations, deadlines, calculations, and filing concepts.",
  },
  {
    question: "Is Naija Tax Guide a government tax authority?",
    answer:
      `No. Naija Tax Guide is operated by ${SITE.companyName}. It is not FIRS, NRS, a State Internal Revenue Service, a law firm, an accounting firm, or an official tax representative.`,
  },
  {
    question: "Can I rely on it as formal legal or accounting advice?",
    answer:
      "No. The product gives general Nigerian tax information and guided support. For audits, disputes, penalties, official notices, high-value filings, or business restructuring decisions, users should speak with a qualified tax professional.",
  },
  {
    question: "Where can I use the product?",
    answer:
      `Users can access the web app, WhatsApp support on ${SITE.whatsappDisplay}, and the Telegram bot @${SITE.telegramBot}. Availability may depend on the user's plan and linked channels.`,
  },
  {
    question: "How does pricing work?",
    answer:
      "The public pricing page shows Starter, Professional, and Business subscription plans first, with a billing switcher for monthly, quarterly, and yearly pricing. Credit top-ups are also shown for active paid users.",
  },
  {
    question: "Does the assistant always know current tax rules?",
    answer:
      "Tax rules can change. The product should treat rates, thresholds, deadlines, penalties, and effective dates as high-risk claims. Users should verify sensitive matters and escalate professional cases.",
  },
  {
    question: "What happens if the AI is uncertain?",
    answer:
      "The assistant should ask for missing facts, state assumptions, avoid inventing legal references, and recommend escalation when the question depends on formal filings, audits, disputes, or material business consequences.",
  },
  {
    question: "How do I get support?",
    answer: `Users can contact support at ${SITE.supportEmail}, use the support page, or contact the company through the public contact page.`,
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

function itemStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 18,
    display: "grid",
    gap: 8,
  };
}

export default function FaqPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Frequently Asked Questions"
      subtitle="Clear answers for users, partners, and professionals evaluating Naija Tax Guide."
      actions={
        <>
          <button onClick={() => router.push("/pricing")} style={shellButtonPrimary()}>
            View Pricing
          </button>
          <button onClick={() => router.push("/safety")} style={shellButtonSecondary()}>
            AI Safety
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          title="Plain-language product facts"
          subtitle={`${SITE.name} is a guidance product, not a tax authority or substitute for professional representation in sensitive tax matters.`}
        />

        <WorkspaceSectionCard title="Product FAQ" subtitle="Answers users should be able to verify quickly.">
          <div style={{ display: "grid", gap: 14 }}>
            {faqs.map((faq) => (
              <article key={faq.question} style={itemStyle()}>
                <h2 style={{ margin: 0, color: "var(--text)", fontSize: "clamp(17px, 3.2vw, 20px)", lineHeight: 1.3, fontWeight: 950 }}>
                  {faq.question}
                </h2>
                <p style={body()}>{faq.answer}</p>
              </article>
            ))}
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
