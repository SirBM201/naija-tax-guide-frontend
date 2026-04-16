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
    padding: 18,
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
  };
}

function contactGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    alignItems: "stretch",
  };
}

function contactHighlightStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 10,
    borderRadius: 16,
    border: "1px solid var(--accent-border)",
    background: "var(--accent-soft)",
    padding: 16,
    minWidth: 0,
  };
}

export default function ContactPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Contact"
      subtitle="Use this page for general enquiries, partnerships, privacy-related communication, and non-ticket company contact."
      actions={
        <>
          <button onClick={() => router.push("/support")} style={shellButtonPrimary()}>
            Open Support
          </button>
          <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
            Back to Dashboard
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="default"
          title="Use the right contact route"
          subtitle="If you already have an account and need help with billing, login, credits, linked channels, or technical issues, please use the Support page so your request can be tracked properly."
        />

        <WorkspaceSectionCard
          title="Contact channels"
          subtitle="Use the most appropriate route depending on the kind of enquiry you want to send."
        >
          <div style={contactGridStyle()}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Support email</p>
              <p style={valueStyle()}>support@naijataxguides.com</p>
              <p style={helperStyle()}>
                Best for direct business contact, follow-up communication, and general enquiries where email communication is appropriate.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Support route</p>
              <p style={valueStyle()}>In-app Support Page</p>
              <p style={helperStyle()}>
                Best for logged-in users who need ticket tracking, support replies, billing issue follow-up, or technical help.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Privacy / deletion route</p>
              <p style={valueStyle()}>Use Privacy or Data Deletion page</p>
              <p style={helperStyle()}>
                Best for compliance, privacy, and deletion-related requests where a formal route is preferred.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="1. General enquiries"
          subtitle="Use this route for normal business communication that is not a support ticket."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              The Contact page is intended for general company communication such
              as public enquiries, operational questions, business follow-up,
              product interest, partnership discussion, or other non-ticket
              communication.
            </p>

            <p style={paragraphStyle()}>
              If the matter is actually a user issue that needs tracking, status
              updates, or in-app reply handling, the Support page should be used
              instead of this Contact page.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="2. When to use Support instead"
          subtitle="Support remains the official help center for operational user issues."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>Login or account access problems.</li>
              <li>Billing, subscription, or renewal issues.</li>
              <li>Credit balance or access limitation complaints.</li>
              <li>Technical failures or channel-linking issues.</li>
              <li>Any issue that should be tracked with a ticket ID and support thread.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="3. Suitable use cases for this Contact page"
          subtitle="This page is better for broader communication that does not need the support ticket workflow."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>Business or partnership enquiries.</li>
              <li>Media, presentation, or public communication requests.</li>
              <li>General product enquiries before deeper onboarding.</li>
              <li>Compliance, legal, or company-level communication that is not a normal support ticket.</li>
              <li>Escalation guidance where the issue does not belong inside a standard support inbox.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="4. Response expectations"
          subtitle="Different contact routes may be handled differently depending on the nature of the request."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              General enquiries sent through the Contact route may be reviewed
              manually and may not receive the same ticket-based workflow that
              exists inside the Support page.
            </p>

            <p style={paragraphStyle()}>
              For urgent user issues, billing complaints, technical problems, or
              requests that need traceable follow-up, users should go directly
              to the Support page so the request can be recorded properly.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="5. Official contact note"
          subtitle="Use direct company contact responsibly and keep messages relevant to the communication route."
        >
          <div style={sectionBodyStyle()}>
            <div style={contactHighlightStyle()}>
              <p style={labelStyle()}>Official contact email</p>
              <p style={valueStyle()}>support@naijataxguides.com</p>
              <p style={helperStyle()}>
                Use this email for general business communication where a support ticket is not the appropriate workflow.
              </p>
            </div>

            <p style={paragraphStyle()}>
              Where a request is more suitable for a privacy, deletion, billing,
              or support workflow, the platform may redirect the user to the
              appropriate page so the matter can be handled correctly.
            </p>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
