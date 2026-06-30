"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { SITE } from "@/lib/site";

function bodyText(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text)",
    fontSize: "clamp(15px, 2.6vw, 16px)",
    lineHeight: 1.85,
    overflowWrap: "anywhere",
  };
}

function infoCard(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 18,
    display: "grid",
    gap: 8,
    minWidth: 0,
    height: "100%",
  };
}

function labelText(): React.CSSProperties {
  return {
    color: "var(--text-muted)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: 850,
  };
}

function valueText(): React.CSSProperties {
  return {
    color: "var(--text)",
    fontSize: "clamp(19px, 4vw, 22px)",
    lineHeight: 1.25,
    fontWeight: 950,
    overflowWrap: "anywhere",
  };
}

export default function AboutPage() {
  const router = useRouter();

  return (
    <AppShell
      title="About Naija Tax Guide"
      subtitle="A public trust page explaining what the product is, who it serves, and where its responsibility boundaries are."
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
          tone="default"
          title={SITE.productOwnerLine}
          subtitle={`${SITE.name} is built for Nigerian individuals, freelancers, creators, SMEs, and digital professionals who need clearer tax guidance before they make decisions.`}
        />

        <WorkspaceSectionCard
          title="Why this product exists"
          subtitle="Tax confusion is a real barrier for many Nigerians and small businesses."
        >
          <div style={{ display: "grid", gap: 14 }}>
            <p style={bodyText()}>
              {SITE.name} was created to make Nigerian tax guidance easier to access, easier to understand, and easier to manage across the channels people already use. The product focuses on practical explanations, basic calculators, usage tracking, saved history, and structured support rather than leaving users to search scattered information alone.
            </p>
            <p style={bodyText()}>
              The long-term goal is to become a trusted Nigerian tax guidance workspace that combines AI assistance, reviewed knowledge, calculators, reminders, documents, and human escalation where a matter is too sensitive for AI alone.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Registered business information"
          subtitle="Public company details included for reviewer and user trust."
        >
          <CardsGrid min={220}>
            <div style={infoCard()}>
              <div style={labelText()}>Registered business name</div>
              <div style={valueText()}>{SITE.companyName}</div>
              <p style={bodyText()}>Naija Tax Guide is presented as a product operated under this business name.</p>
            </div>
            <div style={infoCard()}>
              <div style={labelText()}>CAC registration no.</div>
              <div style={valueText()}>{SITE.businessRegistrationNo}</div>
              <p style={bodyText()}>Registered as a business name in Nigeria on {SITE.registrationDate}.</p>
            </div>
            <div style={infoCard()}>
              <div style={labelText()}>Business nature</div>
              <div style={valueText()}>{SITE.registeredNature}</div>
              <p style={bodyText()}>Principal place of business: {SITE.registeredAddress}.</p>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Who it is for"
          subtitle="The first target users are people who need direction before hiring or escalating."
        >
          <CardsGrid min={220}>
            <div style={infoCard()}>
              <div style={labelText()}>Individuals</div>
              <div style={valueText()}>Salary earners and first-time taxpayers</div>
              <p style={bodyText()}>Plain explanations for PAYE, personal income tax, records, and common obligations.</p>
            </div>
            <div style={infoCard()}>
              <div style={labelText()}>Freelancers</div>
              <div style={valueText()}>Creators, consultants, and digital workers</div>
              <p style={bodyText()}>Guidance around income, business records, invoices, and compliance questions.</p>
            </div>
            <div style={infoCard()}>
              <div style={labelText()}>SMEs</div>
              <div style={valueText()}>Small businesses and growing operators</div>
              <p style={bodyText()}>Support for VAT, WHT, CIT, filing checklists, reminders, and document workflows.</p>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Responsible use boundary"
          subtitle="The product is useful because it is clear about what it is not."
        >
          <CardsGrid min={240}>
            <div style={infoCard()}>
              <div style={labelText()}>What it can do</div>
              <div style={valueText()}>Explain, organize, calculate basics, and guide next steps</div>
              <p style={bodyText()}>It can help users understand common Nigerian tax concepts, use basic calculators, ask clearer questions, and know when to seek professional help.</p>
            </div>
            <div style={infoCard()}>
              <div style={labelText()}>What it cannot replace</div>
              <div style={valueText()}>Government rulings or regulated professional judgment</div>
              <p style={bodyText()}>It is not a government portal, tax authority, law firm, accounting firm, or substitute for a qualified tax professional in audits, disputes, penalties, or formal filing decisions.</p>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Public product channels"
          subtitle="Users can start from web, WhatsApp, or Telegram."
        >
          <CardsGrid min={220}>
            <div style={infoCard()}>
              <div style={labelText()}>Website</div>
              <div style={valueText()}>{SITE.domain}</div>
              <p style={bodyText()}>Main workspace for account access, pricing, plans, credits, support, and history.</p>
            </div>
            <div style={infoCard()}>
              <div style={labelText()}>WhatsApp</div>
              <div style={valueText()}>{SITE.whatsappDisplay}</div>
              <p style={bodyText()}>Mobile-first bot access for users who prefer chat-based interaction.</p>
            </div>
            <div style={infoCard()}>
              <div style={labelText()}>Telegram</div>
              <div style={valueText()}>@{SITE.telegramBot}</div>
              <p style={bodyText()}>Bot-based access for users who prefer Telegram workflows.</p>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
