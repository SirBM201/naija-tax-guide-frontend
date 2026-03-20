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

function mutedNoteStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 18,
    color: "var(--text-muted)",
    lineHeight: 1.8,
    fontSize: 15,
  };
}

function miniHeadingStyle(): React.CSSProperties {
  return {
    fontSize: 18,
    fontWeight: 900,
    color: "var(--text)",
    margin: 0,
  };
}

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Privacy Policy"
      subtitle="Review how Naija Tax Guide may collect, use, store, and protect account information, billing details, workspace activity, and support-related data."
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
          title="Important positioning"
          subtitle="Naija Tax Guide is a digital tax information and guided support platform. It is not a government portal, tax authority website, law firm, or substitute for regulated professional advice in highly sensitive matters."
        />

        <WorkspaceSectionCard
          title="1. Scope of this policy"
          subtitle="This page explains the main categories of information the platform may handle and the operational reasons that information may be used."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              This Privacy Policy is intended to describe how Naija Tax Guide may
              collect, use, store, protect, and operationally process user and
              workspace information when people access the web portal, billing
              tools, AI guidance features, linked communication channels, and
              support functions.
            </p>

            <p style={paragraphStyle()}>
              The policy is written to help users understand the practical
              privacy position of the platform in a clear way. It should be read
              together with other visible platform pages such as billing,
              refund, support, and data deletion where relevant.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="2. Information we may collect"
          subtitle="The platform may collect different categories of data depending on the feature being used."
        >
          <div style={sectionBodyStyle()}>
            <div>
              <h3 style={miniHeadingStyle()}>Account and registration data</h3>
              <p style={paragraphStyle()}>
                We may collect account registration information such as name,
                email address, phone number, linked messaging identities, and
                authentication-related data needed for secure login and
                workspace access.
              </p>
            </div>

            <div>
              <h3 style={miniHeadingStyle()}>Usage and workspace activity</h3>
              <p style={paragraphStyle()}>
                We may collect questions submitted by users, AI-generated
                responses, usage activity, support messages, linked channel
                events, and service-level diagnostic information needed to keep
                the platform working properly.
              </p>
            </div>

            <div>
              <h3 style={miniHeadingStyle()}>Billing and subscription data</h3>
              <p style={paragraphStyle()}>
                We may collect billing-related identifiers such as subscription
                plan, payment reference, transaction status, renewal status, and
                credit activity. Sensitive payment card details are generally
                handled by approved payment processors rather than stored
                directly by the platform.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="3. How information may be used"
          subtitle="The platform may use collected information for operational, support, and security purposes."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>To create and manage user accounts and secure the login process.</li>
              <li>To deliver AI-guided responses and maintain question history where enabled.</li>
              <li>To manage subscriptions, credits, renewals, and payment verification.</li>
              <li>To link supported channels such as WhatsApp and Telegram to the same user workspace.</li>
              <li>To detect abuse, fraud, policy violations, technical failure, or billing anomalies.</li>
              <li>To respond to support requests, account issues, and lawful compliance obligations.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="4. Third-party service providers"
          subtitle="Some platform functions may rely on carefully selected third-party infrastructure."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              These providers may include payment processors, hosting providers,
              communication APIs, email delivery tools, analytics or monitoring
              tools, and channel integrations such as WhatsApp or Telegram
              infrastructure where applicable.
            </p>

            <p style={paragraphStyle()}>
              Where third-party providers are involved, data sharing should
              remain limited to what is reasonably necessary for the relevant
              function, such as payment confirmation, support delivery, secure
              communication, fraud prevention, or system reliability.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="5. Channel linking and workspace continuity"
          subtitle="Linked channels may be associated with the same workspace for continuity and account protection."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              If a user links WhatsApp, Telegram, or future supported channels,
              question content, identity references, usage state, and
              support-related context may be associated with the same account so
              that service continuity and account protection can be maintained
              across touchpoints.
            </p>

            <p style={paragraphStyle()}>
              Users should avoid submitting highly sensitive information beyond
              what is necessary for practical tax support, especially where a
              matter may require licensed professional escalation.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="6. Support and in-app communication"
          subtitle="Support requests may be stored and managed through the platform’s support system."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              When a user submits a support request, the platform may store the
              ticket subject, message content, account reference, visible plan
              context, visible credits, linked channel state, ticket status, and
              support thread messages needed to manage the request.
            </p>

            <p style={paragraphStyle()}>
              Support feedback may appear inside the in-app support inbox and,
              where appropriate, may also be sent to the email address
              associated with the relevant workspace or support submission.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="7. Data retention and protection"
          subtitle="The platform should keep operational data only as long as reasonably necessary for service delivery, support continuity, compliance, and dispute handling."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Reasonable technical and organizational safeguards should be used
              to reduce unauthorized access, misuse, or accidental exposure of
              user information. No internet-based service can promise absolute
              security, but the platform should still apply practical safeguards
              appropriate to its stage and operational model.
            </p>

            <div style={mutedNoteStyle()}>
              Users should also play their own part by protecting login
              credentials, avoiding unnecessary sharing of highly sensitive
              information, and contacting support quickly if suspicious account
              activity is noticed.
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="8. User choices and requests"
          subtitle="Users may request assistance regarding support, account corrections, or deletion-related needs through the platform’s published routes."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Depending on the feature and legal context, users may contact the
              platform regarding account issues, privacy questions, correction
              requests, support follow-up, or data deletion requests through the
              visible support and data deletion routes provided within the app.
            </p>

            <p style={paragraphStyle()}>
              Some operational or legally necessary records may still need to be
              retained for billing reconciliation, fraud prevention, audit trail,
              or lawful compliance reasons where applicable.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="9. Policy updates"
          subtitle="The platform may refine or update this policy as the product grows, integrations expand, or compliance needs change."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Continued use of the platform after material updates may indicate
              acceptance of the revised privacy framework to the extent
              permitted by law and platform policy.
            </p>

            <p style={paragraphStyle()}>
              For privacy or compliance-related questions, users should contact
              the support route provided within the product or the official
              support contact published by Naija Tax Guide.
            </p>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}