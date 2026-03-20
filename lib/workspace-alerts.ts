import { formatDate, planDisplayName } from "@/components/ui";

export type WorkspaceAlertTone = "good" | "warn" | "danger" | "default";

export type WorkspaceAlert = {
  id: string;
  tone: WorkspaceAlertTone;
  title: string;
  subtitle: string;
};

type WorkspaceAlertInput = {
  profile?: any;
  usage?: any;
  subscription?: any;
  channelLinks?: any;
  billing?: any;
  credits?: any;
};

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return ["1", "true", "yes", "active", "paid", "enabled", "linked", "verified"].includes(raw);
  }
  return false;
}

function safeNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeText(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const clean = value.trim();
    return clean || fallback;
  }
  if (value == null) return fallback;
  const clean = String(value).trim();
  return clean || fallback;
}

export function buildWorkspaceAlerts(input: WorkspaceAlertInput): WorkspaceAlert[] {
  const { usage, subscription, channelLinks, billing, credits } = input;

  const alerts: WorkspaceAlert[] = [];

  const planName = planDisplayName(
    subscription?.plan_name ||
      billing?.plan_name ||
      subscription?.plan_code ||
      billing?.plan_code ||
      ""
  );

  const status = safeText(subscription?.status || billing?.status || "unknown");
  const active = truthyValue(subscription?.active || billing?.active || status === "active");

  const creditBalance = safeNumber(credits?.balance, 0);
  const usedToday = safeNumber(usage?.used_today, 0);
  const dailyLimit = safeNumber(usage?.daily_limit, 0);
  const remainingToday = safeNumber(usage?.remaining_daily_questions, 0);

  const expiresAt = safeText(subscription?.expires_at || billing?.expires_at || "");
  const graceUntil = safeText(subscription?.grace_until || billing?.grace_until || "");
  const pendingPlanCode = safeText(
    subscription?.pending_plan_code || billing?.pending_plan_code || ""
  );
  const pendingStartsAt = safeText(
    subscription?.pending_starts_at || billing?.pending_starts_at || ""
  );

  const whatsappLinked = truthyValue(
    channelLinks?.whatsapp_linked || channelLinks?.whatsapp?.linked
  );
  const telegramLinked = truthyValue(
    channelLinks?.telegram_linked || channelLinks?.telegram?.linked
  );

  if (active) {
    alerts.push({
      id: "plan-active",
      tone: "good",
      title: `Current plan: ${planName}`,
      subtitle: expiresAt
        ? `Your visible subscription is active and currently runs until ${formatDate(expiresAt)}.`
        : "Your visible subscription is currently active.",
    });
  } else {
    alerts.push({
      id: "plan-inactive",
      tone: "warn",
      title: "No active subscription is currently visible",
      subtitle:
        "Billing or plan access may be limiting the workspace right now. Check Plans or Billing next.",
    });
  }

  if (creditBalance <= 0) {
    alerts.push({
      id: "credits-empty",
      tone: "danger",
      title: "Your visible AI credit balance is empty",
      subtitle:
        "Questions may fail even if the account looks active. Open Credits or Plans next.",
    });
  } else if (creditBalance <= 20) {
    alerts.push({
      id: "credits-low",
      tone: "warn",
      title: "Your AI credit balance is getting low",
      subtitle: `Only ${creditBalance} visible credits remain in the workspace.`,
    });
  }

  if (dailyLimit > 0 && remainingToday <= 0) {
    alerts.push({
      id: "daily-limit-reached",
      tone: "warn",
      title: "Daily question limit appears to be reached",
      subtitle: `Used today: ${usedToday} of ${dailyLimit}. Wait for reset or move to a stronger plan.`,
    });
  }

  if (pendingPlanCode) {
    alerts.push({
      id: "pending-plan",
      tone: "default",
      title: `Pending plan change: ${planDisplayName(pendingPlanCode, pendingPlanCode)}`,
      subtitle: pendingStartsAt
        ? `The pending plan is scheduled to start on ${formatDate(pendingStartsAt)}.`
        : "A pending plan transition is visible in the workspace.",
    });
  }

  if (graceUntil) {
    alerts.push({
      id: "grace-period",
      tone: "warn",
      title: "Grace period is visible on this workspace",
      subtitle: `Current grace period runs until ${formatDate(graceUntil)}.`,
    });
  }

  if (!whatsappLinked || !telegramLinked) {
    alerts.push({
      id: "channels-incomplete",
      tone: "default",
      title: "Not all messaging channels are linked yet",
      subtitle: `WhatsApp: ${
        whatsappLinked ? "linked" : "not linked"
      } • Telegram: ${telegramLinked ? "linked" : "not linked"}.`,
    });
  }

  return alerts;
}