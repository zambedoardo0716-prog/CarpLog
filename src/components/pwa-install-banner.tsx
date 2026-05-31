"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const dismissalKey = "carplog:pwa-install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIosDevice =
    /iphone|ipad|ipod/.test(userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1);
  const isSafari =
    /safari/.test(userAgent) &&
    !/crios|fxios|edgios|chrome|android/.test(userAgent);

  return isIosDevice && isSafari;
}

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(dismissalKey) === "true") {
      return;
    }

    if (isIosSafari()) {
      setShowBanner(true);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowBanner(true);
    }

    function handleAppInstalled() {
      setShowBanner(false);
      setInstallPrompt(null);
      localStorage.removeItem(dismissalKey);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      setShowIosHelp(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setShowBanner(false);
    }

    setInstallPrompt(null);
  }

  function dismissBanner() {
    localStorage.setItem(dismissalKey, "true");
    setShowBanner(false);
  }

  if (!showBanner) {
    return null;
  }

  return (
    <section className="rounded-lg border border-teal-700/20 bg-slate-900/82 p-3 shadow-lg shadow-teal-950/20">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-700/15 text-teal-100">
          <Download aria-hidden="true" size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            Installa CarpLog sulla schermata Home
          </p>
          {showIosHelp ? (
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Su iPhone apri Condividi in Safari e scegli Aggiungi alla
              schermata Home.
            </p>
          ) : null}
          <button
            className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-teal-700 px-3 text-xs font-bold text-white transition hover:bg-teal-600"
            type="button"
            onClick={handleInstall}
          >
            Aggiungi
          </button>
        </div>
        <button
          aria-label="Chiudi banner installazione"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/5 hover:text-white"
          type="button"
          onClick={dismissBanner}
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
    </section>
  );
}
