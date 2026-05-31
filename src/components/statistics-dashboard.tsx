"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Fish,
  MapPinned,
  Plus,
  Scale,
  Target,
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

type CatchWithSession = CatchEntry & {
  sessionId: string;
  sessionDate: string;
  spot: string;
  parsedWeight: number;
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

function getCatches(entry: StoredSession) {
  return Array.isArray(entry.catches) ? entry.catches : [];
}

function parseWeight(weight: string) {
  const normalized = weight.replace(",", ".").replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWeight(weight: number) {
  return weight > 0 ? `${weight.toLocaleString("it-IT")} kg` : "0 kg";
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

function getMonthKey(date: string) {
  const parsedDate = new Date(date);

  if (!Number.isFinite(parsedDate.getTime())) {
    return "Data non indicata";
  }

  return new Intl.DateTimeFormat("it-IT", {
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function getTopEntry(counts: Map<string, number>) {
  const [label, count] =
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  return label ? { label, count } : null;
}

function normalizeStatKey(value: string) {
  return value.trim().toLocaleLowerCase("it-IT");
}

function incrementNormalizedCount(
  counts: Map<string, { label: string; count: number }>,
  value: string,
) {
  const label = value.trim();
  const key = normalizeStatKey(label);

  if (!key) {
    return;
  }

  const current = counts.get(key);

  counts.set(key, {
    label: current?.label ?? label,
    count: (current?.count ?? 0) + 1,
  });
}

function CounterList({
  emptyText,
  items,
}: {
  emptyText: string;
  items: { label: string; count: number }[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-black/10 p-4 text-sm text-slate-400">
        {emptyText}
      </div>
    );
  }

  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-lg border border-white/10 bg-[#0d1b18]/88 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="text-sm font-bold text-emerald-100">{item.count}</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

export function StatisticsDashboard() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useEffect(() => {
    setSessions(
      readStoredSessions().sort((a, b) => getTime(b.savedAt) - getTime(a.savedAt)),
    );
  }, []);

  const stats = useMemo(() => {
    const catches = sessions.flatMap<CatchWithSession>((entry) => {
      const spot = entry.session?.spot?.trim() || "Spot non indicato";

      return getCatches(entry).map((catchEntry) => ({
        ...catchEntry,
        sessionId: entry.id,
        sessionDate: entry.session?.date ?? "",
        spot,
        parsedWeight: parseWeight(catchEntry.weight),
      }));
    });

    const sessionsWithCatches = sessions.filter((entry) => getCatches(entry).length > 0);
    const blankSessions = sessions.length - sessionsWithCatches.length;
    const validWeights = catches
      .map((entry) => entry.parsedWeight)
      .filter((weight) => weight > 0);
    const bestWeight = Math.max(...validWeights, 0);
    const averageWeight =
      validWeights.length > 0
        ? validWeights.reduce((total, weight) => total + weight, 0) /
          validWeights.length
        : 0;

    const catchesBySpot = new Map<string, { label: string; count: number }>();
    const catchesByMonth = new Map<string, number>();
    const baitCounts = new Map<string, { label: string; count: number }>();

    catches.forEach((entry) => {
      incrementNormalizedCount(catchesBySpot, entry.spot);
      const month = getMonthKey(entry.sessionDate);
      catchesByMonth.set(month, (catchesByMonth.get(month) ?? 0) + 1);

      incrementNormalizedCount(baitCounts, entry.bait);
    });

    const topCatches = catches
      .filter((entry) => entry.parsedWeight > 0)
      .sort((a, b) => b.parsedWeight - a.parsedWeight)
      .slice(0, 5);

    return {
      totalSessions: sessions.length,
      totalCatches: catches.length,
      blankSessions,
      catchRate:
        sessions.length > 0
          ? Math.round((sessionsWithCatches.length / sessions.length) * 100)
          : 0,
      bestWeight,
      averageWeight,
      mostProductiveSpot: getTopEntry(
        new Map(
          [...catchesBySpot.values()].map((entry) => [entry.label, entry.count]),
        ),
      ),
      mostUsedBait: getTopEntry(
        new Map([...baitCounts.values()].map((entry) => [entry.label, entry.count])),
      ),
      catchesBySpot: [...catchesBySpot.values()]
        .sort((a, b) => b.count - a.count),
      catchesByMonth: [...catchesByMonth.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
      topCatches,
    };
  }, [sessions]);

  const statCards = [
    {
      label: "Sessioni totali",
      value: String(stats.totalSessions),
      detail: "Salvate in locale",
      icon: CalendarDays,
    },
    {
      label: "Catture totali",
      value: String(stats.totalCatches),
      detail: "Da tutte le sessioni",
      icon: Fish,
    },
    {
      label: "Cappotti totali",
      value: String(stats.blankSessions),
      detail: "Sessioni senza catture",
      icon: Target,
    },
    {
      label: "Sessioni con catture",
      value: `${stats.catchRate}%`,
      detail: "Percentuale positiva",
      icon: BarChart3,
    },
    {
      label: "Miglior cattura",
      value: formatWeight(stats.bestWeight),
      detail: stats.bestWeight > 0 ? "Peso massimo" : "Nessuna cattura",
      icon: Trophy,
    },
    {
      label: "Peso medio",
      value: formatWeight(stats.averageWeight),
      detail: "Solo catture con peso",
      icon: Scale,
    },
    {
      label: "Spot più produttivo",
      value: stats.mostProductiveSpot?.label ?? "0",
      detail: stats.mostProductiveSpot
        ? `${stats.mostProductiveSpot.count} catture`
        : "Nessuno spot",
      icon: MapPinned,
    },
    {
      label: "Esca più usata",
      value: stats.mostUsedBait?.label ?? "0",
      detail: stats.mostUsedBait
        ? `${stats.mostUsedBait.count} catture`
        : "Nessuna esca",
      icon: Fish,
    },
  ];

  return (
    <div className="space-y-6">
      {sessions.length === 0 ? (
        <section className="rounded-lg border border-dashed border-white/10 bg-white/[0.045] p-5 text-center shadow-xl shadow-black/20">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-emerald-300/10 text-emerald-100">
            <BarChart3 aria-hidden="true" size={23} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">
            Nessun dato statistico
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Salva almeno una sessione per iniziare a leggere le statistiche.
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-bold text-[#07110e] shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300"
            href="/nuova-sessione"
          >
            <Plus aria-hidden="true" size={18} />
            Crea nuova sessione
          </Link>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="min-h-36 rounded-lg border border-white/10 bg-[#0d1b18]/88 p-4 shadow-lg shadow-black/20"
            >
              <div className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-emerald-300/10 text-emerald-200">
                <Icon aria-hidden="true" size={19} />
              </div>
              <p className="text-xs font-medium text-slate-400">{card.label}</p>
              <p className="mt-2 break-words text-2xl font-bold tracking-normal text-white">
                {card.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{card.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Catture per spot</h2>
        <CounterList
          emptyText="Nessuna cattura associata a uno spot."
          items={stats.catchesBySpot}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Catture per mese</h2>
        <CounterList
          emptyText="Nessuna cattura con data sessione."
          items={stats.catchesByMonth}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Migliori 5 catture</h2>
        {stats.topCatches.length > 0 ? (
          <div className="space-y-3">
            {stats.topCatches.map((entry, index) => (
              <article
                key={`${entry.sessionId}-${entry.id}-${index}`}
                className="rounded-lg border border-white/10 bg-[#0d1b18]/88 p-4 shadow-lg shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-100">
                      #{index + 1} - {formatWeight(entry.parsedWeight)}
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">{entry.spot}</p>
                  </div>
                  <Trophy aria-hidden="true" className="text-emerald-200" size={20} />
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  {[formatDate(entry.sessionDate), entry.bait || "", entry.time || ""]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/10 p-4 text-sm text-slate-400">
            Nessuna cattura con peso registrato.
          </div>
        )}
      </section>
    </div>
  );
}
