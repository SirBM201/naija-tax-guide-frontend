"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson, isApiError } from "@/lib/api";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, formatDate } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";

type LinkProvider = "wa" | "tg";

type LinkGenerateResponse = {
  ok?: boolean;
  code?: string;
  expires_in_minutes?: number;
  expires_at?: string;
  provider?: string;
  account_id?: string;
  error?: string;
  deep_link?: string;
  link_url?: string;
  bot_url?: string;
  whatsapp_url?: string;
  telegram_url?: string;
};

type LinkUnlinkResponse = {
  ok?: boolean;
  unlinked?: boolean;
  reason?: string;
  error?: string;
};

type LinkState = {
  loading: boolean;
  error: string;
  success: string;
  code: string;
  expiresInMinutes: number | null;
  expiresAt: string;
  generatedAt: number | null;
  launchUrl: string;
};

type WorkspaceLimitsResponse = {
  ok?: boolean;
  counts?: {
    active_members_only?: number;
    owner_included_total?: number;
  };
  entitlements?: {
    ok?: boolean;
    plan?: {
      name?: string;
      code?: string;
      plan_family?: string;
      active?: boolean;
    };
    plan_code?: string | null;
    plan_family?: string | null;
    workspace_limits?: {
      max_workspace_users?: number;
      max_linked_web_accounts?: number;
    };
    channel_limits?: {
      max_total_channels?: number;
      max_whatsapp_channels?: number;
      max_telegram_channels?: number;
    };
  };
};

function makeEmptyLinkState(): LinkState {
  return {
    loading: false,
    error: "",
    success: "",
    code: "",
    expiresInMinutes: null,
    expiresAt: "",
    generatedAt: null,
    launchUrl: "",
  };
}

function safeText(value: unknown, fallback = "Not shown"): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
      ? ""
      : String(value).trim();
  return text || fallback;
}

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return ["1", "true", "yes", "active", "linked", "enabled", "verified"].includes(raw);
  }
  return false;
}

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function channelCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 22,
    background: "var(--surface)",
    padding: 22,
    display: "grid",
    gap: 16,
  };
}

function itemStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 4,
    padding: "0 0 12px 0",
    borderBottom: "1px solid var(--border)",
  };
}

function itemLabelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text-muted)",
  };
}

function itemValueStyle(): React.CSSProperties {
  return {
    fontSize: 16,
    fontWeight: 800,
    color: "var(--text)",
  };
}

function summaryGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  };
}

function summaryCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 22,
    background: "var(--surface)",
    padding: 18,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: 8,
  };
}

function summaryLabelStyle(): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 900,
    color: "var(--text-faint)",
    letterSpacing: 0.6,
  };
}

function summaryValueStyle(): React.CSSProperties {
  return {
    fontSize: 22,
    fontWeight: 900,
    color: "var(--text)",
    lineHeight: 1.2,
  };
}

function summarySubStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    color: "var(--text-muted)",
    lineHeight: 1.6,
  };
}

function statusLabel(linked: boolean, verified: boolean): string {
  if (linked && verified) return "Linked";
  if (linked && !verified) return "Pending Verification";
  return "Not Linked";
}

function verificationLabel(verified: boolean): string {
  return verified ? "Verified" : "Not verified yet";
}

function formatMinutesLabel(minutes: number | null) {
  if (!minutes || minutes <= 0) return "Code validity window unavailable.";
  if (minutes === 1) return "Code expires in 1 minute.";
  return `Code expires in ${minutes} minutes.`;
}

function LinkCodePanel({
  provider,
  title,
  description,
  accountId,
  busy,
  locked,
  lockedMessage,
}: {
  provider: LinkProvider;
  title: string;
  description: string;
  accountId: string;
  busy: boolean;
  locked: boolean;
  lockedMessage: string;
}) {
  const [state, setState] = useState<LinkState>(makeEmptyLinkState());

  const canGenerate =
    Boolean(accountId && accountId !== "—") && !busy && !state.loading && !locked;
  const hasCode = Boolean(state.code) && !locked;
  const hasLaunchUrl = Boolean(state.launchUrl) && !locked;

  async function handleGenerate() {
    if (locked) {
      setState((prev) => ({
        ...prev,
        error: lockedMessage,
        success: "",
      }));
      return;
    }

    if (!accountId || accountId === "—") {
      setState((prev) => ({
        ...prev,
        error: "Authenticated account reference is missing. Refresh the page and try again.",
        success: "",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: "",
      success: "",
    }));

    try {
      const res = await apiJson<LinkGenerateResponse>("/link/generate", {
        method: "POST",
        timeoutMs: 20000,
        useAuthToken: false,
        query: { provider },
        body: { provider },
      });

      if (!res?.ok || !res?.code) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: res?.error || `Could not generate a new ${title} link code.`,
          success: "",
        }));
        return;
      }

      const returnedProvider = safeText(res.provider || "", "").toLowerCase();
      if (returnedProvider && returnedProvider !== provider) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: `${title} generate returned wrong provider (${returnedProvider}).`,
          success: "",
        }));
        return;
      }

      const launchUrl = safeText(
        res?.deep_link ||
          res?.link_url ||
          res?.bot_url ||
          res?.whatsapp_url ||
          res?.telegram_url ||
          "",
        ""
      );

      setState({
        loading: false,
        error: "",
        success: `${title} code generated successfully.`,
        code: String(res.code || "").toUpperCase(),
        expiresInMinutes:
          typeof res.expires_in_minutes === "number" ? res.expires_in_minutes : null,
        expiresAt: safeText(res.expires_at || "", ""),
        generatedAt: Date.now(),
        launchUrl,
      });
    } catch (error: unknown) {
      const message = isApiError(error)
        ? error.message || `Request failed while generating ${title} link code.`
        : error instanceof Error
        ? error.message || `Request failed while generating ${title} link code.`
        : "Unexpected error while generating link code.";

      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        success: "",
      }));
    }
  }

  async function handleCopy() {
    if (!state.code || locked) return;

    try {
      await navigator.clipboard.writeText(state.code);
      setState((prev) => ({
        ...prev,
        success: `${title} code copied.`,
        error: "",
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        success: "",
        error: "Copy failed. Please copy the code manually.",
      }));
    }
  }

  function handleOpenLink() {
    if (!state.launchUrl || locked) return;
    window.open(state.launchUrl, "_blank", "noopener,noreferrer");
  }

  const sendInstruction = useMemo(() => {
    if (!state.code) return "";
    if (provider === "tg") {
      return `Send this code to the Telegram bot immediately: ${state.code}`;
    }
    return `Send this code to the WhatsApp channel immediately: ${state.code}`;
  }, [provider, state.code]);

  return (
    <div style={channelCardStyle()}>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 700 }}>
          {title}
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>
          Live link setup
        </div>
        <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>{description}</div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={itemStyle()}>
          <div style={itemLabelStyle()}>Current Link Code</div>
          <div
            style={{
              ...itemValueStyle(),
              fontSize: 28,
              letterSpacing: 3,
              wordBreak: "break-word",
              opacity: locked ? 0.6 : 1,
            }}
          >
            {state.code || "--------"}
          </div>
          <div style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: 14 }}>
            {state.code ? formatMinutesLabel(state.expiresInMinutes) : "No code generated yet."}
          </div>
          {sendInstruction ? (
            <div style={{ color: "var(--text)", lineHeight: 1.7, fontSize: 14 }}>
              {sendInstruction}
            </div>
          ) : null}
        </div>

        <div style={itemStyle()}>
          <div style={itemLabelStyle()}>Expires At</div>
          <div style={itemValueStyle()}>
            {state.expiresAt ? formatDate(state.expiresAt) : "Not shown"}
          </div>
        </div>
      </div>

      {locked ? (
        <div
          style={{
            borderRadius: 14,
            border: "1px solid #fed7aa",
            background: "#fff7ed",
            padding: 12,
            color: "#9a3412",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {lockedMessage}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            ...shellButtonPrimary(),
            opacity: canGenerate ? 1 : 0.55,
            cursor: canGenerate ? "pointer" : "not-allowed",
          }}
        >
          {state.loading ? "Generating..." : `Generate ${title} Code`}
        </button>

        <button
          onClick={handleCopy}
          disabled={!hasCode}
          style={{
            ...shellButtonSecondary(),
            opacity: hasCode ? 1 : 0.55,
            cursor: hasCode ? "pointer" : "not-allowed",
          }}
        >
          Copy Code
        </button>

        <button
          onClick={handleOpenLink}
          disabled={!hasLaunchUrl}
          style={{
            ...shellButtonSecondary(),
            opacity: hasLaunchUrl ? 1 : 0.55,
            cursor: hasLaunchUrl ? "pointer" : "not-allowed",
          }}
        >
          Open Link
        </button>
      </div>

      {state.success ? (
        <div
          style={{
            borderRadius: 14,
            border: "1px solid var(--success-border)",
            background: "var(--success-bg)",
            padding: 12,
            color: "var(--text)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {state.success}
        </div>
      ) : null}

      {state.error ? (
        <div
          style={{
            borderRadius: 14,
            border: "1px solid var(--danger-border)",
            background: "var(--danger-bg)",
            padding: 12,
            color: "var(--text)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {state.error}
        </div>
      ) : null}
    </div>
  );
}

function UnlinkButton({
  provider,
  title,
  onDone,
}: {
  provider: LinkProvider;
  title: string;
  onDone: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleUnlink() {
    if (!window.confirm(`Unlink ${title} from this website account?`)) return;
    setBusy(true);
    setMsg("");

    try {
      const res = await apiJson<LinkUnlinkResponse>("/link/unlink", {
        method: "POST",
        timeoutMs: 20000,
        useAuthToken: false,
        query: { provider },
        body: { provider },
      });

      if (res?.ok) {
        setMsg(res.unlinked ? `${title} unlinked successfully.` : `${title} is not currently linked.`);
        await onDone();
      } else {
        setMsg(res?.error || "Could not unlink right now.");
      }
    } catch (error: unknown) {
      setMsg(
        isApiError(error) ? error.message || "Could not unlink right now." : "Could not unlink right now."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button onClick={handleUnlink} disabled={busy} style={shellButtonSecondary()}>
        {busy ? `Unlinking ${title}...` : `Unlink ${title}`}
      </button>
      {msg ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{msg}</div> : null}
    </div>
  );
}

export default function ChannelsPage() {
  const { refreshSession } = useAuth();

  const { busy, load, accountId, activeNow, channelLinks } = useWorkspaceState({
    refreshSession,
    autoLoad: true,
    includeAccount: true,
    includeBilling: true,
    includeDebug: true,
    includeLinkStatus: true,
    loadingMessage: "Loading channel status...",
  });

  const [limitsData, setLimitsData] = useState<WorkspaceLimitsResponse | null>(null);
  const [limitsError, setLimitsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLimits() {
      try {
        setLimitsError("");
        const res = await apiJson<WorkspaceLimitsResponse>("/workspace/limits", {
          method: "GET",
          timeoutMs: 20000,
          useAuthToken: false,
        });
        if (!cancelled) setLimitsData(res);
      } catch (error) {
        if (cancelled) return;
        const message = isApiError(error)
          ? error.message || "Unable to load channel entitlements."
          : error instanceof Error
          ? error.message || "Unable to load channel entitlements."
          : "Unable to load channel entitlements.";
        setLimitsError(message);
      }
    }

    void loadLimits();
    return () => {
      cancelled = true;
    };
  }, []);

  const whatsappLinked = truthyValue(
    channelLinks?.whatsapp_linked || channelLinks?.whatsapp?.linked
  );
  const telegramLinked = truthyValue(
    channelLinks?.telegram_linked || channelLinks?.telegram?.linked
  );

  const whatsappVerified = truthyValue(
    channelLinks?.whatsapp_verified ||
      channelLinks?.whatsapp?.verified ||
      channelLinks?.whatsapp?.is_verified
  );
  const telegramVerified = truthyValue(
    channelLinks?.telegram_verified ||
      channelLinks?.telegram?.verified ||
      channelLinks?.telegram?.is_verified
  );

  const whatsappValue = safeText(
    channelLinks?.whatsapp?.value ||
      channelLinks?.whatsapp?.phone ||
      channelLinks?.whatsapp_number ||
      ""
  );

  const telegramValue = safeText(
    channelLinks?.telegram?.value ||
      channelLinks?.telegram?.username ||
      channelLinks?.telegram_username ||
      ""
  );

  const whatsappUpdatedAt = safeText(
    channelLinks?.whatsapp?.updated_at || channelLinks?.whatsapp_updated_at || "",
    ""
  );

  const telegramUpdatedAt = safeText(
    channelLinks?.telegram?.updated_at || channelLinks?.telegram_updated_at || "",
    ""
  );

  const planName = limitsData?.entitlements?.plan?.name || "Free";
  const planFamily =
    limitsData?.entitlements?.plan_family ||
    limitsData?.entitlements?.plan?.plan_family ||
    "free";

  const maxTotalChannels = safeNumber(
    limitsData?.entitlements?.channel_limits?.max_total_channels,
    0
  );
  const maxWhatsappChannels = safeNumber(
    limitsData?.entitlements?.channel_limits?.max_whatsapp_channels,
    0
  );
  const maxTelegramChannels = safeNumber(
    limitsData?.entitlements?.channel_limits?.max_telegram_channels,
    0
  );

  const usedTotalChannels = (whatsappLinked ? 1 : 0) + (telegramLinked ? 1 : 0);
  const totalChannelsRemaining =
    maxTotalChannels > 0 ? Math.max(maxTotalChannels - usedTotalChannels, 0) : 0;

  const whatsappUsed = whatsappLinked ? 1 : 0;
  const telegramUsed = telegramLinked ? 1 : 0;

  const whatsappRemaining =
    maxWhatsappChannels > 0 ? Math.max(maxWhatsappChannels - whatsappUsed, 0) : 0;
  const telegramRemaining =
    maxTelegramChannels > 0 ? Math.max(maxTelegramChannels - telegramUsed, 0) : 0;

  const channelsLockedOrFull = maxTotalChannels <= 0 || totalChannelsRemaining <= 0;

  const lockMessage =
    maxTotalChannels <= 0
      ? "Your current plan does not allow channel linking yet. Upgrade to unlock channel connection."
      : "All available channel slots are already in use. Unlink the currently connected channel or upgrade your plan before generating any new link code.";

  const topBanner = useMemo(() => {
    if (whatsappLinked && telegramLinked) {
      return {
        tone: "good" as const,
        title: "Your channels are connected",
        subtitle: "WhatsApp and Telegram are both visible in your workspace.",
      };
    }

    if (whatsappLinked || telegramLinked) {
      return {
        tone: "warn" as const,
        title: "One channel is connected",
        subtitle:
          "A supported messaging channel is already linked. Because your total channel capacity is now full, both link generators are locked until you unlink the current channel or upgrade your plan.",
      };
    }

    return {
      tone: "warn" as const,
      title: "No messaging channel is connected yet",
      subtitle:
        "Connect WhatsApp or Telegram so your workspace can work across supported channels.",
    };
  }, [whatsappLinked, telegramLinked]);

  return (
    <AppShell
      title="Channels"
      subtitle="Link, verify, and manage your supported communication channels in one simple place."
      actions={
        <button onClick={() => load("Refreshing channel status...")} style={shellButtonPrimary()}>
          Refresh Status
        </button>
      }
    >
      <SectionStack>
        {limitsError ? (
          <Banner
            tone="warn"
            title="Channel entitlement check needs attention"
            subtitle={limitsError}
          />
        ) : null}

        {channelsLockedOrFull ? (
          <div
            style={{
              borderRadius: 22,
              border: "1px solid #fed7aa",
              background: "linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%)",
              padding: 20,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ maxWidth: 820 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#9a3412" }}>
                Channel capacity is currently full
              </div>
              <div style={{ marginTop: 8, color: "#9a3412", lineHeight: 1.7 }}>
                You are using <strong>{usedTotalChannels}</strong> of{" "}
                <strong>{maxTotalChannels}</strong> allowed channel slot
                {maxTotalChannels === 1 ? "" : "s"} on the <strong>{planName}</strong>.
                Upgrade your plan to add more channels, or unlink an existing channel first.
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="/plans"
                style={{
                  border: "1px solid #fdba74",
                  borderRadius: 16,
                  padding: "12px 18px",
                  background: "#ea580c",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 22px rgba(234, 88, 12, 0.20)",
                }}
              >
                Upgrade to add more channels
              </a>

              <a href="/billing" style={shellButtonSecondary()}>
                Go to Billing
              </a>
            </div>
          </div>
        ) : null}

        <div style={summaryGridStyle()}>
          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>Plan</div>
            <div style={summaryValueStyle()}>{planName}</div>
            <div style={summarySubStyle()}>Family: {planFamily}</div>
          </div>

          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>Channel usage</div>
            <div style={summaryValueStyle()}>
              {usedTotalChannels} / {maxTotalChannels}
            </div>
            <div style={summarySubStyle()}>Total linked channels in use</div>
          </div>

          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>WhatsApp slots</div>
            <div style={summaryValueStyle()}>
              {whatsappUsed} / {maxWhatsappChannels}
            </div>
            <div style={summarySubStyle()}>
              {whatsappRemaining > 0 ? `${whatsappRemaining} slot left` : "No slot left"}
            </div>
          </div>

          <div style={summaryCardStyle()}>
            <div style={summaryLabelStyle()}>Telegram slots</div>
            <div style={summaryValueStyle()}>
              {telegramUsed} / {maxTelegramChannels}
            </div>
            <div style={summarySubStyle()}>
              {telegramRemaining > 0 ? `${telegramRemaining} slot left` : "No slot left"}
            </div>
          </div>
        </div>

        <Banner tone={topBanner.tone} title={topBanner.title} subtitle={topBanner.subtitle} />

        {!activeNow ? (
          <Banner
            tone="warn"
            title="Subscription attention needed"
            subtitle="Your account can still view channel status, but some actions may remain limited until subscription access is active."
          />
        ) : null}

        <CardsGrid min={320}>
          <div style={channelCardStyle()}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 700 }}>
                WhatsApp
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>
                {statusLabel(whatsappLinked, whatsappVerified)}
              </div>
              <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                {whatsappLinked
                  ? "This channel is visible in your workspace."
                  : "This channel is not yet linked to your workspace."}
              </div>
            </div>

            <div style={itemStyle()}>
              <div style={itemLabelStyle()}>Status</div>
              <div style={itemValueStyle()}>{statusLabel(whatsappLinked, whatsappVerified)}</div>
            </div>

            <div style={itemStyle()}>
              <div style={itemLabelStyle()}>Verification</div>
              <div style={itemValueStyle()}>{verificationLabel(whatsappVerified)}</div>
            </div>

            <div style={itemStyle()}>
              <div style={itemLabelStyle()}>Linked Number</div>
              <div style={itemValueStyle()}>{whatsappValue}</div>
            </div>

            <div style={{ display: "grid", gap: 4 }}>
              <div style={itemLabelStyle()}>Last Updated</div>
              <div style={itemValueStyle()}>
                {whatsappUpdatedAt ? formatDate(whatsappUpdatedAt) : "Not shown"}
              </div>
            </div>

            <UnlinkButton
              provider="wa"
              title="WhatsApp"
              onDone={() => load("Refreshing channel status...")}
            />
          </div>

          <div style={channelCardStyle()}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 700 }}>
                Telegram
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>
                {statusLabel(telegramLinked, telegramVerified)}
              </div>
              <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                {telegramLinked
                  ? "This channel is visible in your workspace."
                  : "This channel is not yet linked to your workspace."}
              </div>
            </div>

            <div style={itemStyle()}>
              <div style={itemLabelStyle()}>Status</div>
              <div style={itemValueStyle()}>{statusLabel(telegramLinked, telegramVerified)}</div>
            </div>

            <div style={itemStyle()}>
              <div style={itemLabelStyle()}>Verification</div>
              <div style={itemValueStyle()}>{verificationLabel(telegramVerified)}</div>
            </div>

            <div style={itemStyle()}>
              <div style={itemLabelStyle()}>Linked Username</div>
              <div style={itemValueStyle()}>{telegramValue}</div>
            </div>

            <div style={{ display: "grid", gap: 4 }}>
              <div style={itemLabelStyle()}>Last Updated</div>
              <div style={itemValueStyle()}>
                {telegramUpdatedAt ? formatDate(telegramUpdatedAt) : "Not shown"}
              </div>
            </div>

            <UnlinkButton
              provider="tg"
              title="Telegram"
              onDone={() => load("Refreshing channel status...")}
            />
          </div>
        </CardsGrid>

        <CardsGrid min={360}>
          <LinkCodePanel
            provider="wa"
            title="WhatsApp"
            description="Generate a temporary WhatsApp linking code for this logged-in workspace, then send that code into the connected WhatsApp channel."
            accountId={accountId}
            busy={busy}
            locked={channelsLockedOrFull}
            lockedMessage={lockMessage}
          />

          <LinkCodePanel
            provider="tg"
            title="Telegram"
            description="Generate a temporary Telegram linking code for this logged-in workspace, then send that code to the Telegram bot immediately."
            accountId={accountId}
            busy={busy}
            locked={channelsLockedOrFull}
            lockedMessage={lockMessage}
          />
        </CardsGrid>

        <WorkspaceSectionCard
          title="How it works"
          subtitle="Use this page only for checking status and completing channel linking."
        >
          <div
            style={{
              display: "grid",
              gap: 10,
              color: "var(--text-muted)",
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            <div>1. Review your current channel entitlement and available slots above.</div>
            <div>2. Generate a fresh code for the channel you want to connect.</div>
            <div>3. Copy the code or open the channel link directly.</div>
            <div>4. Complete the step on the actual messaging platform.</div>
            <div>5. Return here and refresh the status when needed.</div>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
