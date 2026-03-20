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

export default function RefundPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Refund Policy"
      subtitle="Review the payment, refund review, eligibility, and non-refundable conditions that apply to Naija Tax Guide subscriptions and credit-related purchases."
      actions={
        <>
          <button onClick={() => router.push("/billing")} style={shellButtonPrimary()}>
            Open Billing
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
          title="Important refund position"
          subtitle="Because Naija Tax Guide is a digital-access service, refunds are not automatic after activation or use has begun. However, valid refund requests may still be reviewed in limited situations."
        />

        <WorkspaceSectionCard
          title="1. Scope of this policy"
          subtitle="This page explains the practical refund rules for paid access, subscriptions, and related billing events."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              This Refund Policy applies to eligible payments made for Naija Tax
              Guide subscriptions, approved credit-related purchases, and other
              clearly identified paid service items where the platform has
              published a refund review path.
            </p>

            <p style={paragraphStyle()}>
              This policy should be read together with the Billing page and the
              Terms of Use because refund decisions depend on activation status,
              payment condition, service access, technical outcome, and overall
              platform rules.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="2. Subscription payments"
          subtitle="Most subscription payments are billed in advance for the selected service duration."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Subscription payments are generally billed in advance and are used
              to activate or preserve access for the selected plan period. Once
              access has been activated and the service has become available to
              the user, refund eligibility may become more limited depending on
              the circumstances.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="3. Situations that may qualify for refund review"
          subtitle="Refund review may be considered in specific and reasonably verifiable cases."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>Duplicate payments or duplicate billing for the same service item.</li>
              <li>Technical errors that caused failed activation after successful payment.</li>
              <li>Unauthorized transactions, subject to proper review and investigation.</li>
              <li>Clear platform-side billing or processing mistakes that materially prevented the intended service outcome.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="4. Refund request window"
          subtitle="Refund requests must be submitted promptly within the stated review window."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Eligible refund requests must be submitted within{" "}
              <strong>3 days of payment</strong>. Requests submitted outside
              that window may be declined unless the platform determines that an
              exceptional processing issue, provider delay, or other unusual
              circumstance justifies further review.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="5. Non-refundable situations"
          subtitle="Some situations are generally not eligible for refund once access or value has already been consumed."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>Used subscription period or already-consumed access window.</li>
              <li>Completed advisory or support-related service value already delivered through the platform.</li>
              <li>User mistake in selecting a plan after activation where the platform delivered the purchased access correctly.</li>
              <li>Requests based only on change of mind after successful activation and usable access.</li>
              <li>Cases where service limitations were already clearly disclosed before purchase.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="6. Review process"
          subtitle="Refund requests are reviewed case by case and are not automatically approved."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              When a refund request is submitted, the platform may review the
              payment reference, billing status, activation logs, account state,
              service usage, support history, and any provider-side evidence
              needed to determine whether the request falls within a valid
              refund scenario.
            </p>

            <div style={mutedNoteStyle()}>
              Submission of a refund request does not guarantee approval. Each
              case may be reviewed according to the payment facts, activation
              history, technical evidence, and applicable service rules.
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="7. How to request a refund"
          subtitle="Users should submit refund-related concerns through the official support or billing route."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Refund-related requests should be submitted through the platform’s
              published billing or support path with enough information to help
              identify the transaction, such as payment date, plan selected,
              visible billing status, and the reason the refund is being
              requested.
            </p>

            <p style={paragraphStyle()}>
              Where email-based billing contact is used operationally, requests
              may also be directed to the official billing contact published by
              Naija Tax Guide.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="8. Processing outcome"
          subtitle="Approved refunds, where granted, may still depend on processor timing and financial system delays."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              If a refund is approved, the actual return of funds may depend on
              the payment processor, card network, bank, or channel used for
              the original transaction. Processing time may therefore vary even
              after approval has been confirmed.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="9. Policy updates"
          subtitle="The refund framework may be updated as plans, billing systems, or payment provider rules evolve."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Users should review this page periodically for material updates.
              Continued use of paid services after policy updates may indicate
              acceptance of the revised refund framework to the extent permitted
              by law and platform policy.
            </p>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}