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
  Trophy,
  X,
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
  setup?: {
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

function formatSavedAt(value: string) {
  const parsedDate = new Date(value);

  if (!Number.isFinite(parsedDate.getTime())) {
    return "Salvataggio recente";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function getBestWeight(catches: CatchEntry[]) {
  return catches.reduce((best, entry) => {
    return Math.max(best, parseWeight(entry.weight));
  }, 0);
}

function hasLocation(entry: StoredSession) {
  return (
    typeof entry.session.latitude === "number" &&
    Number.isFinite(entry.session.latitude) &&
    typeof entry.session.longitude === "number" &&
    Number.isFinite(entry.session.longitude)
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-lg bg-slate-950/45 p-3">
      <dt className="text-xs font-medium text-slate-300">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-white">{value}</dd>
    </div>
  );
}

export function HomeDashboard() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<StoredSession | null>(
    null,
  );

  useEffect(() => {
    setSessions(
      readStoredSessions().sort((a, b) => getTime(b.savedAt) - getTime(a.savedAt)),
    );
  }, []);

  const summary = useMemo(() => {
    const allCatches = sessions.flatMap((entry) => getCatches(entry));
    const spots = new Set(
      sessions
        .map((entry) => entry.session.spot.trim())
        .filter((spot) => spot.length > 0),
    );
    const latestSession = sessions[0];

    return {
      latestSession,
      latestSessions: sessions.slice(0, 3),
      recentActivity: sessions.slice(0, 4),
      totalCatches: allCatches.length,
      totalSessions: sessions.length,
      totalSpots: spots.size,
      bestWeight: getBestWeight(allCatches),
    };
  }, [sessions]);

  const hasSessions = sessions.length > 0;
  const latestCatches = summary.latestSession
    ? getCatches(summary.latestSession)
    : [];
  const latestBestWeight = getBestWeight(latestCatches);

  const statCards = [
    {
      label: "Sessioni",
      value: String(summary.totalSessions),
      icon: CalendarDays,
    },
    {
      label: "Catture",
      value: String(summary.totalCatches),
      icon: Fish,
    },
    {
      label: "Peso migliore",
      value: formatWeight(summary.bestWeight),
      icon: Trophy,
    },
    {
      label: "Spot",
      value: String(summary.totalSpots),
      icon: MapPinned,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-teal-700/20 bg-slate-900/75 p-5 shadow-xl shadow-teal-950/25">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
          CarpLog
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-normal text-white">
          La tua stagione, ordinata.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Registra sessioni, catture e spot privati in pochi tocchi.
        </p>
        <Link
          href="/nuova-sessione"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white shadow-lg shadow-teal-950/35 transition hover:bg-teal-600"
        >
          Nuova sessione
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>

      {!hasSessions ? (
        <section className="rounded-lg border border-dashed border-teal-700/25 bg-slate-900/70 p-4 text-center shadow-xl shadow-teal-950/20">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-teal-700/15 text-teal-200">
            <Fish aria-hidden="true" size={21} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-white">
            Inizia dal primo report
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-300">
            Nessuna sessione ancora salvata. Crea la prima e CarpLog costruira
            automaticamente storico e statistiche.
          </p>
        </section>
      ) : null}

      {summary.latestSession ? (
        <section className="rounded-lg border border-teal-700/15 bg-slate-900/75 p-4 shadow-xl shadow-teal-950/20">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Ultima sessione</h2>
            {hasLocation(summary.latestSession) ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-teal-700/15 px-2 py-1 text-xs font-bold text-teal-200">
                <LocateFixed aria-hidden="true" size={14} />
                GPS
              </span>
            ) : null}
          </div>

          <div className="mt-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-teal-200">
              <CalendarDays aria-hidden="true" size={16} />
              {formatDate(summary.latestSession.session.date)}
            </p>
            <h3 className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
              <MapPinned aria-hidden="true" size={20} />
              {summary.latestSession.session.spot || "Spot non indicato"}
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-xs text-slate-300">Catture</p>
              <p className="mt-1 text-xl font-bold text-white">
                {latestCatches.length}
              </p>
            </div>
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-xs text-slate-300">Peso migliore</p>
              <p className="mt-1 text-xl font-bold text-white">
                {formatWeight(latestBestWeight)}
              </p>
            </div>
          </div>

          <button
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-teal-700/35 bg-teal-700/15 px-4 text-sm font-bold text-teal-100 transition hover:bg-teal-700/20"
            type="button"
            onClick={() => setSelectedSession(summary.latestSession)}
          >
            Apri report
            <History aria-hidden="true" size={17} />
          </button>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="min-h-28 rounded-lg border border-teal-700/15 bg-slate-900/72 p-4 shadow-lg shadow-teal-950/15"
            >
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-teal-700/15 text-teal-200">
                <Icon aria-hidden="true" size={19} />
              </div>
              <p className="text-xs font-medium text-slate-300">{card.label}</p>
              <p className="mt-1 break-words text-2xl font-bold tracking-normal text-white">
                {card.value}
              </p>
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Attivita recente</h2>
          <Link
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-200"
            href="/storico"
          >
            Storico
            <History aria-hidden="true" size={15} />
          </Link>
        </div>

        {summary.recentActivity.length > 0 ? (
          <div className="space-y-2">
            {summary.recentActivity.map((entry) => {
              const catchesCount = getCatches(entry).length;

              return (
                <article
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-teal-700/15 bg-slate-900/72 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {entry.session.spot || "Spot non indicato"}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      {formatSavedAt(entry.savedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {hasLocation(entry) ? (
                      <LocateFixed
                        aria-label="Posizione salvata"
                        className="text-teal-200"
                        size={16}
                      />
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-lg bg-teal-700/15 px-2 py-1 text-xs font-bold text-teal-100">
                      <Fish aria-hidden="true" size={14} />
                      {catchesCount}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-teal-700/15 bg-slate-950/55 p-4 text-sm text-slate-300">
            Le tue ultime sessioni compariranno qui.
          </div>
        )}
      </section>

      {selectedSession ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/75 px-3 pb-3 pt-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-session-report-title"
          onClick={() => setSelectedSession(null)}
        >
          <section
            className="mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-lg border border-teal-700/15 bg-slate-950 shadow-2xl shadow-black/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-teal-700/15 bg-slate-950/95 p-4 backdrop-blur-xl">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
                  Ultima sessione
                </p>
                <h2
                  id="home-session-report-title"
                  className="mt-1 text-2xl font-bold text-white"
                >
                  Report sessione
                </h2>
              </div>
              <button
                aria-label="Chiudi report sessione"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-teal-700/15 text-slate-300 transition hover:bg-teal-700/10 hover:text-white"
                type="button"
                onClick={() => setSelectedSession(null)}
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>

            <div className="space-y-5 p-4">
              <dl className="grid grid-cols-2 gap-3">
                <DetailItem
                  label="Data"
                  value={formatDate(selectedSession.session.date)}
                />
                <DetailItem label="Spot" value={selectedSession.session.spot} />
                <DetailItem
                  label="Durata"
                  value={selectedSession.session.duration}
                />
                <DetailItem label="Meteo" value={selectedSession.session.weather} />
                <DetailItem label="Vento" value={selectedSession.session.wind} />
                <DetailItem
                  label="Temperatura"
                  value={selectedSession.session.temperature}
                />
                <DetailItem
                  label="Livello acqua"
                  value={selectedSession.session.waterLevel}
                />
                <DetailItem label="Esca" value={selectedSession.setup?.bait} />
                <DetailItem label="Rig" value={selectedSession.setup?.rig} />
              </dl>

              {selectedSession.notes ? (
                <section className="rounded-lg border border-teal-700/15 bg-slate-950/45 p-4">
                  <h3 className="text-sm font-semibold text-white">Note</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedSession.notes}
                  </p>
                </section>
              ) : null}

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Catture</h3>
                {getCatches(selectedSession).length > 0 ? (
                  <div className="space-y-3">
                    {getCatches(selectedSession).map((catchEntry, index) => (
                      <article
                        key={`${catchEntry.id}-${index}`}
                        className="rounded-lg border border-teal-700/15 bg-slate-900/75 p-4"
                      >
                        <p className="text-sm font-semibold text-teal-200">
                          Cattura {index + 1}
                        </p>
                        <dl className="mt-3 grid grid-cols-2 gap-3">
                          <DetailItem label="Peso" value={catchEntry.weight} />
                          <DetailItem
                            label="Lunghezza"
                            value={catchEntry.length}
                          />
                          <DetailItem label="Esca" value={catchEntry.bait} />
                          <DetailItem label="Ora" value={catchEntry.time} />
                        </dl>
                        {catchEntry.notes ? (
                          <p className="mt-3 rounded-lg bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
                            {catchEntry.notes}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-teal-700/15 bg-slate-950/55 p-4 text-sm text-slate-300">
                    Nessuna cattura registrata per questa sessione.
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
