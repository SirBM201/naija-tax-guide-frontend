# Naija Tax Guide - Stabilization Live QA Checklist

Use this checklist after every frontend/backend redeploy that touches auth, billing, public trust pages, subscriptions, workspace limits, WhatsApp, or Telegram.

## 1. Public page access

Test as a logged-out visitor in a private/incognito browser window.

Routes:

- `/`
- `/pricing`
- `/about`
- `/privacy`
- `/terms`
- `/refund`
- `/data-deletion`
- `/support`
- `/contact`
- `/faq`
- `/safety`
- `/sources`
- `/startup-readiness`
- `/review`

Expected:

- Page opens without login.
- No workspace sidebar appears.
- Top actions should be public actions such as Home, Pricing, and Login.
- Legal/support/trust copy should not expose internal review language.

Automated helper:

```bash
npm run smoke:stabilization
```

Optional base URL override:

```bash
NTG_BASE_URL=https://www.naijataxguides.com npm run smoke:stabilization
```

## 2. Protected workspace access

Test as a logged-out visitor.

Routes:

- `/dashboard`
- `/ask`
- `/channels`
- `/workspace`
- `/billing`
- `/plans`
- `/credits`

Expected:

- Routes should require login.
- Public users should not see the workspace sidebar or internal app state.

## 3. Paid plan consistency

Test as a logged-in paid account.

Routes:

- `/dashboard`
- `/ask`
- `/channels`
- `/workspace`
- `/billing`
- `/plans`
- `/credits`

Expected:

- Visible plan name should match the active subscription shown by `/billing/me`.
- Workspace and channel limits should not show Free when billing is paid.
- Sidebar badges should reflect the paid plan limits.

## 4. Paystack subscription activation

Use a test or real low-risk plan checkout.

Expected flow:

1. Select plan.
2. Complete Paystack checkout.
3. Return to `/billing/success` with the Paystack reference.
4. Success page verifies the reference.
5. Dashboard, Ask, Channels, Workspace, Billing, Plans, and Credits show the same active plan.

Failure handling:

- Save the Paystack reference.
- Reopen `/billing/success?reference=REFERENCE&plan=PLAN_CODE`.
- Check backend logs for `/api/billing/verify`, `/api/billing/me`, and `/api/workspace/limits`.

## 5. Messaging channel checks

WhatsApp:

- Send `Hi`.
- Confirm welcome/scope disclaimer.
- Confirm paid account recognition after linking.
- Ask one simple question.
- Confirm response includes safe guidance wording.

Telegram:

- Send `/start` or `Hi`.
- Confirm welcome/scope disclaimer.
- Confirm paid account recognition after linking.
- Ask one simple question.
- Confirm response includes safe guidance wording.

## 6. Final pass criteria

A deployment is stable when:

- Public pages remain public and sidebar-free.
- Workspace pages remain protected.
- Paid subscription state is consistent across all workspace pages.
- Paystack activation is instant or recoverable through `/billing/success`.
- WhatsApp and Telegram do not contradict web billing state.
