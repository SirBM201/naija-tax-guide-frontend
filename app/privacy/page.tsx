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
    fontSize: 15,
    lineHeight: 1.85,
    minWidth: 0,
  };
}

function paragraphStyle(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text)",
    lineHeight: 1.85,
    fontSize: 15,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function bulletListStyle(): React.CSSProperties {
  return {
    margin: 0,
    paddingLeft: 20,
    display: "grid",
    gap: 10,
    color: "var(--text)",
    lineHeight: 1.8,
    fontSize: 15,
    minWidth: 0,
  };
}

function mutedNoteStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 16,
    color: "var(--text-muted)",
    lineHeight: 1.8,
    fontSize: 14,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    minWidth: 0,
  };
}

function miniHeadingStyle(): React.CSSProperties {
  return {
    fontSize: 17,
    fontWeight: 900,
    color: "var(--text)",
    margin: 0,
    lineHeight: 1.35,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
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
              This Privacy Policy describes how Naija Tax Guide may collect, use,
              store, protect, and operationally process user and workspace
              information when people access the web portal, billing tools, AI
              guidance features, linked communication channels, and support
              functions.
            </p>
            <p style={paragraphStyle()}>
              The policy should be read together with the Terms, Refund Policy,
              Support page, and Data Deletion Instructions where relevant.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="2. Nigeria data protection posture"
          subtitle="The platform is intended to respect practical rights and safeguards associated with the Nigeria Data Protection Act and related privacy expectations."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Tax questions can contain sensitive personal, business, billing,
              employment, or identity-related context. Naija Tax Guide should
              process this information only for legitimate platform purposes such
              as account access, support, billing confirmation, security,
              service delivery, and lawful compliance.
            </p>
            <ul style={bulletListStyle()}>
              <li>Users may request access, correction, support review, or deletion through the published support and data deletion routes.</li>
              <li>Users should avoid submitting unnecessary sensitive records unless a professional or support agent specifically requests them through an appropriate route.</li>
              <li>Where data must be retained for billing, fraud prevention, dispute handling, security logging, or legal compliance, retention should be limited to what is reasonably necessary.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="3. Information we may collect"
          subtitle="The platform may collect different categories of data depending on the feature being used."
        >
          <div style={sectionBodyStyle()}>
            <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
              <h3 style={miniHeadingStyle()}>Account and registration data</h3>
              <p style={paragraphStyle()}>
                We may collect account registration information such as name,
                email address, phone number, linked messaging identities, and
                authentication-related data needed for secure login and
                workspace access.
              </p>
            </div>

            <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
              <h3 style={miniHeadingStyle()}>Usage and workspace activity</h3>
              <p style={paragraphStyle()}>
                We may collect questions submitted by users, AI-generated
                responses, usage activity, support messages, linked channel
                events, and service-level diagnostic information needed to keep
                the platform working properly.
              </p>
            </div>

            <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
              <h3 style={miniHeadingStyle()}>Billing and subscription data</h3>
              <p style={paragraphStyle()}>
                We may collect billing-related identifiers such as subscription
                plan, payment reference, transaction status, renewal status, and
                credit activity. Sensitive payment card details are handled by
                approved payment processors and are not stored directly by Naija
                Tax Guide.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="4. How information may be used"
          subtitle="The platform may use collected information for operational, support, billing, and security purposes."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>To create and manage user accounts and secure the login process.</li>
              <li>To deliver AI-guided responses and maintain question history where enabled.</li>
              <li>To manage subscriptions, credits, renewals, and payment verification.</li>
              <li>To link supported channels such as WhatsApp and Telegram to the same user workspace.</li>
              <li>To detect abuse, fraud, policy violations, technical failure, or billing anomalies.</li>
              <li>To respond to support requests, expert review requests, account issues, and lawful compliance obligations.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="5. Third-party service providers"
          subtitle="Some platform functions may rely on carefully selected third-party infrastructure."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              These providers may include payment processors such as Paystack,
              hosting providers, communication APIs, email delivery tools,
              analytics or monitoring tools, and channel integrations such as
              WhatsApp or Telegram infrastructure where applicable.
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
          title="6. Channel linking and workspace continuity"
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
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="7. Data retention, encryption, and protection"
          subtitle="Operational data should be protected with reasonable safeguards and kept only as long as reasonably necessary."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              The platform should use reasonable technical and organizational
              safeguards to reduce unauthorized access, misuse, or accidental
              exposure of user information. This includes HTTPS for data in
              transit and appropriate database, hosting, access-control, and
              monitoring safeguards for stored operational data.
            </p>
            <div style={mutedNoteStyle()}>
              No internet-based service can promise absolute security. Users
              should also protect login credentials, avoid unnecessary sharing of
              highly sensitive information, and contact support quickly if
              suspicious account activity is noticed.
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="8. User choices and deletion requests"
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
              Privacy and deletion-related requests may be sent to
              <strong> privacy@naijataxguides.com</strong> or raised through the
              official support route where appropriate.
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
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
