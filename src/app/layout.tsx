import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarpLog",
  description: "Diario mobile-first per sessioni, spot e catture di carpfishing.",
  applicationName: "CarpLog",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#07110e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
