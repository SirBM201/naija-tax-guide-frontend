import { STORAGE_KEYS } from "@/lib/storage-keys";
import {
  storageGet,
  storageGetBool,
  storageSet,
  storageSetBool,
} from "@/lib/local-storage";

export type ThemeMode = "dark" | "light" | "system";
export type AnswerStyle = "Balanced" | "Concise" | "Detailed" | "Beginner-Friendly";
export type PreferredLanguage = "English" | "Pidgin" | "Yoruba" | "Hausa" | "Igbo";

export type WorkspacePreferences = {
  preferredLanguage: PreferredLanguage;
  answerStyle: AnswerStyle;
  emailNotifications: boolean;
  usageAlerts: boolean;
};

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  preferredLanguage: "English",
  answerStyle: "Balanced",
  emailNotifications: true,
  usageAlerts: true,
};

export function getWelcomeSeen(): boolean {
  return storageGetBool(STORAGE_KEYS.welcomeSeen, false);
}

export function setWelcomeSeen(value: boolean) {
  storageSetBool(STORAGE_KEYS.welcomeSeen, value);
}

export function getPreferredLanguage(): PreferredLanguage {
  const value = storageGet(STORAGE_KEYS.preferredLanguage);
  if (
    value === "English" ||
    value === "Pidgin" ||
    value === "Yoruba" ||
    value === "Hausa" ||
    value === "Igbo"
  ) {
    return value;
  }
  return DEFAULT_WORKSPACE_PREFERENCES.preferredLanguage;
}

export function setPreferredLanguage(value: PreferredLanguage) {
  storageSet(STORAGE_KEYS.preferredLanguage, value);
}

export function getAnswerStyle(): AnswerStyle {
  const value = storageGet(STORAGE_KEYS.answerStyle);
  if (
    value === "Balanced" ||
    value === "Concise" ||
    value === "Detailed" ||
    value === "Beginner-Friendly"
  ) {
    return value;
  }
  return DEFAULT_WORKSPACE_PREFERENCES.answerStyle;
}

export function setAnswerStyle(value: AnswerStyle) {
  storageSet(STORAGE_KEYS.answerStyle, value);
}

export function getEmailNotificationsEnabled(): boolean {
  return storageGetBool(
    STORAGE_KEYS.emailNotifications,
    DEFAULT_WORKSPACE_PREFERENCES.emailNotifications
  );
}

export function setEmailNotificationsEnabled(value: boolean) {
  storageSetBool(STORAGE_KEYS.emailNotifications, value);
}

export function getUsageAlertsEnabled(): boolean {
  return storageGetBool(
    STORAGE_KEYS.usageAlerts,
    DEFAULT_WORKSPACE_PREFERENCES.usageAlerts
  );
}

export function setUsageAlertsEnabled(value: boolean) {
  storageSetBool(STORAGE_KEYS.usageAlerts, value);
}

export function getWorkspacePreferences(): WorkspacePreferences {
  return {
    preferredLanguage: getPreferredLanguage(),
    answerStyle: getAnswerStyle(),
    emailNotifications: getEmailNotificationsEnabled(),
    usageAlerts: getUsageAlertsEnabled(),
  };
}

export function saveWorkspacePreferences(values: WorkspacePreferences) {
  setPreferredLanguage(values.preferredLanguage);
  setAnswerStyle(values.answerStyle);
  setEmailNotificationsEnabled(values.emailNotifications);
  setUsageAlertsEnabled(values.usageAlerts);
}