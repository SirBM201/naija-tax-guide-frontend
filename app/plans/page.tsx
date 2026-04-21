"use client";

import React, { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import AppShell, {

shellButtonPrimary,

shellButtonSecondary,

} from "@/components/app-shell";

import WorkspaceSectionCard from
"@/components/workspace-section-card";

import {

Banner,

MetricCard,

formatDate,

} from "@/components/ui";

import { CardsGrid, SectionStack } from "@/components/page-layout";

import { useWorkspaceState } from "@/hooks/useWorkspaceState";

import { buildWorkspaceAlerts } from "@/lib/workspace-alerts";

import { useAuth } from "@/lib/auth";

import { apiJson, isApiError } from "@/lib/api";

// Local currency formatter for Naira (₦)
function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

type BillingCycle = "monthly" | "quarterly" | "yearly";

type Tier = "free" | "starter" | "professional" | "business";

type DisplayPlan = {

code: string;

tier: Tier;

cycle: BillingCycle;

name: string;

audience: string;

description: string;

price: number;

credits: number;

support_level: string;

recommended?: boolean;

active?: boolean;

};

type ChangePlanResp = {

ok?: boolean;

action?: string;

message?: string;

authorization_url?: string;

access_code?: string;

reference?: string;

error?: string;

root_cause?: string;

details?: unknown;

fix?: string;

target_plan?: unknown;

subscription?: unknown;

subscription_summary?: {

current_plan_code?: string | null;

pending_plan_code?: string | null;

pending_starts_at?: string | null;

has_pending_change?: boolean;

is_active_now?: boolean;

status?: string | null;

};

};

type SafeSubscriptionSummary = {

current_plan_code?: string | null;

pending_plan_code?: string | null;

pending_starts_at?: string | null;

has_pending_change?: boolean;

is_active_now?: boolean;

status?: string | null;

};

const PLANS: DisplayPlan[] = [

// Starter plans
{
code: "starter_monthly",
tier: "starter",
cycle: "monthly",
name: "Starter Monthly",
audience: "Best for individuals, salary earners, and first-time users.",
description: "Simple AI-guided tax help for lighter personal tax questions and early-stage users.",
price: 5000,
credits: 100,
support_level: "Standard support",
},
{
code: "starter_quarterly",
tier: "starter",
cycle: "quarterly",
name: "Starter Quarterly",
audience: "Best for individuals, salary earners, and first-time users.",
description: "Simple AI-guided tax help for lighter personal tax questions and early-stage users.",
price: 14000,
credits: 300,
support_level: "Standard support",
},
{
code: "starter_yearly",
tier: "starter",
cycle: "yearly",
name: "Starter Yearly",
audience: "Best for individuals, salary earners, and first-time users.",
description: "Simple AI-guided tax help for lighter personal tax questions and early-stage users.",
price: 51000,
credits: 1200,
support_level: "Standard support",
},

// Professional plans
{
code: "professional_monthly",
tier: "professional",
cycle: "monthly",
name: "Professional Monthly",
audience: "Best for freelancers, consultants, creators, and SMEs.",
description: "Stronger monthly usage capacity for users who need more regular tax guidance and compliance support.",
price: 12000,
credits: 300,
support_level: "Priority support",
recommended: true,
},
{
code: "professional_quarterly",
tier: "professional",
cycle: "quarterly",
name: "Professional Quarterly",
audience: "Best for freelancers, consultants, creators, and SMEs.",
description: "Stronger monthly usage capacity for users who need more regular tax guidance and compliance support.",
price: 33600,
credits: 900,
support_level: "Priority support",
recommended: true,
},
{
code: "professional_yearly",
tier: "professional",
cycle: "yearly",
name: "Professional Yearly",
audience: "Best for freelancers, consultants, creators, and SMEs.",
description: "Stronger monthly usage capacity for users who need more regular tax guidance and compliance support.",
price: 122400,
credits: 3600,
support_level: "Priority support",
recommended: true,
},

// Business plans
{
code: "business_monthly",
tier: "business",
cycle: "monthly",
name: "Business Monthly",
audience: "Best for heavier usage, business support, and ongoing tax guidance needs.",
description: "Higher usage capacity and stronger support for businesses or users who expect more continuous activity.",
price: 25000,
credits: 800,
support_level: "Priority support + account review",
},
{
code: "business_quarterly",
tier: "business",
cycle: "quarterly",
name: "Business Quarterly",
audience: "Best for heavier usage, business support, and ongoing tax guidance needs.",
description: "Higher usage capacity and stronger support for businesses or users who expect more continuous activity.",
price: 70000,
credits: 2400,
support_level: "Priority support + account review",
},
{
code: "business_yearly",
tier: "business",
cycle: "yearly",
name: "Business Yearly",
audience: "Best for heavier usage, business support, and ongoing tax guidance needs.",
description: "Higher usage capacity and stronger support for businesses or users who expect more continuous activity.",
price: 255000,
credits: 9600,
support_level: "Priority support + account review",
},

];

function safeText(value: unknown, fallback = "---"): string {
if (typeof value === "string") {
const clean = value.trim();
return clean || fallback;
}
if (value == null) return fallback;
const clean = String(value).trim();
return clean || fallback;
}

function truthyValue(value: unknown): boolean {
if (typeof value === "boolean") return value;
if (typeof value === "number") return value > 0;
if (typeof value === "string") {
const raw = value.trim().toLowerCase();
return ["1", "true", "yes", "active", "paid", "enabled"].includes(raw);
}
return false;
}

function cycleButtonStyle(active: boolean): React.CSSProperties {
return {
...(active ? shellButtonPrimary() : shellButtonSecondary()),
width: "100%",
justifyContent: "center",
};
}

function summaryBoxStyle(): React.CSSProperties {
return {
border: "1px solid var(--border)",
borderRadius: 18,
background: "var(--surface)",
padding: 16,
display: "grid",
gap: 6,
minWidth: 0,
};
}

function planCardStyle(
active: boolean,
recommended: boolean
): React.CSSProperties {
return {
borderRadius: 22,
border: active
? "1px solid var(--accent-border)"
: recommended
? "1px solid var(--gold)"
: "1px solid var(--border)",
background: active ? "var(--accent-soft)" : "var(--surface)",
padding: 20,
display: "grid",
gap: 14,
minWidth: 0,
overflowWrap: "anywhere",
};
}

export default function PlansPage() {
const router = useRouter();
const { hasSession } = useAuth();

const {
profile,
usage,
subscription,
channelLinks,
billing,
credits,
refreshAll,
} = useWorkspaceState();

const allAlerts = useMemo(
() =>
buildWorkspaceAlerts({
profile,
usage,
subscription,
channelLinks,
billing,
credits,
}),
[profile, usage, subscription, channelLinks, billing, credits]
);

const primaryAlert =
allAlerts.find(
(alert) =>
/plan|billing|subscription/i.test(alert.title) ||
/plan|billing|subscription/i.test(alert.subtitle)
) ||
allAlerts[0] ||
null;

const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
const [checkoutMessage, setCheckoutMessage] = useState("");
const [checkoutError, setCheckoutError] = useState("");
const [processingCode, setProcessingCode] = useState<string>("");

const subscriptionSummary =
(billing?.subscription_summary as SafeSubscriptionSummary | undefined) ||
{};

const billingDates = {
starts_at: (billing as any)?.starts_at || (billing as any)?.started_at || "",
expires_at:
(billing as any)?.expires_at ||
(billing as any)?.current_period_end ||
(billing as any)?.ends_at ||
"",
};

const currentPlanCode = safeText(
subscription?.plan_code ||
billing?.plan_code ||
subscriptionSummary.current_plan_code ||
"",
""
);

const pendingPlanCode = safeText(
subscriptionSummary.pending_plan_code ||
(subscription as any)?.pending_plan_code ||
"",
""
);

const pendingStartsAt = safeText(
subscriptionSummary.pending_starts_at ||
(subscription as any)?.pending_starts_at ||
"",
""
);

const currentPlanName = safeText(
subscription?.plan_name || billing?.plan_name || currentPlanCode || "No active plan"
);

const currentStatus = safeText(
subscription?.status || billing?.status || subscriptionSummary.status || "Unknown"
);

const startedAt = safeText(
subscription?.started_at || billingDates.starts_at || "",
""
);

const expiresAt = safeText(
subscription?.expires_at || billingDates.expires_at || "",
""
);

const creditBalance =
Number(
credits?.balance ??
(billing as any)?.credit_balance?.balance ??
(billing as any)?.credit_balance ??
0
) || 0;

const plansForCycle = useMemo(
() => PLANS.filter((plan) => plan.cycle === billingCycle),
[billingCycle]
);

function isDowngradeTarget(plan: DisplayPlan): boolean {
const current = PLANS.find((item) => item.code === currentPlanCode);
if (!current) return false;
const rank = { free: 0, starter: 1, professional: 2, business: 3 } as const;
return rank[plan.tier] < rank[current.tier];
}

function getActionLabel(plan: DisplayPlan, isCurrent: boolean, isPending: boolean): string {
if (isCurrent) return "Current Plan";
if (isPending) return "Pending Change";
return isDowngradeTarget(plan) ? "Schedule Downgrade" : "Upgrade Now";
}

async function handleChoosePlan(planCode: string) {
if (!hasSession) {
router.push("/login?next=/plans");
return;
}

setCheckoutMessage("");
setCheckoutError("");
setProcessingCode(planCode);

try {
const data = await apiJson<ChangePlanResp>("/billing/change-plan", {
method: "POST",
body: JSON.stringify({ plan_code: planCode }),
timeoutMs: 25000,
});

if (
data?.ok &&
data?.action === "checkout_started" &&
data?.authorization_url
) {
setCheckoutMessage("Redirecting to secure Paystack checkout...");
window.location.href = String(data.authorization_url);
return;
}

if (data?.ok && data?.action === "downgrade_scheduled") {
setCheckoutMessage(
data.message ||
"Your downgrade has been scheduled for the end of the current billing period."
);
await refreshAll();
return;
}

if (data?.ok && data?.action === "pending_change_cleared") {
setCheckoutMessage("Pending change cleared successfully.");
await refreshAll();
return;
}

setCheckoutError("Unexpected response received while starting billing flow.");
} catch (error: unknown) {
if (isApiError(error)) {
const details =
typeof error.data?.fix === "string"
? `${error.message} --- ${error.data.fix}`
: error.message;
setCheckoutError(details);
} else if (error instanceof Error) {
setCheckoutError(error.message);
} else {
setCheckoutError("Unable to continue to checkout right now.");
}
} finally {
setProcessingCode("");
}
}

async function handleClearPendingChange() {
if (!hasSession) {
router.push("/login?next=/plans");
return;
}

setCheckoutMessage("");
setCheckoutError("");
setProcessingCode("__clear_pending__");

try {
const data = await apiJson<ChangePlanResp>("/billing/clear-pending-change", {
method: "POST",
timeoutMs: 20000,
});

if (data?.ok) {
setCheckoutMessage(
data?.action === "no_pending_change"
? "There is no pending plan change to clear."
: "Pending plan change cleared successfully."
);
await refreshAll();
return;
}

setCheckoutError("Unable to clear pending plan change right now.");
} catch (error: unknown) {
if (isApiError(error)) {
setCheckoutError(error.message);
} else if (error instanceof Error) {
setCheckoutError(error.message);
} else {
setCheckoutError("Unable to clear pending plan change right now.");
}
} finally {
setProcessingCode("");
}
}

return (
<AppShell
title="Plans"
subtitle="Choose the subscription plan that best matches your expected usage, included AI credits, and support level."
actions={
<>
<button onClick={() => refreshAll()} style={shellButtonPrimary()}>
Refresh Plans
</button>
<button
onClick={() => router.push("/billing")}
style={shellButtonSecondary()}
>
Open Billing
</button>
</>
}
>
<SectionStack>
{primaryAlert ? (
<Banner
tone={primaryAlert.tone}
title={primaryAlert.title}
subtitle={primaryAlert.subtitle}
/>
) : null}

{checkoutError ? (
<Banner
tone="danger"
title="Billing action failed"
subtitle={checkoutError}
/>
) : null}

{checkoutMessage ? (
<Banner
tone="good"
title="Billing update"
subtitle={checkoutMessage}
/>
) : null}

<WorkspaceSectionCard
title="Choose billing cycle"
subtitle="Switch between monthly, quarterly, and yearly plan views before selecting a plan."
>
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
gap: 12,
width: "100%",
}}
>
<button
onClick={() => setBillingCycle("monthly")}
style={cycleButtonStyle(billingCycle === "monthly")}
>
Monthly
</button>
<button
onClick={() => setBillingCycle("quarterly")}
style={cycleButtonStyle(billingCycle === "quarterly")}
>
Quarterly
</button>
<button
onClick={() => setBillingCycle("yearly")}
style={cycleButtonStyle(billingCycle === "yearly")}
>
Yearly
</button>
</div>
</WorkspaceSectionCard>

<WorkspaceSectionCard
title="Plan snapshot"
subtitle="Review the currently visible subscription state before choosing a new billing tier."
>
<CardsGrid min={180}>
<MetricCard
label="Current Plan"
value={currentPlanName}
helper={`Code: ${currentPlanCode || "Not currently visible"}`}
/>
<MetricCard
label="Current Status"
value={currentStatus}
tone={truthyValue(subscriptionSummary.is_active_now) ? "good" : "warn"}
helper="High-level subscription state currently visible in your workspace."
/>
<MetricCard
label="Pending Plan"
value={pendingPlanCode || "No pending change"}
tone={pendingPlanCode ? "warn" : "default"}
helper={
pendingPlanCode && pendingStartsAt
? `Scheduled to start ${formatDate(pendingStartsAt)}.`
: "Shows any scheduled downgrade or pending change."
}
/>
<MetricCard
label="Visible Credits"
value={String(creditBalance)}
helper="Credits currently visible in the workspace."
/>
</CardsGrid>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
gap: 14,
marginTop: 18,
}}
>
<div style={summaryBoxStyle()}>
<strong style={{ overflowWrap: "anywhere" }}>Subscription Started</strong>
<span style={{ overflowWrap: "anywhere" }}>
{startedAt ? formatDate(startedAt) : "Not currently visible"}
</span>
</div>
<div style={summaryBoxStyle()}>
<strong style={{ overflowWrap: "anywhere" }}>Subscription Expires</strong>
<span style={{ overflowWrap: "anywhere" }}>
{expiresAt ? formatDate(expiresAt) : "Not currently visible"}
</span>
</div>
</div>

{pendingPlanCode ? (
<div
style={{
marginTop: 18,
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
gap: 12,
width: "100%",
}}
>
<button
disabled={processingCode === "__clear_pending__"}
onClick={handleClearPendingChange}
style={{ ...shellButtonSecondary(), width: "100%", justifyContent: "center" }}
>
{processingCode === "__clear_pending__"
? "Clearing Pending Change..."
: "Clear Pending Change"}
</button>
</div>
) : null}
</WorkspaceSectionCard>

<WorkspaceSectionCard
title="Available plans"
subtitle="Compare plan tiers, included AI credits, support level, and billing value before checkout."
>
<CardsGrid min={250}>
{/* ===== FREE FOREVER PLAN ===== */}
{(() => {
const isCurrentFree = currentPlanCode === null || currentPlanCode === "";
return (
<div key="free_plan" style={planCardStyle(isCurrentFree, false)}>
<div style={{ display: "grid", gap: 12 }}>
<div style={{ minWidth: 0 }}>
<div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2, overflowWrap: "anywhere" }}>
Free Forever
</div>
<div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, overflowWrap: "anywhere" }}>
Best for individuals who need basic tax answers without AI.
</div>
</div>
{isCurrentFree && (
<span
style={{
justifySelf: "start",
alignSelf: "start",
borderRadius: 999,
padding: "6px 10px",
fontSize: 12,
fontWeight: 800,
color: "var(--accent)",
border: "1px solid var(--accent-border)",
maxWidth: "100%",
overflowWrap: "anywhere",
}}
>
Current Plan
</span>
)}
</div>
<div style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7, overflowWrap: "anywhere" }}>
Unlimited database answers. No AI credits. Perfect for simple tax lookups.
</div>
<div
style={{
border: "1px solid var(--border)",
borderRadius: 18,
background: "rgba(255,255,255,0.02)",
padding: 18,
display: "grid",
gap: 8,
minWidth: 0,
}}
>
<div style={{ fontSize: 14, color: "var(--text-muted)" }}>Price</div>
<div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.15, overflowWrap: "anywhere" }}>
{formatNaira(0)}
</div>
<div style={{ fontSize: 14, color: "var(--text-muted)", overflowWrap: "anywhere" }}>
{billingCycle}
</div>
</div>
<div style={{ display: "grid", gap: 10, fontSize: 15, lineHeight: 1.7, minWidth: 0 }}>
<div style={{ overflowWrap: "anywhere" }}>Included AI credits: 0</div>
<div style={{ overflowWrap: "anywhere" }}>Support level: Standard support</div>
<div style={{ overflowWrap: "anywhere" }}>Billing action: Always free</div>
</div>
<div
style={{
display: "grid",
gridTemplateColumns: "minmax(0, 1fr)",
gap: 12,
width: "100%",
}}
>
<button
disabled={true}
style={{
...shellButtonSecondary(),
width: "100%",
justifyContent: "center",
opacity: 0.6,
}}
>
Active
</button>
</div>
</div>
);
})()}

{/* ===== PAID PLANS ===== */}
{plansForCycle.map((plan) => {
const isCurrent = currentPlanCode === plan.code;
const isPending = pendingPlanCode === plan.code;
const isProcessing = processingCode === plan.code;
const actionLabel = getActionLabel(plan, isCurrent, isPending);

return (
<div key={plan.code} style={planCardStyle(isCurrent, !!plan.recommended)}>
<div
style={{
display: "grid",
gridTemplateColumns: "minmax(0, 1fr)",
gap: 12,
alignItems: "start",
}}
>
<div style={{ minWidth: 0 }}>
<div
style={{
fontSize: 18,
fontWeight: 900,
lineHeight: 1.2,
overflowWrap: "anywhere",
}}
>
{plan.name}
</div>
<div
style={{
marginTop: 8,
color: "var(--text-muted)",
fontSize: 15,
lineHeight: 1.6,
overflowWrap: "anywhere",
}}
>
{plan.audience}
</div>
</div>
{isCurrent ? (
<span
style={{
justifySelf: "start",
alignSelf: "start",
borderRadius: 999,
padding: "6px 10px",
fontSize: 12,
fontWeight: 800,
color: "var(--accent)",
border: "1px solid var(--accent-border)",
maxWidth: "100%",
overflowWrap: "anywhere",
}}
>
Current
</span>
) : isPending ? (
<span
style={{
justifySelf: "start",
alignSelf: "start",
borderRadius: 999,
padding: "6px 10px",
fontSize: 12,
fontWeight: 800,
color: "var(--warning-text, #b45309)",
border: "1px solid var(--warning-border, #f59e0b)",
maxWidth: "100%",
overflowWrap: "anywhere",
}}
>
Pending Change
</span>
) : plan.recommended ? (
<span
style={{
justifySelf: "start",
alignSelf: "start",
borderRadius: 999,
padding: "6px 10px",
fontSize: 12,
fontWeight: 800,
color: "var(--gold)",
border: "1px solid var(--gold)",
maxWidth: "100%",
overflowWrap: "anywhere",
}}
>
Recommended
</span>
) : null}
</div>

<div
style={{
color: "var(--text-muted)",
fontSize: 15,
lineHeight: 1.7,
overflowWrap: "anywhere",
}}
>
{plan.description}
</div>

<div
style={{
border: "1px solid var(--border)",
borderRadius: 18,
background: "rgba(255,255,255,0.02)",
padding: 18,
display: "grid",
gap: 8,
minWidth: 0,
}}
>
<div style={{ fontSize: 14, color: "var(--text-muted)" }}>Price</div>
<div
style={{
fontSize: 24,
fontWeight: 900,
lineHeight: 1.15,
overflowWrap: "anywhere",
}}
>
{formatNaira(plan.price)}
</div>
<div style={{ fontSize: 14, color: "var(--text-muted)", overflowWrap: "anywhere" }}>
{plan.cycle.charAt(0).toUpperCase() + plan.cycle.slice(1)}
</div>
</div>

<div
style={{
display: "grid",
gap: 10,
fontSize: 15,
lineHeight: 1.7,
minWidth: 0,
}}
>
<div style={{ overflowWrap: "anywhere" }}>Included AI credits: {plan.credits}</div>
<div style={{ overflowWrap: "anywhere" }}>Support level: {plan.support_level}</div>
<div style={{ overflowWrap: "anywhere" }}>Billing action: {actionLabel}</div>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "minmax(0, 1fr)",
gap: 12,
width: "100%",
}}
>
<button
disabled={isProcessing || isCurrent || isPending}
onClick={() => handleChoosePlan(plan.code)}
style={{
...(isCurrent || isPending ? shellButtonSecondary() : shellButtonPrimary()),
width: "100%",
justifyContent: "center",
}}
>
{isProcessing ? "Processing..." : actionLabel}
</button>
</div>
</div>
);
})}
</CardsGrid>
</WorkspaceSectionCard>
</SectionStack>
</AppShell>
);
}
