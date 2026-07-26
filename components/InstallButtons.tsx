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

function detectEdge(): boolean {
  if (typeof window === "undefined") return false;
  return /Edg\//i.test(window.navigator.userAgent);
}

function detectChromeLike(): boolean {
  if (typeof window === "undefined") return false;
  return /Chrome\//i.test(window.navigator.userAgent) || /CriOS/i.test(window.navigator.userAgent) || detectEdge();
}

function detectInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /FBAN|FBAV|Instagram|Line|Twitter|LinkedInApp|WhatsApp/i.test(window.navigator.userAgent);
}

function installLink(): string {
  if (typeof window === "undefined") return "https://www.naijataxguides.com/download";
  return `${window.location.origin}/download`;
}

function manualInstallHelp(isIos: boolean, isAndroid: boolean, isEdge: boolean): string {
  if (isIos) {
    return "iPhone/iPad: open this page in Safari, tap Share, then choose Add to Home Screen.";
  }

  if (isAndroid) {
    return "Android Chrome: stay on this page for about 30 seconds, tap the page once, then use Chrome menu > Install app or Add to Home screen.";
  }

  if (isEdge) {
    return "Microsoft Edge desktop: use the address-bar install icon, or open menu (...) > Apps > Install this site as an app.";
  }

  return "Chrome desktop: use the address-bar install icon, or open menu (...) > Save and share > Install page as app.";
}

export default function InstallButtons({ appHref = "/login", showInstructions = true }: InstallButtonsProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isEdge, setIsEdge] = useState(false);
  const [isChromeLike, setIsChromeLike] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [secondsOnPage, setSecondsOnPage] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const refreshState = () => {
      setInstalled(detectStandalone());
      setIsIos(detectIos());
      setIsAndroid(detectAndroid());
      setIsEdge(detectEdge());
      setIsChromeLike(detectChromeLike());
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

    const interval = window.setInterval(() => {
      setSecondsOnPage((value) => value + 1);
      refreshState();
    }, 1000);

    window.addEventListener("ntg:pwa-install-ready", onPromptReady);
    window.addEventListener("ntg:pwa-installed", onInstalled);
    window.addEventListener("ntg:pwa-sw-ready", onSwReady);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("ntg:pwa-install-ready", onPromptReady);
      window.removeEventListener("ntg:pwa-installed", onInstalled);
      window.removeEventListener("ntg:pwa-sw-ready", onSwReady);
    };
  }, []);

  const statusMessage = useMemo(() => {
    if (message) return message;
    if (installed) return "Installed mode detected. Open Naija Tax Guide from your home screen or app launcher.";
    if (isInAppBrowser) return "You appear to be inside an in-app browser. For installation, open this page in Chrome on Android or Safari on iPhone/iPad.";
    if (deferredPrompt) return "Your browser is ready to install Naija Tax Guide. Tap Install App Now.";
    if (secondsOnPage < 30 && isChromeLike) {
      return `${manualInstallHelp(isIos, isAndroid, isEdge)} Some Chrome/Edge versions only show the one-tap prompt after a short visit; keep this page open for ${30 - secondsOnPage}s more.`;
    }
    return manualInstallHelp(isIos, isAndroid, isEdge);
  }, [deferredPrompt, installed, isAndroid, isChromeLike, isEdge, isInAppBrowser, isIos, message, secondsOnPage]);

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

    setMessage(
      `${manualInstallHelp(isIos, isAndroid, isEdge)} The one-tap Install App Now button only works when the browser fires its install prompt.`
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
            Service worker: {serviceWorkerReady ? "ready" : "loading"}. Time on page: {secondsOnPage}s. App store links will be added later after native wrapper approval.
          </div>
        </div>
      )}
    </div>
  );
}
