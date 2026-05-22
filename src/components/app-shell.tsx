"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Fish } from "lucide-react";
import { navigation } from "@/lib/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden border-x border-teal-700/20 bg-slate-950/88 shadow-2xl shadow-black/45">
      <header className="sticky top-0 z-20 border-b border-teal-700/20 bg-slate-950/92 px-5 pb-4 pt-5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700 text-white shadow-lg shadow-teal-950/35">
              <Fish aria-hidden="true" size={23} strokeWidth={2.4} />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-normal text-white">
                CarpLog
              </span>
              <span className="block text-xs font-medium text-teal-100/80">
                Diario carpfishing
              </span>
            </span>
          </Link>
          <div className="rounded-full border border-teal-700/30 bg-teal-700/15 px-3 py-1 text-xs font-semibold text-teal-100">
            PWA
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-teal-700/20 bg-slate-950/96 px-2 pb-3 pt-2 backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-semibold transition ${
                  isActive
                    ? "bg-teal-700 text-white shadow-lg shadow-teal-950/35"
                    : "text-slate-300 hover:bg-teal-700/15 hover:text-white"
                }`}
              >
                <Icon aria-hidden="true" size={20} strokeWidth={2.3} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
