"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronRight,
  CloudSun,
  Fish,
  Gauge,
  LocateFixed,
  NotebookText,
  Save,
} from "lucide-react";

type SpotLocation = {
  latitude: number;
  longitude: number;
};

type QuickCatchFormState = {
  weight: string;
  bait: string;
  rig: string;
  weather: string;
  notes: string;
  photoName: string;
};

type StoredSession = {
  id: string;
  savedAt: string;
  session: {
    date: string;
    duration: string;
    spot: string;
    latitude: number | null;
    longitude: number | null;
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
  catches: Array<{
    id: number;
    weight: string;
    length: string;
    bait: string;
    time: string;
    notes: string;
    photoName?: string;
  }>;
};

const fieldBase =
  "min-h-12 w-full rounded-lg border border-teal-700/20 bg-slate-950/60 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/70 focus:bg-slate-950 focus:ring-4 focus:ring-teal-700/15";

function createSessionId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random()}`
  );
}

function getLocalDateParts(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  const localIso = new Date(date.getTime() - timezoneOffset).toISOString();

  return {
    date: localIso.slice(0, 10),
    time: localIso.slice(11, 16),
  };
}

function readStoredSessions() {
  try {
    const storedSessions = JSON.parse(
      localStorage.getItem("carplog:sessions") ?? "[]",
    );

    return Array.isArray(storedSessions) ? storedSessions : [];
  } catch {
    return [];
  }
}

function isLocalhost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  if (!window.isSecureContext && !isLocalhost()) {
    return "Posizione non disponibile: serve HTTPS o localhost.";
  }

  if (error.code === error.PERMISSION_DENIED) {
    return "Posizione non autorizzata. Salvo senza coordinate.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Posizione non disponibile. Salvo senza coordinate.";
  }

  if (error.code === error.TIMEOUT) {
    return "Posizione non rilevata in tempo. Salvo senza coordinate.";
  }

  return "Posizione non disponibile. Salvo senza coordinate.";
}

export function QuickCatchForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<QuickCatchFormState>({
    weight: "",
    bait: "",
    rig: "",
    weather: "",
    notes: "",
    photoName: "",
  });
  const [location, setLocation] = useState<SpotLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("Rilevo lo spot...");
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!window.isSecureContext && !isLocalhost()) {
      setLocationStatus("Posizione non disponibile: serve HTTPS o localhost.");
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("Geolocalizzazione non disponibile su questo browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("Spot rilevato automaticamente");
      },
      (geolocationError) => {
        setLocation(null);
        setLocationStatus(getGeolocationErrorMessage(geolocationError));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  }, []);

  function updateField(field: keyof QuickCatchFormState, value: string) {
    if (field === "weight") {
      setError("");
    }

    setSavedMessage("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const weight = form.weight.trim();

    if (!weight) {
      setError("Inserisci il peso per salvare la cattura.");
      return;
    }

    const now = new Date();
    const { date, time } = getLocalDateParts(now);
    const storedSessions = readStoredSessions();
    const spotName = location ? "Posizione attuale" : "Cattura rapida";
    const notes = form.photoName
      ? [form.notes.trim(), `Foto: ${form.photoName}`].filter(Boolean).join("\n")
      : form.notes.trim();

    const session: StoredSession = {
      id: createSessionId(),
      savedAt: now.toISOString(),
      session: {
        date,
        duration: "",
        spot: spotName,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        weather: form.weather,
        wind: "",
        temperature: "",
        waterLevel: "",
      },
      setup: {
        bait: form.bait,
        rig: form.rig,
        feeding: "",
      },
      notes,
      catches: [
        {
          id: Date.now(),
          weight,
          length: "",
          bait: form.bait,
          time,
          notes,
          photoName: form.photoName || undefined,
        },
      ],
    };

    try {
      localStorage.setItem(
        "carplog:sessions",
        JSON.stringify([...storedSessions, session]),
      );
    } catch {
      setError(
        "Salvataggio locale non riuscito. Controlla spazio disponibile o impostazioni privacy del browser.",
      );
      return;
    }

    formRef.current?.reset();
    setForm({
      weight: "",
      bait: "",
      rig: "",
      weather: "",
      notes: "",
      photoName: "",
    });
    setError("");
    setSavedMessage(
      location
        ? "Cattura salvata con ora e posizione"
        : "Cattura salvata con ora automatica",
    );
  }

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      <section className="rounded-lg border border-teal-700/20 bg-slate-900/75 p-4 shadow-xl shadow-teal-950/20">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-100">
            <Gauge aria-hidden="true" size={17} />
            Peso cattura
          </span>
          <input
            autoFocus
            className="min-h-16 w-full rounded-lg border border-teal-700/30 bg-slate-950/70 px-4 text-2xl font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-teal-500/80 focus:ring-4 focus:ring-teal-700/20"
            inputMode="decimal"
            placeholder="Es. 12,4 kg"
            value={form.weight}
            onChange={(event) => updateField("weight", event.target.value)}
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2 rounded-lg border border-teal-700/15 bg-slate-950/45 p-3 text-sm text-slate-300">
          <p className="flex items-center gap-2">
            <Check aria-hidden="true" className="text-teal-200" size={16} />
            Data e ora vengono salvate automaticamente
          </p>
          <p className="flex items-center gap-2">
            <LocateFixed aria-hidden="true" className="text-teal-200" size={16} />
            {locationStatus}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-teal-700/15 bg-slate-900/70 p-4 shadow-lg shadow-teal-950/15">
        <h2 className="text-sm font-semibold text-white">Dettagli veloci</h2>
        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              <NotebookText aria-hidden="true" size={15} />
              Note rapide
            </span>
            <textarea
              className={`${fieldBase} min-h-24 resize-none py-3 leading-6`}
              placeholder="Una riga su mangiata, punto, sensazioni..."
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                <Fish aria-hidden="true" size={15} />
                Esca
              </span>
              <input
                className={fieldBase}
                placeholder="Boilie..."
                value={form.bait}
                onChange={(event) => updateField("bait", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                <Gauge aria-hidden="true" size={15} />
                Rig
              </span>
              <input
                className={fieldBase}
                placeholder="Ronnie..."
                value={form.rig}
                onChange={(event) => updateField("rig", event.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                <CloudSun aria-hidden="true" size={15} />
                Meteo
              </span>
              <select
                className={fieldBase}
                value={form.weather}
                onChange={(event) => updateField("weather", event.target.value)}
              >
                <option value="">Vuoto</option>
                <option>Sereno</option>
                <option>Nuvoloso</option>
                <option>Pioggia</option>
                <option>Nebbia</option>
                <option>Temporale</option>
              </select>
            </label>
            <div>
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                <Camera aria-hidden="true" size={15} />
                Foto
              </span>
              <input
                accept="image/*"
                className="sr-only"
                id="quick-catch-photo"
                type="file"
                onChange={(event) =>
                  updateField("photoName", event.target.files?.[0]?.name ?? "")
                }
              />
              <label
                className="flex min-h-12 w-full items-center justify-center rounded-lg border border-teal-700/20 bg-slate-950/60 px-3 text-center text-xs font-bold text-slate-200"
                htmlFor="quick-catch-photo"
              >
                {form.photoName || "Scegli"}
              </label>
            </div>
          </div>
        </div>
      </section>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white shadow-lg shadow-teal-950/35 transition hover:bg-teal-600"
        type="submit"
      >
        <Save aria-hidden="true" size={18} />
        Salva cattura
      </button>

      {savedMessage ? (
        <section
          className="rounded-lg border border-teal-700/25 bg-slate-900/80 p-4 shadow-xl shadow-teal-950/20"
          role="status"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white">
              <Check aria-hidden="true" size={19} strokeWidth={2.6} />
            </span>
            <div>
              <p className="font-bold text-white">{savedMessage}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Vuoi aggiungere dettagli alla sessione?
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-teal-700/35 bg-teal-700/15 px-4 text-sm font-bold text-teal-100 transition hover:bg-teal-700/20"
              href="/nuova-sessione"
            >
              Aggiungi dettagli avanzati
              <ChevronRight aria-hidden="true" size={17} />
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-slate-950/45 px-4 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              href="/"
            >
              Chiudi
            </Link>
          </div>
        </section>
      ) : null}
    </form>
  );
}
