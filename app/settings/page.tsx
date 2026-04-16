"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, MetricCard } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { useAuth } from "@/lib/auth";
import { useSharedTheme, type ThemeMode } from "@/lib/theme";

type ChannelMode = "ask_before_link" | "auto_open_link_flow" | "manual_only";
type SupportMode = "in_app_first" | "email_when_needed" | "phone_for_general_only";

type SettingsState = {
  displayName: string;
  themeMode: ThemeMode;
  emailNotifications: boolean;
  supportUpdates: boolean;
  billingReminders: boolean;
  channelMode: ChannelMode;
  supportMode: SupportMode;
};

const SETTINGS_STORAGE_KEY = "ntg_workspace_settings_v2";

function safeText(value: unknown, fallback = "—"): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
      ? ""
      : String(value).trim();
  return text || fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return ["1", "true", "yes", "enabled", "active", "linked"].includes(raw);
  }
  return false;
}

function defaultSettings(displayName: string, themeMode: ThemeMode): SettingsState {
  return {
    displayName,
    themeMode,
    emailNotifications: true,
    supportUpdates: true,
    billingReminders: true,
    channelMode: "ask_before_link",
    supportMode: "in_app_first",
  };
}

function readStoredSettings(displayName: string, themeMode: ThemeMode): SettingsState {
  if (typeof window === "undefined") {
    return defaultSettings(displayName, themeMode);
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings(displayName, themeMode);

    const parsed = JSON.parse(raw) as Partial<SettingsState>;

    return {
      ...defaultSettings(displayName, themeMode),
      ...parsed,
      displayName: safeText(parsed.displayName, displayName),
      themeMode:
        parsed.themeMode === "dark" ||
        parsed.themeMode === "light" ||
        parsed.themeMode === "system"
          ? parsed.themeMode
          : themeMode,
    };
  } catch {
    return defaultSettings(displayName, themeMode);
  }
}

function saveSettings(payload: SettingsState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
}

function boxStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 20,
    background: "var(--surface)",
    padding: 18,
    display: "grid",
    gap: 10,
    minWidth: 0,
  };
}

function fieldLabelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 900,
    color: "var(--text-muted)",
    letterSpacing: 0.2,
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
    color: "var(--text)",
    padding: "12px 16px",
    fontSize: 16,
    outline: "none",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
    color: "var(--text)",
    padding: "12px 16px",
    fontSize: 16,
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  };
}

function themeOptionStyle(active: boolean): React.CSSProperties {
  return {
    minHeight: 48,
    width: "100%",
    padding: "0 16px",
    borderRadius: 16,
    border: active
      ? "1px solid var(--accent-border)"
      : "1px solid var(--border)",
    background: active ? "var(--accent-soft)" : "var(--surface-soft)",
    color: "var(--text)",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
}

function toggleCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 20,
    background: "var(--surface)",
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
    minWidth: 0,
  };
}

function toggleButtonStyle(active: boolean): React.CSSProperties {
  return {
    minWidth: 120,
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 999,
    border: active
      ? "1px solid rgba(99,102,241,0.35)"
      : "1px solid var(--border)",
    background: active
      ? "linear-gradient(180deg, rgba(99,102,241,0.96), rgba(79,70,229,0.92))"
      : "var(--surface-soft)",
    color: active ? "#ffffff" : "var(--text)",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: active ? "0 8px 20px rgba(79,70,229,0.18)" : "none",
    maxWidth: "100%",
  };
}

function actionButtonStyle(
  baseStyle: React.CSSProperties,
  disabled: boolean
): React.CSSProperties {
  if (!disabled) {
    return {
      ...baseStyle,
      cursor: "pointer",
      opacity: 1,
      width: "100%",
      justifyContent: "center",
    };
  }

  return {
    ...baseStyle,
    cursor: "not-allowed",
    opacity: 1,
    width: "100%",
    justifyContent: "center",
    background: "#e5e7eb",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    boxShadow: "none",
    filter: "grayscale(0.12)",
    transform: "none",
  };
}

function responsiveSplitGrid(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: 18,
    alignItems: "start",
  };
}

function actionGrid(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
    gap: 12,
    width: "100%",
  };
}

function compactTextStyle(): React.CSSProperties {
  return {
    color: "var(--text-muted)",
    lineHeight: 1.7,
    fontSize: 14,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };
}

function valueBlockStyle(): React.CSSProperties {
  return {
    color: "var(--text)",
    lineHeight: 1.85,
    fontSize: 15,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { themeMode, resolvedMode, setThemeMode } = useSharedTheme();
  const { profile, subscription, billing, channelLinks, credits } = useWorkspaceState();

  const profileData = (profile ?? {}) as Record<string, unknown>;
  const subscriptionData = (subscription ?? {}) as Record<string, unknown>;
  const billingData = (billing ?? {}) as Record<string, unknown>;
  const channelLinksData = (channelLinks ?? {}) as Record<string, unknown>;
  const creditsData = (credits ?? {}) as Record<string, unknown>;

  const visibleName = safeText(
    profileData.full_name || profileData.display_name || profileData.first_name || "Workspace user"
  );

  const visibleEmail = safeText(
    profileData.email || billingData.checkout_email || user?.email || "Not visible"
  );

  const rawPlanName = safeText(
    subscriptionData.plan_name ||
      billingData.plan_name ||
      subscriptionData.plan_code ||
      billingData.plan_code ||
      "",
    ""
  );

  const rawPlanStatus = safeText(subscriptionData.status || billingData.status || "", "");

  const normalizedPlanName = rawPlanName.toLowerCase();
  const normalizedPlanStatus = rawPlanStatus.toLowerCase();

  const isFreeContext =
    normalizedPlanName === "free" ||
    normalizedPlanStatus === "free" ||
    rawPlanName === "" ||
    rawPlanName.toLowerCase() === "no active plan";

  const planName = isFreeContext ? "Free plan" : rawPlanName;
  const planStatus = isFreeContext ? "Available" : rawPlanStatus || "Active";

  const whatsappLinked = truthyValue(
    channelLinksData.whatsapp_linked ||
      (channelLinksData.whatsapp as Record<string, unknown> | undefined)?.linked
  );

  const telegramLinked = truthyValue(
    channelLinksData.telegram_linked ||
      (channelLinksData.telegram as Record<string, unknown> | undefined)?.linked
  );

  const channelState =
    whatsappLinked && telegramLinked
      ? "All linked"
      : whatsappLinked || telegramLinked
      ? "Partially linked"
      : "No linked channel";

  const currentCredits = safeNumber(creditsData.balance, 0);

  const [settings, setSettings] = useState<SettingsState>(
    defaultSettings(visibleName, themeMode)
  );
  const [lastSavedSettings, setLastSavedSettings] = useState<SettingsState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const hasLoadedFromStorage = useRef(false);

  useEffect(() => {
    if (hasLoadedFromStorage.current) return;

    const next = readStoredSettings(visibleName, themeMode);
    setSettings(next);
    setLastSavedSettings(next);
    setThemeMode(next.themeMode);
    setLoaded(true);
    hasLoadedFromStorage.current = true;
  }, [visibleName, themeMode, setThemeMode]);

  const themeSummary = useMemo(() => {
    if (settings.themeMode === "system") {
      return resolvedMode === "light" ? "System default (light now)" : "System default (dark now)";
    }
    return settings.themeMode === "light" ? "Light mode" : "Dark mode";
  }, [settings.themeMode, resolvedMode]);

  const remindersSummary = useMemo(() => {
    const items = [
      settings.emailNotifications ? "Email" : null,
      settings.supportUpdates ? "Support" : null,
      settings.billingReminders ? "Billing" : null,
    ].filter(Boolean);

    return items.length ? items.join(", ") : "All disabled";
  }, [settings.emailNotifications, settings.supportUpdates, settings.billingReminders]);

  const hasChanges = useMemo(() => {
    if (!lastSavedSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(lastSavedSettings);
  }, [settings, lastSavedSettings]);

  function updateField<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavedNotice("");
    setErrorNotice("");
  }

  function updateTheme(nextMode: ThemeMode) {
    updateField("themeMode", nextMode);
    setThemeMode(nextMode);
  }

  function onSave() {
    try {
      const payload: SettingsState = {
        ...settings,
        displayName: safeText(settings.displayName, visibleName),
      };

      saveSettings(payload);
      setThemeMode(payload.themeMode);
      setSettings(payload);
      setLastSavedSettings(payload);
      setSavedNotice(
        "Settings saved successfully. Theme and reminder preferences are now updated for this browser."
      );
      setErrorNotice("");
    } catch {
      setSavedNotice("");
      setErrorNotice("Could not save settings in this browser right now.");
    }
  }

  function onReset() {
    try {
      const next = defaultSettings(visibleName, "system");
      saveSettings(next);
      setSettings(next);
      setLastSavedSettings(next);
      setThemeMode(next.themeMode);
      setSavedNotice("Settings reset to default values.");
      setErrorNotice("");
    } catch {
      setSavedNotice("");
      setErrorNotice("Could not reset settings right now.");
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  if (!loaded) {
    return (
      <AppShell
        title="Settings"
        subtitle="Adjust your visible workspace preferences such as profile details, appearance mode, default channel behavior, and communication settings."
      >
        <SectionStack>
          <Banner tone="default" title="Loading settings" subtitle="Please wait..." />
        </SectionStack>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Settings"
      subtitle="Adjust your visible workspace preferences such as profile details, appearance mode, default channel behavior, and communication settings."
      actions={
        <div style={actionGrid()}>
          <button
            type="button"
            onClick={onSave}
            disabled={!hasChanges}
            aria-disabled={!hasChanges}
            style={actionButtonStyle(shellButtonPrimary(), !hasChanges)}
          >
            Save Changes
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={!hasChanges}
            aria-disabled={!hasChanges}
            style={actionButtonStyle(shellButtonSecondary(), !hasChanges)}
          >
            Reset Defaults
          </button>
        </div>
      }
    >
      <SectionStack>
        {savedNotice ? (
          <Banner tone="good" title="Settings updated" subtitle={savedNotice} />
        ) : null}

        {errorNotice ? (
          <Banner tone="danger" title="Settings issue" subtitle={errorNotice} />
        ) : null}

        <WorkspaceSectionCard
          title="Workspace settings"
          subtitle="Use this page for real preferences and interface behavior, not for billing or account diagnostics."
        >
          <CardsGrid min={220}>
            <MetricCard
              label="Visible Name"
              value={settings.displayName || visibleName}
              helper="Name currently shown for this workspace in this browser."
            />
            <MetricCard
              label="Theme Preference"
              value={themeSummary}
              helper="Current interface appearance preference."
            />
            <MetricCard
              label="Plan Context"
              value={planName}
              helper={`Status: ${planStatus}`}
            />
            <MetricCard
              label="Linked Channels"
              value={channelState}
              helper="Visible channel state used to guide settings decisions."
            />
          </CardsGrid>
        </WorkspaceSectionCard>

        <div style={responsiveSplitGrid()}>
          <WorkspaceSectionCard
            title="Profile and appearance"
            subtitle="Keep your visible identity and display behavior clean and predictable."
          >
            <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
              <div style={boxStyle()}>
                <label htmlFor="display-name" style={fieldLabelStyle()}>
                  Workspace Display Name
                </label>
                <input
                  id="display-name"
                  value={settings.displayName}
                  onChange={(event) => updateField("displayName", event.target.value)}
                  placeholder="Workspace display name"
                  style={inputStyle()}
                />
                <div style={compactTextStyle()}>
                  This helps the workspace feel personal without changing backend account identity.
                </div>
              </div>

              <div style={boxStyle()}>
                <div style={fieldLabelStyle()}>Appearance Mode</div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => updateTheme("dark")}
                    style={themeOptionStyle(settings.themeMode === "dark")}
                  >
                    Dark mode
                  </button>

                  <button
                    type="button"
                    onClick={() => updateTheme("light")}
                    style={themeOptionStyle(settings.themeMode === "light")}
                  >
                    Light mode
                  </button>

                  <button
                    type="button"
                    onClick={() => updateTheme("system")}
                    style={themeOptionStyle(settings.themeMode === "system")}
                  >
                    System default
                  </button>
                </div>

                <div style={compactTextStyle()}>
                  These buttons replace the unstable dropdown so all modes remain selectable.
                </div>
              </div>

              <div style={boxStyle()}>
                <div style={fieldLabelStyle()}>Visible Account Snapshot</div>
                <div style={valueBlockStyle()}>
                  <div>Email: {visibleEmail}</div>
                  <div>Current Plan: {planName}</div>
                  <div>Visible Credits: {currentCredits}</div>
                </div>
              </div>
            </div>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Channel and support behavior"
            subtitle="Set how this workspace should behave when support or linking actions are needed."
          >
            <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
              <div style={boxStyle()}>
                <label htmlFor="channel-mode" style={fieldLabelStyle()}>
                  Channel Linking Preference
                </label>
                <select
                  id="channel-mode"
                  value={settings.channelMode}
                  onChange={(event) =>
                    updateField("channelMode", event.target.value as ChannelMode)
                  }
                  style={selectStyle()}
                >
                  <option value="ask_before_link">Ask before opening link flow</option>
                  <option value="auto_open_link_flow">Open link flow directly</option>
                  <option value="manual_only">Manual review first</option>
                </select>
                <div style={compactTextStyle()}>
                  Best for users who want predictable channel setup behavior.
                </div>
              </div>

              <div style={boxStyle()}>
                <label htmlFor="support-mode" style={fieldLabelStyle()}>
                  Preferred Support Route
                </label>
                <select
                  id="support-mode"
                  value={settings.supportMode}
                  onChange={(event) =>
                    updateField("supportMode", event.target.value as SupportMode)
                  }
                  style={selectStyle()}
                >
                  <option value="in_app_first">Use in-app support first</option>
                  <option value="email_when_needed">Use email only when necessary</option>
                  <option value="phone_for_general_only">Phone for general contact only</option>
                </select>
                <div style={compactTextStyle()}>
                  This preference guides the visible route you are most likely to use.
                </div>
              </div>

              <div style={boxStyle()}>
                <div style={fieldLabelStyle()}>Current Channel State</div>
                <div style={valueBlockStyle()}>
                  <div>WhatsApp: {whatsappLinked ? "Linked" : "Not linked"}</div>
                  <div>Telegram: {telegramLinked ? "Linked" : "Not linked"}</div>
                </div>
              </div>
            </div>
          </WorkspaceSectionCard>
        </div>

        <WorkspaceSectionCard
          title="Notifications and reminders"
          subtitle="Decide which visible reminders should stay active in your workflow."
        >
          <CardsGrid min={220}>
            <MetricCard
              label="Reminder Summary"
              value={remindersSummary}
              helper="Currently enabled reminders in this browser."
            />
            <MetricCard
              label="Email Notifications"
              value={settings.emailNotifications ? "Enabled" : "Disabled"}
              helper="General visible communication prompts."
            />
            <MetricCard
              label="Support Updates"
              value={settings.supportUpdates ? "Enabled" : "Disabled"}
              helper="Support follow-up reminder visibility."
            />
            <MetricCard
              label="Billing Reminders"
              value={settings.billingReminders ? "Enabled" : "Disabled"}
              helper="Renewal and billing reminder visibility."
            />
          </CardsGrid>

          <div style={{ display: "grid", gap: 12, marginTop: 16, minWidth: 0 }}>
            <div style={toggleCardStyle()}>
              <div style={{ display: "grid", gap: 4, flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "var(--text)", fontSize: 16 }}>
                  Email notifications
                </div>
                <div style={compactTextStyle()}>
                  General browser-saved preference for receiving visible communication prompts.
                </div>
              </div>

              <button
                type="button"
                onClick={() => updateField("emailNotifications", !settings.emailNotifications)}
                style={toggleButtonStyle(settings.emailNotifications)}
              >
                {settings.emailNotifications ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div style={toggleCardStyle()}>
              <div style={{ display: "grid", gap: 4, flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "var(--text)", fontSize: 16 }}>
                  Support update reminders
                </div>
                <div style={compactTextStyle()}>
                  Keep in-app support follow-up reminders visible when tickets need attention.
                </div>
              </div>

              <button
                type="button"
                onClick={() => updateField("supportUpdates", !settings.supportUpdates)}
                style={toggleButtonStyle(settings.supportUpdates)}
              >
                {settings.supportUpdates ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div style={toggleCardStyle()}>
              <div style={{ display: "grid", gap: 4, flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "var(--text)", fontSize: 16 }}>
                  Billing reminders
                </div>
                <div style={compactTextStyle()}>
                  Show renewal and billing follow-up preference in this browser.
                </div>
              </div>

              <button
                type="button"
                onClick={() => updateField("billingReminders", !settings.billingReminders)}
                style={toggleButtonStyle(settings.billingReminders)}
              >
                {settings.billingReminders ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Account actions"
          subtitle="Use these actions when you want to navigate safely or leave the workspace."
        >
          <div style={actionGrid()}>
            <button
              type="button"
              onClick={() => router.push("/workspace")}
              style={{ ...shellButtonSecondary(), width: "100%", justifyContent: "center" }}
            >
              Open Workspace
            </button>

            <button
              type="button"
              onClick={() => router.push("/support")}
              style={{ ...shellButtonSecondary(), width: "100%", justifyContent: "center" }}
            >
              Open Support
            </button>

            <button
              type="button"
              onClick={() => router.push("/channels")}
              style={{ ...shellButtonSecondary(), width: "100%", justifyContent: "center" }}
            >
              Open Channels
            </button>

            <button
              type="button"
              onClick={onLogout}
              style={{ ...shellButtonPrimary(), width: "100%", justifyContent: "center" }}
            >
              Logout
            </button>
          </div>

          <div
            style={{
              marginTop: 16,
              color: "var(--text-muted)",
              lineHeight: 1.8,
              fontSize: 15,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            Use Settings to manage profile details, appearance mode, preferred channel behavior,
            and communication preferences. For subscription status, plan expiry, payment issues,
            credits, or channel linking, use the proper dedicated pages instead of relying on
            Settings.
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
