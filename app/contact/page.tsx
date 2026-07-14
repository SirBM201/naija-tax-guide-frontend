"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { SectionStack } from "@/components/page-layout";
import { SITE } from "@/lib/site";

function sectionBodyStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 16,
    color: "var(--text)",
    fontSize: "clamp(15px, 2.5vw, 16px)",
    lineHeight: 1.85,
    minWidth: 0,
  };
}

function paragraphStyle(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text)",
    lineHeight: 1.85,
    fontSize: "clamp(15px, 2.5vw, 16px)",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function bulletListStyle(): React.CSSProperties {
  return {
    margin: 0,
    paddingLeft: 18,
    display: "grid",
    gap: 10,
    color: "var(--text)",
    lineHeight: 1.8,
    fontSize: "clamp(15px, 2.5vw, 16px)",
    minWidth: 0,
  };
}

function infoCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: "clamp(14px, 3vw, 18px)",
    display: "grid",
    gap: 8,
    minWidth: 0,
    height: "100%",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 800,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: 0.45,
    margin: 0,
    wordBreak: "break-word",
  };
}

function valueStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(18px, 3vw, 20px)",
    fontWeight: 900,
    color: "var(--text)",
    margin: 0,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.3,
  };
}

function helperStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(14px, 2.3vw, 15px)",
    color: "var(--text-muted)",
    lineHeight: 1.7,
    margin: 0,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function contactGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: 16,
    alignItems: "stretch",
  };
}

function actionGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: 12,
  };
}

const supportCases = [
  "Login or account access problems.",
  "Billing, subscription, renewal, failed payment, receipt, or refund-review issues.",
  "Usage Credit balance, top-up, or plan-access complaints.",
  "WhatsApp or Telegram linking issues.",
  "Any issue that should be tracked with a ticket ID and support thread.",
];

const contactCases = [
  "Business or partnership enquiries.",
  "Media, presentation, or public communication requests.",
  "General product enquiries before deeper onboarding.",
  "Compliance, legal, or company-level communication that is not a normal support ticket.",
  "Professional-review enquiries before a logged-in request is opened.",
];

export default function ContactPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Contact"
      subtitle="Use this page for general enquiries, partnerships, privacy-related communication, professional-review enquiries, and non-ticket company contact."
      actions={
        <>
          <button onClick={() => router.push("/support")} style={shellButtonPrimary()}>
            Open Support
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
          title="Use the right contact route"
          subtitle="General enquiries can use this page. Logged-in users who need billing, credits, login, linked-channel, technical issue tracking, or refund review should use Support so the request can carry account context and a ticket ID."
        />

        <WorkspaceSectionCard
          title="Contact channels"
          subtitle="Use the most appropriate route depending on the kind of enquiry you want to send."
        >
          <div style={contactGridStyle()}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>General support email</p>
              <p style={valueStyle()}>{SITE.supportEmail}</p>
              <p style={helperStyle()}>
                Best for direct business contact, follow-up communication, and general enquiries where email communication is appropriate.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Privacy email</p>
              <p style={valueStyle()}>{SITE.privacyEmail}</p>
              <p style={helperStyle()}>
                Best for privacy questions, correction requests, deletion follow-up, and data-protection communication.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Support route</p>
              <p style={valueStyle()}>In-app Support Page</p>
              <p style={helperStyle()}>
                Best for logged-in users who need ticket tracking, billing issue follow-up, technical help, or payment reference review.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Professional review</p>
              <p style={valueStyle()}>Human review route</p>
              <p style={helperStyle()}>
                Best for audits, disputes, penalties, formal filings, official notices, or high-value decisions that should not rely on AI guidance alone.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="1. General enquiries"
          subtitle={`Use this route for normal business communication with ${SITE.companyName} that is not a support ticket.`}
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              The Contact page is intended for general company communication such as public enquiries, operational questions, business follow-up, product interest, partnership discussion, media requests, or other non-ticket communication.
            </p>
            <p style={paragraphStyle()}>
              If the matter is a user issue that needs tracking, status updates, account context, billing records, or in-app reply handling, the Support page should be used instead.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="2. Professional review and escalation"
          subtitle="Some tax matters should be reviewed by a qualified person before the user acts."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              {SITE.name} provides general tax information and guided support. It does not replace a licensed accountant, tax consultant, lawyer, government authority, or formal representative. Where a user needs professional review, the correct step is to request a human review route or consult an independent qualified tax professional.
            </p>
            <ul style={bulletListStyle()}>
              <li>Tax audit letters, official notices, assessments, objections, appeals, and penalties.</li>
              <li>Formal filing decisions, back-duty exposure, restructuring, or cross-border tax questions.</li>
              <li>High-value business decisions where wrong guidance could create financial or legal exposure.</li>
              <li>Cases where the user needs signed professional advice or representation before a tax authority.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="3. When to use Support instead"
          subtitle="Support remains the official help center for operational user issues."
        >
          <ul style={bulletListStyle()}>
            {supportCases.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="4. Suitable use cases for this Contact page"
          subtitle="This page is better for broader communication that does not need the support ticket workflow."
        >
          <ul style={bulletListStyle()}>
            {contactCases.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="5. Response expectations"
          subtitle="Different contact routes may be handled differently depending on the nature of the request."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              General enquiries sent through the Contact route may be reviewed manually and may not receive the same ticket-based workflow that exists inside the Support page.
            </p>
            <p style={paragraphStyle()}>
              For urgent user issues, billing complaints, technical problems, failed payment checks, or requests that need traceable follow-up, users should go directly to Support so the request can be recorded properly.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="6. Quick actions"
          subtitle="Use these routes to move to the right page quickly."
        >
          <div style={actionGridStyle()}>
            <button type="button" onClick={() => router.push("/support")} style={shellButtonPrimary()}>
              Open Support
            </button>
            <button type="button" onClick={() => router.push("/expert-review")} style={shellButtonSecondary()}>
              Professional Review
            </button>
            <button type="button" onClick={() => router.push("/privacy")} style={shellButtonSecondary()}>
              Privacy
            </button>
            <button type="button" onClick={() => router.push("/data-deletion")} style={shellButtonSecondary()}>
              Data Deletion
            </button>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
