"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const isLocalhost = ["localhost", "127.0.0.1"].includes(
      window.location.hostname,
    );

    if (!window.isSecureContext && !isLocalhost) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[CarpLog] Service worker non registrato", error);
      }
    });
  }, []);

  return null;
}
