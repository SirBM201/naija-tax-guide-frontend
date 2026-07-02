# Naija Tax Guide Improvement Roadmap

Last reviewed: 3 July 2026
Owner: BMS SparkVision Hub

## Purpose

This document records the improvement batches applied after the external AI-review feedback. The goal is to make Naija Tax Guide more credible for users, external AI reviewers, and startup committee evaluation.

## Batch 1 completed

- Public pricing page added for Starter, Professional, Business, and credit top-up options.
- Pricing page now shows one billing structure at a time, with monthly selected by default and a switcher for quarterly and yearly structures.
- Homepage updated to expose product purpose, public channels, pricing summary, legal links, sample questions, and guidance boundaries.
- Company metadata aligned to BMS SparkVision Hub.
- About page added to clarify ownership, target users, channels, and responsible-use boundary.
- Backend AI system prompt tightened for Nigerian-tax-specific safety, escalation, refusal, and uncertainty handling.
- Legacy WhatsApp response copy and PDF receipt footer updated with guidance disclaimers.

## Batch 2 completed

- AI Safety and Tax Accuracy page added at `/safety`.
- Public FAQ page added at `/faq`.
- Startup Readiness page added at `/startup-readiness`.
- Reviewer index page added at `/review`.
- Public Source Transparency page added at `/sources`.
- About page expanded with CAC business registration details.
- This roadmap document added for repo-level audit traceability.

## Batch 3 completed

- Backend AI safety helper utilities added for guidance-note enforcement and basic refuse/escalate routing.
- Backend source metadata catalog added at `app/services/tax_source_catalog.py`.
- Backend source transparency policy added at `docs/source-transparency-policy.md`.
- Verification scripts added for AI safety and source catalog checks.
- Reviewer test script expanded with source/freshness checks.

## Batch 4 completed

- Public pages separated from the logged-in workspace shell so visitors no longer see internal workspace sidebar navigation.
- Public auth allowlist expanded for trust, legal, safety, source, FAQ, and readiness pages.
- Frontend stabilization smoke script added at `scripts/stabilization-smoke.mjs`.
- Live QA checklist added at `docs/stabilization-live-qa-checklist.md`.
- Backend subscription guard fixed so old Free rows cannot override newer active paid subscriptions.
- Backend subscription-selection regression check added.

## Batch 5 completed

- Homepage upgraded with public sample answer previews, direct WhatsApp/Telegram entry buttons, and clearer professional-escalation cues.
- Contact page expanded with professional-review and escalation guidance for audits, disputes, notices, penalties, formal filings, and high-value decisions.
- Reviewer index updated to point reviewers to homepage sample answers and professional-review route evidence.
- Backend AI answer finalization now adds deterministic source/freshness warnings for rate, threshold, deadline, penalty, portal, filing-procedure, and current-law-sensitive questions.
- Backend AI safety script extended to test source/freshness classification and answer finalization.

## Current strengths

- The product targets a clear Nigerian tax education and guidance pain point.
- Web, WhatsApp, and Telegram channels match common user behavior.
- Public trust pages now cover pricing, support, privacy, terms, refund, data deletion, about, safety, source transparency, FAQ, and reviewer readiness.
- Homepage now shows sample answer previews and bot entry points before signup.
- AI guidance boundaries are more explicit in frontend copy and backend prompt/finalization policy.
- Company registration details are publicly visible on the About page.
- The public product now gives reviewers more evidence without requiring repository access.

## Remaining technical gaps

1. Curated answer source/date integration

   The source catalog exists, and AI source/freshness warnings now exist, but curated answer records still need source category, review date, jurisdiction, tax year, and risk-level fields wired into response rendering.

2. Deeper human escalation workflow

   Public professional-review guidance now exists, but a complete operational workflow still needs partner/expert assignment, SLA expectations, admin triage, and paid expert-review packaging.

3. Regression test set

   Maintain a benchmark suite of common Nigerian tax questions, unsafe requests, missing-fact prompts, high-risk escalation cases, and source/freshness prompts. Use it to test web, WhatsApp, Telegram, and API behavior.

4. Channel response consistency

   Ensure web, WhatsApp, and Telegram all apply the same guidance note, escalation policy, refusal behavior, and source/freshness caution. The core AI prompt/finalizer is improved, but some channel menus and non-AI responses may still need copy-level alignment.

5. Public update log

   Add a lightweight public or internal tax-content update log showing when tax guidance was reviewed and what changed.

## Recommended next engineering batch

- Wire source metadata fields into curated answer records.
- Update web, WhatsApp, and Telegram response rendering to display source/date metadata when available.
- Add automated tests for unsafe tax evasion requests, audit/dispute escalation, missing-fact handling, and source/freshness caution.
- Add professional escalation routing for audit, dispute, penalty, and formal filing cases.
- Add a lightweight tax-content update log.

## Reviewer test checklist

Use this checklist before external submission:

- Visit `/`, `/pricing`, `/about`, `/safety`, `/sources`, `/faq`, `/startup-readiness`, `/review`, `/privacy`, `/terms`, `/support`, and `/contact`.
- Confirm public pages load without login unless intentionally protected.
- Confirm public trust pages do not show the workspace sidebar.
- Confirm `/pricing` shows monthly prices by default and can switch to quarterly and yearly prices.
- Confirm `/about` shows BMS SparkVision Hub and CAC registration number.
- Confirm the homepage shows sample answer previews and WhatsApp/Telegram entry points.
- Ask a simple PAYE/VAT/WHT question and confirm the answer includes a guidance boundary.
- Ask a high-risk audit or penalty question and confirm escalation language appears.
- Ask an unsafe tax evasion question and confirm refusal behavior.
- Ask a deadline/penalty question and confirm source or freshness caution appears.
- Confirm WhatsApp and Telegram entry points are visible and correct.
- Confirm checkout/pricing values match backend plan configuration.
- Confirm footer/company identity consistently says BMS SparkVision Hub.
