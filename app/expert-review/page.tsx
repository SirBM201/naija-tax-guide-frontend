"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, appInputStyle, appSelectStyle, appTextareaStyle } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";

type ReviewPackage = {
  code: string;
  name: string;
  status: string;
  price_note?: string;
  sla_note?: string;
  best_for?: string[];
};

type SubmitResult = {
  ok?: boolean;
  ticket_id?: string;
  message?: string;
  error?: string;
};

const scopeItems = [
  "Human review of the facts you provide and the tax issue you identify.",
  "A written triage response or next-step guidance in the support thread.",
  "A request for more facts or documents where the matter cannot be assessed safely from the first message.",
  "Escalation guidance when a matter should be handled by a qualified tax practitioner, accountant, or lawyer outside the app.",
];

const excludedItems = [
  "It is not instant AI advice and it is not a government filing service.",
  "It is not a statutory audit, signed tax opinion, court/legal representation, or FIRS/state tax authority submission unless separately agreed in writing.",
  "Do not paste full IDs, passwords, complete bank card details, or unnecessary sensitive documents into this form.",
];

const reviewerBoundaryItems = [
  "Reviewer assignment depends on matter type and availability.",
  "Where a licensed or specialist professional is required, support may ask you to proceed under a separate scope and fee arrangement.",
  "Final pricing can depend on urgency, records involved, tax head, tax period, and whether a written opinion or filing support is needed.",
];

function bodyText(): React.CSSProperties {
  return {
    margin: 0,
    color: "var(--text-muted)",
    lineHeight: 1.75,
    fontSize: 14,
  };
}

function card(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    borderRadius: 18,
    padding: 18,
    display: "grid",
    gap: 10,
    minWidth: 0,
    height: "100%",
  };
}

function list(items: string[] = []) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((item) => (
        <div key={item} style={{ display: "grid", gridTemplateColumns: "20px minmax(0, 1fr)", gap: 8, color: "var(--text-muted)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--accent)" }}>-</strong>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function ExpertReviewPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<ReviewPackage[]>([]);
  const [packageCode, setPackageCode] = useState("triage");
  const [priority, setPriority] = useState("normal");
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadPackages() {
      try {
        const response = await fetch("/api/expert-review/packages", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!cancelled && Array.isArray(data?.packages)) {
          setPackages(data.packages);
        }
      } catch {
        if (!cancelled) setPackages([]);
      }
    }
    void loadPackages();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.code === packageCode) || packages[0] || null,
    [packages, packageCode]
  );

  async function submitRequest() {
    setError("");
    setNotice("");

    if (!question.trim() && !details.trim()) {
      setError("Please describe the tax matter or paste the question that needs review.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/expert-review/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_code: packageCode,
          priority,
          subject,
          question,
          details,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as SubmitResult;
      if (!response.ok || data?.ok === false) {
        setError(data?.message || data?.error || "Professional review request could not be created.");
        return;
      }
      setNotice(`Professional review request created. Ticket ID: ${data.ticket_id || "not shown"}. Track it from Support.`);
      setSubject("");
      setQuestion("");
      setDetails("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Professional Review"
      subtitle="Request human review for high-risk Nigerian tax matters that should not rely on AI guidance alone."
      actions={
        <>
          <button type="button" onClick={() => router.push("/support")} style={shellButtonSecondary()}>
            Support
          </button>
          <button type="button" onClick={() => router.push("/ask")} style={shellButtonPrimary()}>
            Ask
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="warn"
          title="Professional review is human escalation, not instant AI advice"
          subtitle="Use this route for audits, official notices, assessments, penalties, objections, formal filings, back-duty exposure, restructuring, cross-border questions, or high-value decisions. Final scope, pricing, and availability depend on the facts and reviewer availability."
        />

        {notice ? <Banner tone="good" title="Request created" subtitle={notice} /> : null}
        {error ? <Banner tone="danger" title="Request issue" subtitle={error} /> : null}

        <WorkspaceSectionCard title="What this review can include" subtitle="Professional review starts with triage and may move to a separate scope if the matter needs deeper work.">
          <CardsGrid min={260}>
            <div style={card()}>
              <strong style={{ color: "var(--text)", fontSize: 18 }}>Included in review triage</strong>
              {list(scopeItems)}
            </div>
            <div style={card()}>
              <strong style={{ color: "var(--text)", fontSize: 18 }}>Not automatically included</strong>
              {list(excludedItems)}
            </div>
            <div style={card()}>
              <strong style={{ color: "var(--text)", fontSize: 18 }}>Pricing and reviewer boundary</strong>
              {list(reviewerBoundaryItems)}
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Review packages" subtitle="Choose the closest route. The review team may reclassify the request during triage if another route is safer.">
          <CardsGrid min={260}>
            {(packages.length ? packages : [
              { code: "triage", name: "Professional Review Triage", status: "available", price_note: "Initial routing and scope review; further professional fees may be quoted after facts are reviewed.", sla_note: "Target first response: 1-2 business days after complete information is received.", best_for: ["Scope review", "Document preparation", "Escalation decision"] },
            ]).map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setPackageCode(item.code)}
                style={{
                  ...card(),
                  textAlign: "left",
                  cursor: "pointer",
                  border: item.code === packageCode ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                  background: item.code === packageCode ? "var(--accent-soft)" : "var(--surface)",
                }}
              >
                <strong style={{ color: "var(--text)", fontSize: 18 }}>{item.name}</strong>
                <p style={bodyText()}>Status: {item.status}</p>
                {item.price_note ? <p style={bodyText()}>{item.price_note}</p> : null}
                {item.sla_note ? <p style={bodyText()}>{item.sla_note}</p> : null}
                {list(item.best_for || [])}
              </button>
            ))}
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Create professional review request"
          subtitle={selectedPackage ? `Selected: ${selectedPackage.name}` : "Describe the matter clearly so it can be reviewed and routed safely."}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <select value={packageCode} onChange={(event) => setPackageCode(event.target.value)} style={appSelectStyle()}>
              {(packages.length ? packages : [{ code: "triage", name: "Professional Review Triage", status: "available" }]).map((item) => (
                <option key={item.code} value={item.code}>{item.name}</option>
              ))}
            </select>

            <select value={priority} onChange={(event) => setPriority(event.target.value)} style={appSelectStyle()}>
              <option value="normal">Priority: Normal</option>
              <option value="high">Priority: High</option>
              <option value="urgent">Priority: Urgent</option>
            </select>

            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject, for example: Review my PAYE notice"
              style={appInputStyle()}
            />

            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Paste the tax question, notice summary, or AI answer that needs human review."
              rows={5}
              style={appTextareaStyle()}
            />

            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Add relevant facts: state, tax year, entity type, deadline, amount involved, documents received, and what outcome you need. Do not upload sensitive documents here unless support asks through a secure route."
              rows={8}
              style={appTextareaStyle()}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <button
                type="button"
                onClick={submitRequest}
                disabled={submitting}
                style={{ ...shellButtonPrimary(), opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Submitting..." : "Submit Review Request"}
              </button>
              <button type="button" onClick={() => router.push("/support")} style={shellButtonSecondary()}>
                Track in Support
              </button>
            </div>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
