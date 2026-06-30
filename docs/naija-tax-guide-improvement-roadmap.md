# Naija Tax Guide Improvement Roadmap

Last reviewed: 30 June 2026
Owner: BMS Creative Concept

## Purpose

This document records the first improvement batches applied after the external AI-review feedback. The goal is to make Naija Tax Guide more credible for users, external AI reviewers, and startup committee evaluation.

## Batch 1 completed

- Public pricing page added with visible Free, Starter, Professional, Business, and credit top-up options.
- Homepage updated to expose product purpose, public channels, pricing summary, legal links, sample questions, and guidance boundaries.
- Company metadata aligned to BMS Creative Concept.
- About page added to clarify ownership, target users, channels, and responsible-use boundary.
- Backend AI system prompt tightened for Nigerian-tax-specific safety, escalation, refusal, and uncertainty handling.
- Legacy WhatsApp response copy and PDF receipt footer updated with guidance disclaimers.

## Batch 2 completed

- AI Safety and Tax Accuracy page added at `/safety`.
- Public FAQ page added at `/faq`.
- Startup Readiness page added at `/startup-readiness`.
- This roadmap document added for repo-level audit traceability.

## Current strengths

- The product targets a clear Nigerian tax education and guidance pain point.
- Web, WhatsApp, and Telegram channels match common user behavior.
- Public trust pages now cover pricing, support, privacy, terms, refund, data deletion, about, safety, and FAQ.
- AI guidance boundaries are more explicit in frontend copy and backend prompt policy.
- The public product now gives reviewers more evidence without requiring repository access.

## Remaining technical gaps

1. Source/date metadata

   Add source and review-date metadata to curated tax answers. Numeric claims such as rates, thresholds, penalties, deadlines, and effective dates should show stronger source awareness.

2. Human escalation workflow

   Add a formal escalation path for audits, disputes, penalties, official notices, high-value filing decisions, back-duty exposure, and business restructuring questions.

3. Regression test set

   Maintain a benchmark suite of common Nigerian tax questions, unsafe requests, missing-fact prompts, and high-risk escalation cases. Use it to test web, WhatsApp, Telegram, and API behavior.

4. Channel response consistency

   Ensure web, WhatsApp, and Telegram all apply the same guidance note, escalation policy, and refusal behavior. The core AI prompt is improved, but some channel menus and non-AI responses may still need copy-level alignment.

5. Public update log

   Add a lightweight public or internal tax-content update log showing when tax guidance was reviewed and what changed.

## Recommended next engineering batch

- Add a shared backend helper for appending guidance notes to tax answers where appropriate.
- Add source metadata fields to curated answer records.
- Update web, WhatsApp, and Telegram response rendering to display source/date metadata when available.
- Add automated tests for unsafe tax evasion requests, audit/dispute escalation, and missing-fact handling.
- Add a reviewer test script with sample questions and expected behavior.

## Reviewer test checklist

Use this checklist before external submission:

- Visit `/`, `/pricing`, `/about`, `/safety`, `/faq`, `/startup-readiness`, `/privacy`, `/terms`, `/support`, and `/contact`.
- Confirm public pages load without login unless intentionally protected.
- Ask a simple PAYE/VAT/WHT question and confirm the answer includes a guidance boundary.
- Ask a high-risk audit or penalty question and confirm escalation language appears.
- Ask an unsafe tax evasion question and confirm refusal behavior.
- Confirm WhatsApp and Telegram entry points are visible and correct.
- Confirm checkout/pricing values match backend plan configuration.
- Confirm footer/company identity consistently says BMS Creative Concept.
