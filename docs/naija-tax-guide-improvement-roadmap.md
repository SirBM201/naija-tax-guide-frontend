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
- Contact page expanded with professional-review and escalation guidance for sensitive tax matters that need human review.
- Reviewer index updated to point reviewers to homepage sample answers and professional-review route evidence.
- Backend AI answer finalization now adds deterministic source/freshness warnings for rate, threshold, deadline, portal, filing-procedure, and current-law-sensitive questions.
- Backend AI safety script extended to test source/freshness classification and answer finalization.

## Batch 6 completed

- Backend answer metadata service added to build structured source, review date, jurisdiction, tax year, and risk metadata.
- Runtime answer metadata patch added so successful web, WhatsApp, and Telegram Ask answers can carry `meta.source_metadata` and a visible `Source details:` note.
- Supabase migration added for source metadata fields on `qa_library`, `qa_cache`, and `qa_history`.
- Deterministic answer metadata regression script added.
- Professional review API added at `/api/expert-review/*` for human-review ticket creation.
- Logged-in `/expert-review` page added for users who need review of sensitive or formal tax matters.
- Channel plan consistency script added for checking paid plan and linked-channel state after backend redeploy.

## Current strengths

- The product targets a clear Nigerian tax education and guidance pain point.
- Web, WhatsApp, and Telegram channels match common user behavior.
- Public trust pages now cover pricing, support, privacy, terms, refund, data deletion, about, safety, source transparency, FAQ, and reviewer readiness.
- Homepage now shows sample answer previews and bot entry points before signup.
- AI guidance boundaries are more explicit in frontend copy and backend prompt/finalization policy.
- Successful Ask answers now have a path to source/date/risk metadata.
- Company registration details are publicly visible on the About page.
- The public product now gives reviewers more evidence without requiring repository access.

## Remaining technical gaps

1. Expert-review operations

   The API and web request page now exist, but real operations still need assigned reviewers, pricing rules, service-level expectations, admin triage views, and secure document intake.

2. Expert benchmark execution

   The 100-question benchmark exists, but a Nigerian tax expert still needs to review answers and record pass/fail/correction decisions.

3. Curated answer population

   Source metadata columns now exist as a migration, but existing curated records still need to be populated with source category, review date, jurisdiction, tax year, and risk level.

4. Channel response consistency

   Shared Ask answers now carry source details, guidance notes, and freshness notes, but non-AI menu/calculator/static responses in WhatsApp and Telegram should still be reviewed periodically for wording consistency.

5. Admin evidence dashboard

   Add an internal admin view later to show review status, source metadata coverage, stale answers, high-risk answers, and expert-review queue.

## Recommended next engineering batch

- Add admin triage dashboard for expert review tickets.
- Add scripts to backfill source metadata into existing `qa_library` and `qa_cache` rows.
- Add a secure document-intake workflow for expert review requests.
- Add admin/reporting views for source metadata coverage and stale answer detection.
- Run the expert benchmark and store reviewer outcomes.

## Reviewer test checklist

Use this checklist before external submission:

- Visit `/`, `/pricing`, `/about`, `/safety`, `/sources`, `/faq`, `/startup-readiness`, `/review`, `/privacy`, `/terms`, `/support`, and `/contact`.
- Confirm public pages load without login unless intentionally protected.
- Confirm public trust pages do not show the workspace sidebar.
- Confirm `/pricing` shows monthly prices by default and can switch to quarterly and yearly prices.
- Confirm `/about` shows BMS SparkVision Hub and CAC registration number.
- Confirm the homepage shows sample answer previews and WhatsApp/Telegram entry points.
- Confirm `/expert-review` is protected and works for logged-in users.
- Ask a simple PAYE/VAT/WHT question and confirm the answer includes a guidance boundary.
- Ask a source-sensitive deadline or rate question and confirm source/freshness caution appears.
- Confirm successful Ask answers show `Source details:` and backend responses contain `meta.source_metadata`.
- Confirm WhatsApp and Telegram entry points are visible and correct.
- Confirm checkout/pricing values match backend plan configuration.
- Confirm footer/company identity consistently says BMS SparkVision Hub.
