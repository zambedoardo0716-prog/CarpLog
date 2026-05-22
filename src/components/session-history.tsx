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
  setup: {
    bait: string;
    rig: string;
    feeding: string;
  };
  notes: string;
  captureMetadata?: {
    timeLocationMode: "auto" | "manual";
  };
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

function getCaptureDataSourceLabel(entry: StoredSession) {
  if (entry.captureMetadata?.timeLocationMode === "auto") {
    return "Dati rilevati automaticamente";
  }

  if (entry.captureMetadata?.timeLocationMode === "manual") {
    return "Dati inseriti manualmente";
  }

  return "";
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

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white/[0.045] p-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-white">{value}</dd>
    </div>
  );
}

export function SessionHistory() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("all");
  const [selectedSession, setSelectedSession] = useState<StoredSession | null>(
    null,
  );

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
    if (selectedSession?.id === id) {
      setSelectedSession(null);
    }
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
                className="cursor-pointer rounded-lg border border-white/10 bg-[#0d1b18]/90 p-4 shadow-xl shadow-black/20 transition hover:border-emerald-300/25 hover:bg-[#10211d]"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedSession(entry)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedSession(entry);
                  }
                }}
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
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteSession(entry.id);
                    }}
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
                      onClick={(event) => {
                        event.stopPropagation();
                        logMapsUrl(entry);
                      }}
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

      {selectedSession ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 px-3 pb-3 pt-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-report-title"
          onClick={() => setSelectedSession(null)}
        >
          <section
            className="mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-lg border border-white/10 bg-[#07110e] shadow-2xl shadow-black/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#07110e]/95 p-4 backdrop-blur-xl">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
                  Dettaglio
                </p>
                <h2
                  id="session-report-title"
                  className="mt-1 text-2xl font-bold text-white"
                >
                  Report sessione
                </h2>
              </div>
              <button
                aria-label="Chiudi report sessione"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                <DetailItem
                  label="Origine dati"
                  value={getCaptureDataSourceLabel(selectedSession)}
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
                <DetailItem
                  label="Esca usata"
                  value={selectedSession.setup?.bait}
                />
                <DetailItem label="Rig usato" value={selectedSession.setup?.rig} />
              </dl>

              {selectedSession.setup?.feeding ? (
                <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                  <h3 className="text-sm font-semibold text-white">Pasturazione</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedSession.setup.feeding}
                  </p>
                </section>
              ) : null}

              {selectedSession.notes ? (
                <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                  <h3 className="text-sm font-semibold text-white">Note</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedSession.notes}
                  </p>
                </section>
              ) : null}

              {hasLocation(selectedSession) ? (
                <section className="rounded-lg border border-emerald-300/15 bg-emerald-300/5 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                    <LocateFixed aria-hidden="true" size={16} />
                    Coordinate
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedSession.session.latitude},{" "}
                    {selectedSession.session.longitude}
                  </p>
                  <a
                    className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/15"
                    href={getMapsUrl(selectedSession)}
                    onClick={() => logMapsUrl(selectedSession)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Apri su Google Maps
                    <ExternalLink aria-hidden="true" size={16} />
                  </a>
                </section>
              ) : null}

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Catture</h3>
                {getCatches(selectedSession).length > 0 ? (
                  <div className="space-y-3">
                    {getCatches(selectedSession).map((catchEntry, index) => (
                      <article
                        key={`${catchEntry.id}-${index}`}
                        className="rounded-lg border border-white/10 bg-[#0d1b18]/90 p-4"
                      >
                        <p className="text-sm font-semibold text-emerald-100">
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
                          <p className="mt-3 rounded-lg bg-white/[0.045] p-3 text-sm leading-6 text-slate-300">
                            {catchEntry.notes}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-black/10 p-4 text-sm text-slate-400">
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
