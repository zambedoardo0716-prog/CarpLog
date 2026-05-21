"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CloudSun,
  Clock,
  ExternalLink,
  Fish,
  LocateFixed,
  MapPinned,
  Plus,
  Scale,
  Trash2,
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

type HistoryFilter = "all" | "with-catches" | "blank";

const filters: { label: string; value: HistoryFilter }[] = [
  { label: "Tutte", value: "all" },
  { label: "Con catture", value: "with-catches" },
  { label: "Cappotti", value: "blank" },
];

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

function getBestWeight(catches: CatchEntry[]) {
  const best = catches.reduce((currentBest, entry) => {
    return Math.max(currentBest, parseWeight(entry.weight));
  }, 0);

  return best > 0 ? `${best.toLocaleString("it-IT")} kg` : "";
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
    year: "numeric",
  }).format(parsedDate);
}

function hasLocation(entry: StoredSession) {
  return (
    typeof entry.session.latitude === "number" &&
    Number.isFinite(entry.session.latitude) &&
    typeof entry.session.longitude === "number" &&
    Number.isFinite(entry.session.longitude)
  );
}

function getMapsUrl(entry: StoredSession) {
  return `https://www.google.com/maps?q=${entry.session.latitude},${entry.session.longitude}`;
}

function debugLog(message: string, payload?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.log(message, payload);
  }
}

function logMapsUrl(entry: StoredSession) {
  debugLog("[CarpLog] URL Google Maps generato", {
    url: getMapsUrl(entry),
    latitude: entry.session.latitude,
    longitude: entry.session.longitude,
  });
}

export function SessionHistory() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    setSessions(
      readStoredSessions().sort((a, b) => {
        return getTime(b.savedAt) - getTime(a.savedAt);
      }),
    );
  }, []);

  const filteredSessions = useMemo(() => {
    if (activeFilter === "with-catches") {
      return sessions.filter((entry) => getCatches(entry).length > 0);
    }

    if (activeFilter === "blank") {
      return sessions.filter((entry) => getCatches(entry).length === 0);
    }

    return sessions;
  }, [activeFilter, sessions]);

  function deleteSession(id: string) {
    const updatedSessions = sessions.filter((entry) => entry.id !== id);

    setSessions(updatedSessions);
    localStorage.setItem("carplog:sessions", JSON.stringify(updatedSessions));
  }

  if (sessions.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-white/10 bg-white/[0.045] p-5 text-center shadow-xl shadow-black/20">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-emerald-300/10 text-emerald-100">
          <Fish aria-hidden="true" size={23} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white">
          Nessuna sessione salvata
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Le sessioni salvate in locale compariranno qui.
        </p>
        <Link
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-bold text-[#07110e] shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300"
          href="/nuova-sessione"
        >
          <Plus aria-hidden="true" size={18} />
          Crea nuova sessione
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-white/[0.045] p-1">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              className={`min-h-10 rounded-md px-2 text-xs font-bold transition ${
                isActive
                  ? "bg-emerald-400 text-[#07110e]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {filteredSessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-black/10 p-5 text-sm leading-6 text-slate-400">
          Nessuna sessione per questo filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((entry) => {
            const catches = getCatches(entry);
            const catchesCount = catches.length;
            const bestWeight = getBestWeight(catches);

            return (
              <article
                key={entry.id}
                className="rounded-lg border border-white/10 bg-[#0d1b18]/90 p-4 shadow-xl shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                      <CalendarDays aria-hidden="true" size={16} />
                      {formatDate(entry.session.date)}
                    </div>
                    <h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-white">
                      <MapPinned aria-hidden="true" size={18} />
                      {entry.session.spot || "Spot non indicato"}
                    </h2>
                  </div>
                  <button
                    aria-label={`Elimina sessione ${entry.session.spot}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold text-slate-300 transition hover:border-red-300/30 hover:bg-red-400/10 hover:text-red-100"
                    type="button"
                    onClick={() => deleteSession(entry.id)}
                  >
                    <Trash2 aria-hidden="true" size={15} />
                    Elimina
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {entry.session.duration ? (
                    <div className="rounded-lg bg-white/[0.045] p-3">
                      <dt className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock aria-hidden="true" size={14} />
                        Durata
                      </dt>
                      <dd className="mt-1 font-semibold text-white">
                        {entry.session.duration}
                      </dd>
                    </div>
                  ) : null}

                  {entry.session.weather ? (
                    <div className="rounded-lg bg-white/[0.045] p-3">
                      <dt className="flex items-center gap-2 text-xs text-slate-500">
                        <CloudSun aria-hidden="true" size={14} />
                        Meteo
                      </dt>
                      <dd className="mt-1 font-semibold text-white">
                        {entry.session.weather}
                      </dd>
                    </div>
                  ) : null}

                  <div className="rounded-lg bg-white/[0.045] p-3">
                    <dt className="flex items-center gap-2 text-xs text-slate-500">
                      <Fish aria-hidden="true" size={14} />
                      Catture
                    </dt>
                    <dd className="mt-1 font-semibold text-white">{catchesCount}</dd>
                  </div>

                  {bestWeight ? (
                    <div className="rounded-lg bg-white/[0.045] p-3">
                      <dt className="flex items-center gap-2 text-xs text-slate-500">
                        <Scale aria-hidden="true" size={14} />
                        Miglior peso
                      </dt>
                      <dd className="mt-1 font-semibold text-white">{bestWeight}</dd>
                    </div>
                  ) : null}
                </dl>

                {entry.notes ? (
                  <p className="mt-4 rounded-lg border border-emerald-300/10 bg-emerald-300/5 p-3 text-sm leading-6 text-slate-300">
                    {entry.notes}
                  </p>
                ) : null}

                {hasLocation(entry) ? (
                  <div className="mt-4 rounded-lg border border-emerald-300/15 bg-emerald-300/5 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                      <LocateFixed aria-hidden="true" size={16} />
                      Posizione salvata
                    </p>
                    <a
                      className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/15"
                      href={getMapsUrl(entry)}
                      onClick={() => logMapsUrl(entry)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Apri su Google Maps
                      <ExternalLink aria-hidden="true" size={16} />
                    </a>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
