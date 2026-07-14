"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { SITE } from "@/lib/site";

function sectionBodyStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 16,
    color: "var(--text)",
    fontSize: "clamp(15px, 2.6vw, 16px)",
    lineHeight: 1.85,
    minWidth: 0,
  };
}

function paragraphStyle(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text)",
    lineHeight: 1.85,
    fontSize: "clamp(15px, 2.6vw, 16px)",
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
    fontSize: "clamp(15px, 2.6vw, 16px)",
    minWidth: 0,
  };
}

function mutedNoteStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: "clamp(14px, 3vw, 16px)",
    color: "var(--text-muted)",
    lineHeight: 1.8,
    fontSize: 14,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    minWidth: 0,
  };
}

function ruleCardStyle(): React.CSSProperties {
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

const accountRules = [
  "Users should provide reasonably accurate account information when registering or updating workspace details.",
  "Users are responsible for keeping login credentials and linked access methods secure.",
  "Users should not allow unauthorized third parties to operate their workspace.",
  "The platform may restrict access where misuse, abuse, fraud risk, or policy breach is reasonably suspected.",
];

const billingRules = [
  "Plans may define billing interval, usage limits, channel access, and included Usage Credits.",
  "Plan access is applied after successful payment confirmation or successful verification.",
  "If payment fails, is abandoned, or is not confirmed, access and credits may remain unchanged.",
  "Top-up credits add usage capacity only; they do not extend subscription validity.",
  "Receipts, references, and transaction records may be used for support, reconciliation, failed payment checks, or refund review.",
];

const acceptableUseRules = [
  "No impersonation, fraudulent claims, or deliberate identity misrepresentation.",
  "No abusive, harmful, threatening, spammy, or unlawful use of the system or linked channels.",
  "No attempts to bypass billing limits, credit restrictions, access controls, or channel verification requirements.",
  "No misuse of AI-generated outputs as official state-backed tax rulings or guaranteed legal certifications.",
  "No deliberate disruption of the service, unauthorized security testing, or malicious automation against the platform.",
];

export default function TermsPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Terms of Use"
      subtitle="Read the operating rules, access conditions, payment logic, usage expectations, and legal boundaries that apply to Naija Tax Guide."
      actions={
        <>
          <button onClick={() => router.push("/privacy")} style={shellButtonPrimary()}>
            Open Privacy
          </button>
          <button onClick={() => router.push("/pricing")} style={shellButtonSecondary()}>
            Pricing
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="warn"
          title="Important scope boundary"
          subtitle="Naija Tax Guide provides digital tax information and guided support. It is not a government tax authority, official filing portal, law firm, accounting firm, or automatic substitute for licensed professional judgment in advanced cases."
        />

        <WorkspaceSectionCard
          title="1. Acceptance of terms"
          subtitle="These terms define the basic rules that apply when a user accesses or uses the platform."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Users should not use the service if they do not accept these terms, the privacy framework, refund rules, data handling processes, billing rules, or other published operational conditions that apply to the platform.
            </p>
            <p style={paragraphStyle()}>
              Continued access or use after changes to the service, policies, or legal pages may indicate acceptance of the updated terms where permitted by law and platform policy.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="2. Nature of the service"
          subtitle="The platform provides digital guidance and support tools, not guaranteed regulated professional representation."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              The platform may provide tax-related explanations, guidance paths, summaries, support responses, calculators, document drafts, and account-linked interaction tools. It should not be interpreted as formal government instruction, regulated legal representation, accounting sign-off, or guaranteed professional tax certification.
            </p>
            <p style={paragraphStyle()}>
              Users remain responsible for confirming whether their issue requires escalation to a qualified tax professional, accountant, legal adviser, or direct communication with the relevant tax authority.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="3. Accounts, access, and workspace use"
          subtitle="Users are responsible for the security and lawful use of their account and workspace."
        >
          <ul style={bulletListStyle()}>
            {accountRules.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="4. Subscription, billing, payments, and credits"
          subtitle="Paid access, credit usage, checkout, and billing behavior are governed by the selected plan and payment rules."
        >
          <div style={sectionBodyStyle()}>
            <ul style={bulletListStyle()}>
              {billingRules.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div style={mutedNoteStyle()}>
              Payments are processed through Paystack checkout. Available payment methods are displayed by Paystack before authorization. Naija Tax Guide keeps the billing records needed for access, credits, support, reconciliation, and refund review, but does not store full card details directly.
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="5. Payments and refunds"
          subtitle="Payment completion authorizes processing of the selected service charge, while refund handling remains subject to published refund rules."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              By completing a paid transaction, a user authorizes the platform and its payment providers to process the relevant charge for the selected subscription, credit purchase, or approved service item.
            </p>
            <p style={paragraphStyle()}>
              Refunds are generally not guaranteed after digital access, subscription time, or delivered credits have been used. Refund requests may be reviewed for duplicate charges, clear processing errors, failed activation caused by a platform issue, or other valid billing concerns described in the Refund Policy.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="6. Acceptable use rules"
          subtitle="Users must not abuse the platform, impersonate others, or misuse the service for harmful, deceptive, or unlawful purposes."
        >
          <ul style={bulletListStyle()}>
            {acceptableUseRules.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="7. Support, communication, and operational contact"
          subtitle="Support routes exist to help users resolve practical issues, but support access must still be used responsibly."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Users may contact the platform through published support routes for account questions, billing concerns, failed payment checks, technical issues, professional-review follow-up, and operational clarification where relevant.
            </p>
            <p style={paragraphStyle()}>
              Privacy and deletion-related communication should use <strong>{SITE.privacyEmail}</strong>. General contact may use <strong>{SITE.supportEmail}</strong> where a support ticket is not the right route.
            </p>
            <div style={mutedNoteStyle()}>
              Support access should not be used for spam, threats, repeated bad-faith submissions, or unlawful demands. Abuse of support channels may lead to restriction or enforcement action.
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="8. Intellectual property and platform materials"
          subtitle="The platform structure, interface, logic, written content, and related materials remain protected to the extent allowed by law."
        >
          <p style={paragraphStyle()}>
            Users may use the platform for normal personal or approved business access within the permitted service scope, but they should not reproduce, repackage, scrape, reverse-engineer, resell, or misrepresent platform materials in a way that violates intellectual property rights or operational restrictions.
          </p>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="9. Service availability and limitation"
          subtitle="The platform aims to remain operational, but uninterrupted access cannot be guaranteed at all times."
        >
          <div style={sectionBodyStyle()}>
            <p style={paragraphStyle()}>
              Availability may be affected by maintenance, hosting events, provider downtime, payment interruptions, API issues, abuse controls, or other technical and operational dependencies.
            </p>
            <p style={paragraphStyle()}>
              To the extent permitted by law, the platform may limit or suspend features where necessary for security, compliance, fraud prevention, system stability, or service integrity.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="10. Reliance, responsibility, and escalation"
          subtitle="Users remain responsible for decisions, filings, payments, escalations, and reliance choices."
        >
          <CardsGrid min={240}>
            <div style={ruleCardStyle()}>
              <strong style={{ color: "var(--text)", fontSize: 18 }}>Use guidance carefully</strong>
              <p style={paragraphStyle()}>
                Treat outputs as guidance and check sensitive figures, dates, deadlines, penalties, and state-specific rules before acting.
              </p>
            </div>
            <div style={ruleCardStyle()}>
              <strong style={{ color: "var(--text)", fontSize: 18 }}>Escalate high-risk matters</strong>
              <p style={paragraphStyle()}>
                Audits, disputes, assessments, penalties, objections, formal filings, and high-value decisions should be reviewed by qualified professionals.
              </p>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="11. Policy updates and interpretation"
          subtitle="Legal and operational pages may be updated over time as the platform evolves."
        >
          <p style={paragraphStyle()}>
            Users should review the legal pages periodically to stay aware of material changes that affect access, payment rules, privacy handling, refunds, support, or channel operation. Where direct clarification is needed, users should use the appropriate support or contact route.
          </p>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
