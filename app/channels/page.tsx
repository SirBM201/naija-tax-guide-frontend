"use client";

import React, { useMemo, useState } from "react";
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

async function postDirectJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
        ? ((data as { error?: string }).error as string)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return (data ?? {}) as T;
}

function LinkCodePanel({
  provider,
  title,
  description,
  accountId,
  busy,
}: {
  provider: LinkProvider;
  title: string;
  description: string;
  accountId: string;
  busy: boolean;
}) {
  const [state, setState] = useState<LinkState>(makeEmptyLinkState());

  const canGenerate = Boolean(accountId && accountId !== "—") && !busy && !state.loading;
  const hasCode = Boolean(state.code);
  const hasLaunchUrl = Boolean(state.launchUrl);

  async function handleGenerate() {
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
      const res = await postDirectJson<LinkGenerateResponse>(
        `/api/link/generate?provider=${encodeURIComponent(provider)}`,
        { provider }
      );

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
      const message =
        error instanceof Error
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
    if (!state.code) return;

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
    if (!state.launchUrl) return;
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
        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)" }}>
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

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            ...shellButtonPrimary(),
            opacity: canGenerate ? 1 : 0.6,
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
      const res = await postDirectJson<LinkUnlinkResponse>(
        `/api/link/unlink?provider=${encodeURIComponent(provider)}`,
        { provider }
      );

      if (res?.ok) {
        setMsg(res.unlinked ? `${title} unlinked successfully.` : `${title} is not currently linked.`);
        await onDone();
      } else {
        setMsg(res?.error || "Could not unlink right now.");
      }
    } catch (error: unknown) {
      setMsg(
        error instanceof Error
          ? error.message || "Could not unlink right now."
          : "Could not unlink right now."
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
    loadingMessage: "Loading channel status...",
  });

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
        title: "One channel still needs attention",
        subtitle:
          "At least one supported messaging channel is connected, but another one is still not ready.",
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
          />

          <LinkCodePanel
            provider="tg"
            title="Telegram"
            description="Generate a temporary Telegram linking code for this logged-in workspace, then send that code to the Telegram bot immediately."
            accountId={accountId}
            busy={busy}
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
            <div>1. Generate a fresh code for the channel you want to connect.</div>
            <div>2. Copy the code or open the channel link directly.</div>
            <div>3. Complete the step on the actual messaging platform.</div>
            <div>4. Return here and refresh the status when needed.</div>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
