"use client";

import React, { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __ntgInstallPrompt?: BeforeInstallPromptEvent | null;
    __ntgServiceWorkerReady?: boolean;
  }
}

type InstallButtonsProps = {
  appHref?: string;
  showInstructions?: boolean;
};

const buttonBase: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  borderRadius: 16,
  border: "1px solid var(--border-strong)",
  background: "var(--button-bg)",
  color: "var(--text)",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
  padding: "13px 15px",
};

const primaryButton: React.CSSProperties = {
  ...buttonBase,
  border: "1px solid var(--accent-border)",
  background: "var(--button-bg-strong)",
};

const softButton: React.CSSProperties = {
  ...buttonBase,
  background: "var(--surface-soft)",
};

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;

  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

function detectIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function detectAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /android/i.test(window.navigator.userAgent);
}

function detectEdge(): boolean {
  if (typeof window === "undefined") return false;
  return /Edg\//i.test(window.navigator.userAgent);
}

function detectChrome(): boolean {
  if (typeof window === "undefined") return false;
  return /Chrome\//i.test(window.navigator.userAgent) && !detectEdge();
}

function detectInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /FBAN|FBAV|Instagram|Line|Twitter|LinkedInApp|WhatsApp/i.test(window.navigator.userAgent);
}

function installLink(): string {
  if (typeof window === "undefined") return "https://www.naijataxguides.com/download";
  return `${window.location.origin}/download`;
}

export default function InstallButtons({ appHref = "/login", showInstructions = true }: InstallButtonsProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isEdge, setIsEdge] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const refreshState = () => {
      setInstalled(detectStandalone());
      setIsIos(detectIos());
      setIsAndroid(detectAndroid());
      setIsEdge(detectEdge());
      setIsChrome(detectChrome());
      setIsInAppBrowser(detectInAppBrowser());
      setDeferredPrompt(window.__ntgInstallPrompt || null);
      setServiceWorkerReady(Boolean(window.__ntgServiceWorkerReady));
    };

    refreshState();

    const onPromptReady = () => {
      refreshState();
      setMessage("Your browser can install Naija Tax Guide now. Use the optional install button below.");
    };

    const onInstalled = () => {
      refreshState();
      setMessage("Naija Tax Guide has been installed on this device.");
    };

    const onSwReady = () => {
      refreshState();
    };

    window.addEventListener("ntg:pwa-install-ready", onPromptReady);
    window.addEventListener("ntg:pwa-installed", onInstalled);
    window.addEventListener("ntg:pwa-sw-ready", onSwReady);

    return () => {
      window.removeEventListener("ntg:pwa-install-ready", onPromptReady);
      window.removeEventListener("ntg:pwa-installed", onInstalled);
      window.removeEventListener("ntg:pwa-sw-ready", onSwReady);
    };
  }, []);

  const statusMessage = useMemo(() => {
    if (message) return message;
    if (installed) return "Naija Tax Guide is already installed on this device. You can open it from your app launcher or continue in the web app.";
    if (isInAppBrowser) return "Open this page in Chrome on Android or Safari on iPhone/iPad before adding it to your home screen.";
    if (isIos) return "iPhone/iPad: tap Safari Share, then Add to Home Screen. You can still use the web app without installing.";
    if (isAndroid) return "Android: tap Chrome menu, then Install app or Add to Home screen. You can still use the web app immediately.";
    if (isEdge) return "Desktop Edge: use the address-bar install icon, or menu (...) > Apps > Install this site as an app. You can still use the web app immediately.";
    if (isChrome) return "Desktop Chrome: use the address-bar install icon, or menu (...) > Save and share > Install page as app. You can still use the web app immediately.";
    return "Installation is optional. You can use Naija Tax Guide immediately in your browser.";
  }, [installed, isAndroid, isChrome, isEdge, isInAppBrowser, isIos, message]);

  const openWebApp = () => {
    window.location.assign(appHref);
  };

  const installApp = async () => {
    if (installed) {
      setMessage("The app already appears to be installed. You can open it from your app launcher or keep using the browser version.");
      return;
    }

    const promptEvent = deferredPrompt || window.__ntgInstallPrompt || null;

    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      window.__ntgInstallPrompt = null;
      setDeferredPrompt(null);
      setMessage(
        choice.outcome === "accepted"
          ? "Installation started. Open Naija Tax Guide from your home screen or app launcher when it finishes."
          : "Installation was dismissed. You can still use the web app now."
      );
      return;
    }

    setMessage(statusMessage);
  };

  const copyInstallLink = async () => {
    const link = installLink();
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Install link copied. Share or open it on the phone/tablet where you want to use Naija Tax Guide.");
    } catch {
      setMessage(`Install link: ${link}`);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <button type="button" onClick={openWebApp} style={primaryButton}>
          Start Using Now
        </button>
        <button type="button" onClick={copyInstallLink} style={buttonBase}>
          Send to My Phone
        </button>
        <button type="button" onClick={installApp} style={softButton}>
          Optional: Install App
        </button>
      </div>

      {showInstructions && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid var(--border)",
            background: "var(--surface-soft)",
            padding: 14,
            color: "var(--text-muted)",
            lineHeight: 1.7,
            fontSize: 14,
          }}
        >
          <strong style={{ color: "var(--text)" }}>No installation required.</strong>{" "}
          {statusMessage}
          <div style={{ marginTop: 8, color: "var(--text-faint)", fontSize: 13 }}>
            Service worker: {serviceWorkerReady ? "ready" : "loading"}. Native Google Play and Apple App Store apps will be added later.
          </div>
        </div>
      )}
    </div>
  );
}
