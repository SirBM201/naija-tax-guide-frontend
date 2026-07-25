"use client";

import { useEffect } from "react";

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

export default function PwaManager() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.__ntgInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("ntg:pwa-install-ready"));
    };

    const onInstalled = () => {
      window.__ntgInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("ntg:pwa-installed"));
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.hostname === "localhost")) {
      const register = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then(() => {
            window.__ntgServiceWorkerReady = true;
            window.dispatchEvent(new CustomEvent("ntg:pwa-sw-ready"));
          })
          .catch(() => {
            window.__ntgServiceWorkerReady = false;
          });
      };

      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register, { once: true });
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
