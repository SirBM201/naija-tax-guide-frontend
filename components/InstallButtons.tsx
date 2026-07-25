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
  minHeight: 48,
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
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const refreshState = () => {
      setInstalled(detectStandalone());
      setIsIos(detectIos());
      setIsAndroid(detectAndroid());
      setIsInAppBrowser(detectInAppBrowser());
      setDeferredPrompt(window.__ntgInstallPrompt || null);
      setServiceWorkerReady(Boolean(window.__ntgServiceWorkerReady));
    };

    refreshState();

    const onPromptReady = () => {
      refreshState();
      setMessage("Install prompt is ready on this device. Tap Install App Now.");
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
    if (installed) return "Installed mode detected. Open Naija Tax Guide from your home screen or app launcher.";
    if (isInAppBrowser) return "You appear to be inside an in-app browser. For installation, open this page in Chrome on Android or Safari on iPhone/iPad.";
    if (isIos) return "For iPhone and iPad, open this page in Safari, tap Share, then choose Add to Home Screen.";
    if (deferredPrompt) return "Your browser is ready to install Naija Tax Guide. Tap Install App Now.";
    if (isAndroid) return "If the install prompt is not shown, open Chrome menu and choose Install app or Add to Home screen.";
    return "On Chrome or Edge, use Install App Now when available, or use the browser install icon/menu.";
  }, [deferredPrompt, installed, isAndroid, isInAppBrowser, isIos, message]);

  const openWebApp = () => {
    window.location.assign(appHref);
  };

  const installApp = async () => {
    if (installed) {
      setMessage("The app already appears to be installed. Open it from your home screen or app launcher.");
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
          ? "Installation started. Open Naija Tax Guide from your home screen when it finishes."
          : "Installation was dismissed. You can still install from your browser menu."
      );
      return;
    }

    if (isIos) {
      setMessage("iPhone or iPad: open this page in Safari, tap Share, then choose Add to Home Screen.");
      return;
    }

    if (isInAppBrowser) {
      setMessage("Open this link in Chrome on Android or Safari on iPhone/iPad, then use the browser install option.");
      return;
    }

    setMessage(
      "Install prompt is not available yet on this browser. Try Chrome on Android, Edge/Chrome on desktop, or use the browser menu: Install app / Add to Home screen."
    );
  };

  const copyInstallLink = async () => {
    const link = installLink();
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Install link copied. Open it in Chrome on Android or Safari on iPhone/iPad, then add to home screen.");
    } catch {
      setMessage(`Install link: ${link}`);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <button type="button" onClick={installApp} style={primaryButton}>
          Install App Now
        </button>
        <button type="button" onClick={openWebApp} style={buttonBase}>
          Use Web App
        </button>
        <button type="button" onClick={copyInstallLink} style={buttonBase}>
          Copy Install Link
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
          <strong style={{ color: "var(--text)" }}>{installed ? "Installed mode detected." : "Phone install options."}</strong>{" "}
          {statusMessage}
          <div style={{ marginTop: 8, color: "var(--text-faint)", fontSize: 13 }}>
            Service worker: {serviceWorkerReady ? "ready" : "loading"}. App store links will be added later after native wrapper approval.
          </div>
        </div>
      )}
    </div>
  );
}
