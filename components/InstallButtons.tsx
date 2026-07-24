"use client";

import React, { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

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

export default function InstallButtons({ appHref = "/login", showInstructions = true }: InstallButtonsProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setInstalled(detectStandalone());
    setIsIos(detectIos());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMessage("Install prompt is ready on this device.");
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setMessage("Naija Tax Guide has been installed on this device.");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const openWebApp = () => {
    window.location.assign(appHref);
  };

  const installOnAndroidOrDesktop = async () => {
    if (installed) {
      setMessage("The app already appears to be installed. Open it from your home screen or app launcher.");
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setMessage(
        choice.outcome === "accepted"
          ? "Installation started. Open Naija Tax Guide from your home screen when it finishes."
          : "Installation was dismissed. You can try again from your browser menu."
      );
      return;
    }

    setMessage(
      "Android or tablet: open this site in Chrome, tap the browser menu, then choose Install app or Add to Home screen. Desktop Chrome/Edge users can also use the install icon in the address bar."
    );
  };

  const showIosInstructions = () => {
    setMessage(
      "iPhone or iPad: open naijataxguides.com in Safari, tap the Share button, then choose Add to Home Screen. Apple does not show the same one-tap install prompt as Android Chrome."
    );
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <button type="button" onClick={openWebApp} style={primaryButton}>
          Use Web App
        </button>
        <button type="button" onClick={installOnAndroidOrDesktop} style={buttonBase}>
          Install on Android / Tablet
        </button>
        <button type="button" onClick={showIosInstructions} style={buttonBase}>
          Install on iPhone / iPad
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
          {message ||
            (isIos
              ? "For iPhone and iPad, use Safari's Share menu and choose Add to Home Screen."
              : "For Android phones, Android tablets, Chrome, and Edge, use Install app when your browser offers it.")}
        </div>
      )}
    </div>
  );
}
