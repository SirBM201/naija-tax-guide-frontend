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
    gap: 18,
    color: "var(--text)",
    fontSize: 16,
    lineHeight: 1.9,
  };
}

function paragraphStyle(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text)",
    lineHeight: 1.9,
    fontSize: 16,
  };
}

function bulletListStyle(): React.CSSProperties {
  return {
    margin: 0,
    paddingLeft: 22,
    display: "grid",
    gap: 12,
    color: "var(--text)",
    lineHeight: 1.8,
    fontSize: 16,
  };
}

function faqGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  };
}

function faqItemStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 18,
    display: "grid",
    gap: 10,
    alignContent: "start",
  };
}

function faqQuestionStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
    color: "var(--text)",
  };
}

function faqAnswerStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: 15,
    color: "var(--text-muted)",
    lineHeight: 1.8,
  };
}

function infoGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
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
    alignContent: "start",
  };
}

function miniActionRowStyle(): React.CSSProperties {
  return {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    margin: 0,
  };
}

function valueStyle(): React.CSSProperties {
  return {
    fontSize: 20,
    fontWeight: 900,
    color: "var(--text)",
    margin: 0,
  };
}

function helperStyle(): React.CSSProperties {
  return {
    fontSize: 15,
    color: "var(--text-muted)",
    lineHeight: 1.7,
    margin: 0,
  };
}

export default function HelpPage() {
  const router = useRouter();

  const faqItems = [
    {
      question: "How do I know if my payment worked?",
      answer:
        "Open the Billing page and review your current plan, billing state, or subscription status. A successful payment may still need a short sync window before every visible field updates.",
    },
    {
      question: "Why am I seeing access denied or unauthorized?",
      answer:
        "This usually means your session has expired, your login state is missing, or the page requires access that is not currently available under your account or plan.",
    },
    {
      question: "What should I do if my credits seem wrong?",
      answer:
        "First check your Credits or Billing area. If the visible balance still does not match what you expect after a reasonable refresh or payment sync window, open Support so the issue can be tracked.",
    },
    {
      question: "Where do support replies appear?",
      answer:
        "Support replies should appear inside the in-app support inbox on the Support page. Important updates may also be sent through the linked account email when available.",
    },
    {
      question: "Can I request a refund?",
      answer:
        "Refunds are not automatic for digital services. Valid cases may still be reviewed under the Refund Policy. Eligible refund requests must be submitted within 3 days of payment.",
    },
    {
      question: "How do I request deletion of my data?",
      answer:
        "Use the Data Deletion page for the official route. Some information may still need to be retained for lawful, billing, security, or audit-related reasons where applicable.",
    },
  ];

  return (
    <AppShell
      title="Help Center"
      subtitle="Find quick guidance for billing, credits, support, login, legal pages, and general use of the Naija Tax Guide portal."
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
          title="Help first, support when needed"
          subtitle="Use this page for quick answers and route guidance. If your issue needs tracking, billing review, or a support reply, use the Support page."
        />

        <WorkspaceSectionCard
          title="Quick route guide"
          subtitle="Use the right page for the right type of issue."
        >
          <div style={infoGridStyle()}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Best for account issues</p>
              <p style={valueStyle()}>Support</p>
              <p style={helperStyle()}>
                Use for billing problems, login trouble, credits, technical faults, and ticket-based follow-up.
              </p>
              <div style={miniActionRowStyle()}>
                <button onClick={() => router.push("/support")} style={shellButtonPrimary()}>
                  Open Support
                </button>
              </div>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Best for company enquiries</p>
              <p style={valueStyle()}>Contact</p>
              <p style={helperStyle()}>
                Use for partnerships, public enquiries, compliance communication, and general business contact.
              </p>
              <div style={miniActionRowStyle()}>
                <button onClick={() => router.push("/contact")} style={shellButtonSecondary()}>
                  Open Contact
                </button>
              </div>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Best for billing checks</p>
              <p style={valueStyle()}>Billing</p>
              <p style={helperStyle()}>
                Use for plan visibility, subscription checks, payment review, and payment-result confirmation.
              </p>
              <div style={miniActionRowStyle()}>
                <button onClick={() => router.push("/billing")} style={shellButtonSecondary()}>
                  Open Billing
                </button>
              </div>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Best for legal information</p>
              <p style={valueStyle()}>Privacy / Terms / Refund</p>
              <p style={helperStyle()}>
                Use these pages to understand how the platform handles privacy, billing rules, refunds, and data deletion.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Common questions"
          subtitle="The most likely issues users may want to understand quickly."
        >
          <div style={faqGridStyle()}>
            {faqItems.map((item) => (
              <div key={item.question} style={faqItemStyle()}>
                <h3 style={faqQuestionStyle()}>{item.question}</h3>
                <p style={faqAnswerStyle()}>{item.answer}</p>
              </div>
            ))}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Billing and subscription help"
          subtitle="Use these checks before raising a billing complaint."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>Confirm the selected plan is the one you intended to activate.</li>
              <li>Check whether payment is successful, failed, or still pending before retrying.</li>
              <li>Allow a short sync window for plan or credit updates after payment.</li>
              <li>Use Support if the visible billing result remains inconsistent after a reasonable wait.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Login and session help"
          subtitle="Authentication issues often look like page or billing problems at first."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>If you are redirected unexpectedly, your session may have expired.</li>
              <li>Protected pages may stop working when the browser loses the active login state.</li>
              <li>Try signing in again before assuming a billing or workspace problem.</li>
              <li>If re-login does not restore access, use Support for account review.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="When to use Contact instead of Support"
          subtitle="Not every message should become a support ticket."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Use Contact for general enquiries, business communication, partnership interest,
              public or compliance questions, and non-ticket company communication.
            </p>

            <p style={paragraphStyle()}>
              Use Support instead when the issue is tied to your account, payment, credits,
              login, linked channels, or any other matter that should be tracked with a ticket and in-app
              reply thread.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Still need help?"
          subtitle="When quick guidance is not enough, move to the proper assisted route."
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button onClick={() => router.push("/support")} style={shellButtonPrimary()}>
              Open Support
            </button>
            <button onClick={() => router.push("/contact")} style={shellButtonSecondary()}>
              Open Contact
            </button>
            <button onClick={() => router.push("/billing")} style={shellButtonSecondary()}>
              Open Billing
            </button>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
