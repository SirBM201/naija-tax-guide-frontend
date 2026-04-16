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
    fontSize: "clamp(14px, 2.8vw, 16px)",
    lineHeight: 1.85,
    minWidth: 0,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function paragraphStyle(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text)",
    lineHeight: 1.85,
    fontSize: "clamp(14px, 2.8vw, 16px)",
    minWidth: 0,
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
    lineHeight: 1.75,
    fontSize: "clamp(14px, 2.8vw, 16px)",
    minWidth: 0,
    overflowWrap: "anywhere",
  };
}

function mutedNoteStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: "clamp(14px, 3vw, 18px)",
    color: "var(--text-muted)",
    lineHeight: 1.75,
    fontSize: "clamp(13px, 2.6vw, 15px)",
    minWidth: 0,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function miniHeadingStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(16px, 3.2vw, 18px)",
    fontWeight: 900,
    color: "var(--text)",
    margin: 0,
    wordBreak: "break-word",
  };
}

export default function DataDeletionPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Data Deletion Instructions"
      subtitle="Review how to request deletion of your Naija Tax Guide account-related data, what information may be required, and what operational effects deletion may have."
      actions={
        <>
          <button onClick={() => router.push("/privacy")} style={shellButtonPrimary()}>
            Open Privacy
          </button>
          <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
            Back to Dashboard
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="warn"
          title="Important deletion notice"
          subtitle="Data deletion requests may require identity verification and may be subject to lawful retention obligations for billing, fraud prevention, audit trail, or compliance purposes where applicable."
        />

        <WorkspaceSectionCard
          title="1. Scope of this page"
          subtitle="This page explains the practical route for requesting deletion of account-related information from Naija Tax Guide."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              If you want your data deleted from Naija Tax Guide, you should
              follow the request channels described on this page. The purpose of
              this process is to help the platform identify the correct account,
              avoid unauthorized deletion, and handle the request in a controlled
              and compliant manner.
            </p>

            <p style={paragraphStyle()}>
              This page should be read together with the Privacy Policy because
              deletion handling may still be affected by operational, billing,
              dispute, fraud-prevention, or legal retention requirements.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="2. Option 1 — Email request"
          subtitle="Users may request deletion through the published privacy contact."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              You may send an email to <strong>privacy@naijataxguide.com</strong>{" "}
              with a clear subject line such as{" "}
              <strong>“Data Deletion Request”</strong>.
            </p>

            <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
              <h3 style={miniHeadingStyle()}>Include where available</h3>
              <ul style={bulletListStyle()}>
                <li>Your linked phone number or email address.</li>
                <li>Your account ID, if available.</li>
                <li>
                  Any detail that helps identify the correct workspace without
                  exposing unnecessary sensitive information.
                </li>
              </ul>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="3. Option 2 — In-app request"
          subtitle="Users may also request deletion through the product support route where available."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              You may request deletion through the dashboard support route or
              the in-app support channel where that option is available inside
              the platform.
            </p>

            <p style={paragraphStyle()}>
              Where an in-app route is used, the platform may still request
              enough identifying information to confirm ownership of the account
              before any destructive action is taken.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="4. Verification before deletion"
          subtitle="Deletion requests may require identity confirmation before processing."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              The platform may request reasonable proof that the person making
              the deletion request is the legitimate account holder or is
              otherwise properly authorized to act for that account.
            </p>

            <div style={mutedNoteStyle()}>
              This verification step helps prevent unauthorized deletion,
              impersonation, or malicious requests targeting another person’s
              workspace.
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="5. Processing time"
          subtitle="Deletion requests should be reviewed and processed within a reasonable operational timeframe."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Data deletion requests are generally targeted for processing
              within <strong>7 business days</strong>, although actual timing
              may vary depending on identity verification, billing review,
              linked-channel dependencies, processor-side records, or other
              operational considerations.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="6. Effect of deletion"
          subtitle="Deletion may affect account access, support continuity, and linked data visibility."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>Chat or question history may be removed or no longer remain accessible.</li>
              <li>Linked channels may be unlinked from the workspace.</li>
              <li>Subscription-related records may be anonymized or minimized where deletion is appropriate.</li>
              <li>Support history may no longer remain available in the same form after deletion is completed.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="7. Information that may still be retained"
          subtitle="Some information may still need to be preserved for limited lawful or operational reasons."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Even where a deletion request is accepted, the platform may retain
              limited records where necessary for lawful compliance, fraud
              prevention, dispute handling, financial reconciliation, security
              logging, or audit trail preservation.
            </p>

            <p style={paragraphStyle()}>
              Where retention is necessary, the platform should limit retained
              information to what is reasonably required for that purpose.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="8. Compliance and follow-up contact"
          subtitle="Users may contact the platform for deletion-related follow-up or privacy clarification."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              For compliance or deletion-related inquiries, contact{" "}
              <strong>privacy@naijataxguide.com</strong> or use the official
              support route available within the platform where appropriate.
            </p>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
