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

export default function TermsPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Terms of Use"
      subtitle="Read the operating rules, access conditions, payment logic, usage expectations, and legal boundaries that apply to the Naija Tax Guide service."
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
          title="Important scope boundary"
          subtitle="Naija Tax Guide provides digital tax information and guided support. It is not a government tax authority, official filing portal, legal chamber, or automatic substitute for licensed professional judgment in advanced cases."
        />

        <WorkspaceSectionCard
          title="1. Acceptance of terms"
          subtitle="These terms define the basic rules that apply when a user accesses or uses the platform."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Users should not use the service if they do not accept these
              terms, the privacy framework, refund rules, data handling
              processes, or any other published operational conditions that
              apply to the platform.
            </p>

            <p style={paragraphStyle()}>
              Continued access or use of the platform after changes to the
              service, policies, or legal pages may indicate acceptance of the
              updated terms where such treatment is permitted by law and
              platform policy.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="2. Nature of the service"
          subtitle="The platform provides digital guidance and support tools, not guaranteed regulated professional representation."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              The platform may provide tax-related explanations, guidance paths,
              summaries, support responses, and account-linked interaction
              tools, but it should not be interpreted as formal government
              instruction, regulated legal representation, or guaranteed
              professional tax certification.
            </p>

            <p style={paragraphStyle()}>
              Users remain responsible for confirming whether their issue
              requires escalation to a qualified tax professional, accountant,
              legal adviser, or direct communication with the relevant
              authority.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="3. Accounts, access, and workspace use"
          subtitle="Users are responsible for the security and lawful use of their account and workspace."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>Users should provide reasonably accurate account information when registering or updating workspace details.</li>
              <li>Users are responsible for maintaining the confidentiality of their login credentials and linked access methods.</li>
              <li>Users should not knowingly allow unauthorized third parties to operate their workspace.</li>
              <li>The platform may suspend or restrict access where account misuse, abuse, fraud risk, or policy breach is reasonably suspected.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="4. Subscription, billing, and credits"
          subtitle="Paid access, credit usage, and billing behavior are governed by the selected plan and the relevant payment rules."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>Subscription plans may define billing interval, usage limits, and included credit structure.</li>
              <li>Certain actions may stop working when a plan expires, a payment fails, or credit balance reaches zero.</li>
              <li>Auto-renewal may apply where the user has agreed to recurring billing.</li>
              <li>Users are responsible for reviewing their selected plan, renewal condition, and payment authorization before activation.</li>
              <li>The platform may show pending plan changes, grace periods, or delayed activation states where relevant.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="5. Payments and refunds"
          subtitle="Payment completion authorizes processing of the selected service charge, while refund handling remains subject to published refund rules."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              By completing a paid transaction, a user authorizes the platform
              and its payment providers to process the relevant charge for the
              selected subscription, credit purchase, or other approved service
              item.
            </p>

            <p style={paragraphStyle()}>
              Refunds are generally not guaranteed after digital access or usage
              has begun. However, the platform may review refund requests in
              valid situations such as duplicate charges, clear processing
              errors, or failed activation caused by a platform issue.
            </p>

            <p style={paragraphStyle()}>
              The detailed refund framework should be read together with the
              Refund Policy page, which forms part of the overall service rules.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="6. Acceptable use rules"
          subtitle="Users must not abuse the platform, impersonate others, or misuse the service for harmful, deceptive, or unlawful purposes."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>No impersonation, fraudulent claims, or deliberate identity misrepresentation.</li>
              <li>No abusive, harmful, threatening, or illegal use of the system or linked support channels.</li>
              <li>No attempts to bypass billing limits, credit restrictions, access controls, or channel verification requirements.</li>
              <li>No misuse of AI-generated outputs as official state-backed tax rulings or guaranteed legal certifications.</li>
              <li>No deliberate disruption of the service, system testing without permission, or malicious automation against the platform.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="7. Support, communication, and operational contact"
          subtitle="Support routes exist to help users resolve practical issues, but support access must still be used responsibly."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Users may contact the platform through the published support
              routes for account questions, billing concerns, technical issues,
              support follow-up, and operational clarification where relevant.
            </p>

            <p style={paragraphStyle()}>
              The platform may use in-app support inbox tools, email delivery,
              or other approved communication methods to respond to support
              requests, ticket updates, or account-level notices.
            </p>

            <div style={mutedNoteStyle()}>
              Support access should not be used for spam, threats, repeated bad
              faith submissions, or unlawful demands. Abuse of support channels
              may lead to restriction or enforcement action.
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="8. Intellectual property and platform materials"
          subtitle="The platform structure, interface, logic, written content, and related materials remain protected to the extent allowed by law."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Users may use the platform for normal personal or approved
              business access within the permitted service scope, but they
              should not reproduce, repackage, scrape, reverse-engineer,
              resell, or misrepresent platform materials in a way that violates
              intellectual property rights or operational restrictions.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="9. Service availability and limitation"
          subtitle="The platform aims to remain operational, but uninterrupted access cannot be guaranteed at all times."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Availability may be affected by maintenance, hosting events,
              provider downtime, payment interruptions, API issues, abuse
              controls, or other technical and operational dependencies.
            </p>

            <p style={paragraphStyle()}>
              To the extent permitted by law, the platform may limit or suspend
              features where necessary for security, compliance, fraud
              prevention, system stability, or service integrity.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="10. Limitation of reliance and user responsibility"
          subtitle="Users remain responsible for their decisions, filings, payments, escalations, and reliance choices."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              The platform should be treated as a guided digital support tool,
              not an automatic guarantee of filing accuracy, refund success,
              compliance clearance, or professional certification in every
              scenario.
            </p>

            <p style={paragraphStyle()}>
              Users are responsible for reviewing outputs, confirming sensitive
              decisions, preserving records where needed, and seeking regulated
              professional advice when the issue goes beyond the platform’s
              intended scope.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="11. Policy updates and interpretation"
          subtitle="Legal and operational pages may be updated over time as the platform evolves."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Users should review the legal pages periodically to stay aware of
              any material changes that affect access, payment rules, privacy
              handling, or channel operation.
            </p>

            <p style={paragraphStyle()}>
              Where direct clarification is needed, users should use the support
              route published within the platform.
            </p>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}