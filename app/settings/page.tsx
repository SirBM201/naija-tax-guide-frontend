"use client";

import React, { useEffect, useMemo, useState } from "react";
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

type ThemeMode = "dark" | "light" | "system";
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

const SETTINGS_STORAGE_KEY = "ntg_workspace_settings_v1";

function safeText(value: unknown, fallback = "—"): string {
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
    return ["1", "true", "yes", "enabled", "active", "linked"].includes(raw);
  }
  return false;
}

function boxStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 16,
    display: "grid",
    gap: 8,
  };
}

function fieldLabelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text-muted)",
    letterSpacing: 0.2,
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 50,
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.03)",
    color: "var(--text)",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 50,
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.03)",
    color: "var(--text)",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
  };
}

function toggleRowStyle(): React.CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 14,
    background: "rgba(255,255,255,0.02)",
  };
}

function toggleStyle(active: boolean): React.CSSProperties {
  return {
    minWidth: 74,
    minHeight: 40,
    borderRadius: 999,
    border: active
      ? "1px solid rgba(99,102,241,0.42)"
      : "1px solid rgba(255,255,255,0.12)",
    background: active
      ? "linear-gradient(180deg, rgba(99,102,241,0.96), rgba(79,70,229,0.92))"
      : "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  };
}

function defaultSettings(displayName: string): SettingsState {
  return {
    displayName,
    themeMode: "dark",
    emailNotifications: true,
    supportUpdates: true,
    billingReminders: true,
    channelMode: "ask_before_link",
    supportMode: "in_app_first",
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { profile, subscription, billing, channelLinks, credits } = useWorkspaceState();

  const visibleName = safeText(
    profile?.full_name || profile?.display_name || profile?.first_name || "Workspace user"
  );
  const visibleEmail = safeText(profile?.email || billing?.checkout_email || "Not visible");
  const planName = safeText(
    subscription?.plan_name || billing?.plan_name || subscription?.plan_code || "No active plan"
  );
  const planStatus = safeText(subscription?.status || billing?.status || "Unknown");
  const whatsappLinked = truthyValue(
    channelLinks?.whatsapp_linked || channelLinks?.whatsapp?.linked
  );
  const telegramLinked = truthyValue(
    channelLinks?.telegram_linked || channelLinks?.telegram?.linked
  );
  const channelState =
    whatsappLinked && telegramLinked
      ? "WhatsApp + Telegram linked"
      : whatsappLinked
      ? "WhatsApp linked"
      : telegramLinked
      ? "Telegram linked"
      : "No linked channel";

  const [settings, setSettings] = useState<SettingsState>(defaultSettings(visibleName));
  const [savedNotice, setSavedNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        setSettings({
          ...defaultSettings(visibleName),
          ...parsed,
          displayName: parsed.displayName?.trim() || visibleName,
        });
      } else {
        setSettings(defaultSettings(visibleName));
      }
    } catch {
      setSettings(defaultSettings(visibleName));
    } finally {
      setLoaded(true);
    }
  }, [visibleName]);

  const summaryTheme = useMemo(() => {
    if (settings.themeMode === "system") return "System controlled";
    if (settings.themeMode === "light") return "Light mode";
    return "Dark mode";
  }, [settings.themeMode]);

  function setField<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavedNotice("");
    setErrorNotice("");
  }

  function handleSave() {
    try {
      const payload: SettingsState = {
        ...settings,
        displayName: settings.displayName.trim() || visibleName,
      };

      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      setSettings(payload);
      setSavedNotice("Settings saved successfully. Your visible workspace preferences have been updated in this browser.");
      setErrorNotice("");
    } catch {
      setSavedNotice("");
      setErrorNotice("We could not save your settings in this browser right now.");
    }
  }

  function handleReset() {
    const reset = defaultSettings(visibleName);
    setSettings(reset);

    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(reset));
      setSavedNotice("Settings reset to default values.");
      setErrorNotice("");
    } catch {
      setSavedNotice("");
      setErrorNotice("We could not reset settings storage cleanly.");
    }
  }

  async function handleLogout() {
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
        <>
          <button onClick={handleSave} style={shellButtonPrimary()}>
            Save Changes
          </button>
          <button onClick={handleReset} style={shellButtonSecondary()}>
            Reset Defaults
          </button>
        </>
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
              value={summaryTheme}
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <WorkspaceSectionCard
            title="Profile and appearance"
            subtitle="Keep your visible identity and display behavior clean and predictable."
          >
            <div style={{ display: "grid", gap: 14 }}>
              <div style={boxStyle()}>
                <label htmlFor="display-name" style={fieldLabelStyle()}>
                  Workspace Display Name
                </label>
                <input
                  id="display-name"
                  value={settings.displayName}
                  onChange={(event) => setField("displayName", event.target.value)}
                  placeholder="Workspace display name"
                  style={inputStyle()}
                />
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: 14 }}>
                  This helps the workspace feel personal without changing backend account identity.
                </div>
              </div>

              <div style={boxStyle()}>
                <label htmlFor="theme-mode" style={fieldLabelStyle()}>
                  Appearance Mode
                </label>
                <select
                  id="theme-mode"
                  value={settings.themeMode}
                  onChange={(event) =>
                    setField("themeMode", event.target.value as ThemeMode)
                  }
                  style={selectStyle()}
                >
                  <option value="dark">Dark mode</option>
                  <option value="light">Light mode</option>
                  <option value="system">System default</option>
                </select>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: 14 }}>
                  Choose how the workspace should look in this browser session pattern.
                </div>
              </div>

              <div style={boxStyle()}>
                <div style={fieldLabelStyle()}>Visible Account Snapshot</div>
                <div style={{ color: "var(--text)", lineHeight: 1.8 }}>
                  <div>Email: {visibleEmail}</div>
                  <div>Current Plan: {planName}</div>
                  <div>Visible Credits: {Number(credits?.balance ?? 0)}</div>
                </div>
              </div>
            </div>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Channel and support behavior"
            subtitle="Set how this workspace should behave when support or linking actions are needed."
          >
            <div style={{ display: "grid", gap: 14 }}>
              <div style={boxStyle()}>
                <label htmlFor="channel-mode" style={fieldLabelStyle()}>
                  Channel Linking Preference
                </label>
                <select
                  id="channel-mode"
                  value={settings.channelMode}
                  onChange={(event) =>
                    setField("channelMode", event.target.value as ChannelMode)
                  }
                  style={selectStyle()}
                >
                  <option value="ask_before_link">Ask before opening link flow</option>
                  <option value="auto_open_link_flow">Open link flow directly</option>
                  <option value="manual_only">Manual review first</option>
                </select>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: 14 }}>
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
                    setField("supportMode", event.target.value as SupportMode)
                  }
                  style={selectStyle()}
                >
                  <option value="in_app_first">Use in-app support first</option>
                  <option value="email_when_needed">Use email only when necessary</option>
                  <option value="phone_for_general_only">Phone for general contact only</option>
                </select>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: 14 }}>
                  This preference guides the visible route you are most likely to use.
                </div>
              </div>

              <div style={boxStyle()}>
                <div style={fieldLabelStyle()}>Current Channel State</div>
                <div style={{ color: "var(--text)", lineHeight: 1.8 }}>
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
          <div style={{ display: "grid", gap: 12 }}>
            <div style={toggleRowStyle()}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 900, color: "var(--text)" }}>
                  Email notifications
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
                  General browser-saved preference for receiving visible communication prompts.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setField("emailNotifications", !settings.emailNotifications)
                }
                style={toggleStyle(settings.emailNotifications)}
              >
                {settings.emailNotifications ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div style={toggleRowStyle()}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 900, color: "var(--text)" }}>
                  Support update reminders
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
                  Keep in-app support follow-up reminders visible when tickets need attention.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setField("supportUpdates", !settings.supportUpdates)}
                style={toggleStyle(settings.supportUpdates)}
              >
                {settings.supportUpdates ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div style={toggleRowStyle()}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 900, color: "var(--text)" }}>
                  Billing reminders
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
                  Show renewal and billing follow-up preference in this browser.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setField("billingReminders", !settings.billingReminders)}
                style={toggleStyle(settings.billingReminders)}
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
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => router.push("/profile")} style={shellButtonSecondary()}>
              Open Profile
            </button>
            <button onClick={() => router.push("/support")} style={shellButtonSecondary()}>
              Open Support
            </button>
            <button onClick={() => router.push("/channels")} style={shellButtonSecondary()}>
              Open Channels
            </button>
            <button onClick={handleLogout} style={shellButtonPrimary()}>
              Logout
            </button>
          </div>

          <div
            style={{
              marginTop: 16,
              color: "var(--text-muted)",
              lineHeight: 1.8,
              fontSize: 15,
            }}
          >
            Use Settings to manage profile details, appearance mode, preferred channel behavior,
            answer style, and communication preferences. For subscription status, plan expiry,
            payment issues, credits, or channel linking, use the proper dedicated pages instead of
            relying on Settings.
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}