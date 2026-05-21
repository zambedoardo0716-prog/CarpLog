"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Fish,
  History,
  LocateFixed,
  MapPinned,
  Plus,
  Scale,
  Trophy,
} from "lucide-react";

type CatchEntry = {
  id: number;
  weight: string;
  length: string;
  bait: string;
  time: string;
  notes: string;
};

type StoredSession = {
  id: string;
  savedAt: string;
  session: {
    date: string;
    duration: string;
    spot: string;
    latitude?: number | null;
    longitude?: number | null;
    weather: string;
    wind: string;
    temperature: string;
    waterLevel: string;
  };
  setup: {
    bait: string;
    rig: string;
    feeding: string;
  };
  notes: string;
  catches: CatchEntry[];
};

function readStoredSessions() {
  try {
    const rawSessions = localStorage.getItem("carplog:sessions");

    if (!rawSessions) {
      return [];
    }

    const parsed = JSON.parse(rawSessions);

    return Array.isArray(parsed) ? (parsed as StoredSession[]) : [];
  } catch {
    return [];
  }
}

function parseWeight(weight: string) {
  const normalized = weight.replace(",", ".").replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWeight(weight: number) {
  return weight > 0 ? `${weight.toLocaleString("it-IT")} kg` : "0 kg";
}

function getCatches(entry: StoredSession) {
  return Array.isArray(entry.catches) ? entry.catches : [];
}

function getTime(value: string) {
  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function formatDate(date: string) {
  if (!date) {
    return "Data non indicata";
  }

  const parsedDate = new Date(date);

  if (!Number.isFinite(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
  }).format(parsedDate);
}

function getMostUsedSpot(sessions: StoredSession[]) {
  const counts = new Map<string, number>();

  sessions.forEach((entry) => {
    const spot = entry.session?.spot?.trim();

    if (!spot) {
      return;
    }

    counts.set(spot, (counts.get(spot) ?? 0) + 1);
  });

  const [spot, count] =
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  return spot ? { spot, count } : null;
}

function hasLocation(entry: StoredSession) {
  return (
    typeof entry.session.latitude === "number" &&
    Number.isFinite(entry.session.latitude) &&
    typeof entry.session.longitude === "number" &&
    Number.isFinite(entry.session.longitude)
  );
}

export function HomeDashboard() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useEffect(() => {
    setSessions(
      readStoredSessions().sort((a, b) => getTime(b.savedAt) - getTime(a.savedAt)),
    );
  }, []);

  const summary = useMemo(() => {
    const allCatches = sessions.flatMap((entry) => getCatches(entry));
    const bestWeight = allCatches.reduce((best, entry) => {
      return Math.max(best, parseWeight(entry.weight));
    }, 0);
    const latestSession = sessions[0];
    const mostUsedSpot = getMostUsedSpot(sessions);

    return {
      totalCatches: allCatches.length,
      bestWeight,
      latestSession,
      mostUsedSpot,
      latestSessions: sessions.slice(0, 3),
    };
  }, [sessions]);

  const hasSessions = sessions.length > 0;

  const stats = [
    {
      label: "Catture totali",
      value: String(summary.totalCatches),
      detail: hasSessions ? "Da sessioni salvate" : "Nessun dato",
      icon: Trophy,
    },
    {
      label: "Miglior cattura",
      value: formatWeight(summary.bestWeight),
      detail: summary.bestWeight > 0 ? "Record registrato" : "Nessuna cattura",
      icon: Scale,
    },
    {
      label: "Ultima sessione",
      value: summary.latestSession
        ? formatDate(summary.latestSession.session.date)
        : "0",
      detail: summary.latestSession?.session.spot || "Nessuna sessione",
      icon: CalendarDays,
    },
    {
      label: "Spot più usato",
      value: summary.mostUsedSpot?.spot ?? "0",
      detail: summary.mostUsedSpot
        ? `${summary.mostUsedSpot.count} sessioni`
        : "Nessuno spot",
      icon: MapPinned,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-emerald-300/15 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/75">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-normal text-white">
          La tua stagione, ordinata.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Riepilogo locale delle sessioni salvate su questo browser.
        </p>

        {!hasSessions ? (
          <div className="mt-5 rounded-lg border border-dashed border-white/10 bg-black/10 p-4 text-sm font-medium text-slate-300">
            Nessuna sessione ancora salvata
          </div>
        ) : null}

        <Link
          href="/nuova-sessione"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-bold text-[#07110e] shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300"
        >
          {hasSessions ? "Nuova sessione" : "Crea prima sessione"}
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="min-h-36 rounded-lg border border-white/10 bg-[#0d1b18]/88 p-4 shadow-lg shadow-black/20"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-300/10 text-emerald-200">
                  <Icon aria-hidden="true" size={19} />
                </div>
              </div>
              <p className="text-xs font-medium text-slate-400">{stat.label}</p>
              <p className="mt-2 break-words text-2xl font-bold tracking-normal text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{stat.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Ultime sessioni</h2>
          <Link
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-100"
            href="/storico"
          >
            Storico
            <History aria-hidden="true" size={15} />
          </Link>
        </div>

        {summary.latestSessions.length > 0 ? (
          <div className="space-y-3">
            {summary.latestSessions.map((entry) => {
              const catchesCount = getCatches(entry).length;

              return (
                <article
                  key={entry.id}
                  className="rounded-lg border border-white/10 bg-[#0d1b18]/88 p-4 shadow-lg shadow-black/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                        <CalendarDays aria-hidden="true" size={16} />
                        {formatDate(entry.session.date)}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-white">
                        {entry.session.spot || "Spot non indicato"}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-300/10 px-2 py-1 text-xs font-bold text-emerald-100">
                      <Fish aria-hidden="true" size={14} />
                      {catchesCount}
                    </span>
                  </div>
                  {entry.session.duration || entry.session.weather ? (
                    <p className="mt-3 text-sm text-slate-400">
                      {[entry.session.duration, entry.session.weather]
                        .filter(Boolean)
                        .join(" - ")}
                    </p>
                  ) : null}
                  {hasLocation(entry) ? (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-300/10 px-2 py-1 text-xs font-bold text-emerald-100">
                      <LocateFixed aria-hidden="true" size={14} />
                      Posizione salvata
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <Link
            className="flex min-h-20 items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 bg-black/10 px-4 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
            href="/nuova-sessione"
          >
            <Plus aria-hidden="true" size={18} />
            Crea prima sessione
          </Link>
        )}
      </section>
    </div>
  );
}
