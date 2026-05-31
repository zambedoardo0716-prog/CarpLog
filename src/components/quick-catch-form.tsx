"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  Camera,
  CalendarDays,
  Check,
  ChevronRight,
  CloudSun,
  Clock,
  Fish,
  Gauge,
  LocateFixed,
  MapPinned,
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

type TimeLocationMode = "auto" | "manual";

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
  captureMetadata?: {
    timeLocationMode: TimeLocationMode;
  };
  catches: Array<{
    id: number;
    weight: string;
    length: string;
    bait: string;
    time: string;
    notes: string;
    quickCatch?: boolean;
    photoName?: string;
  }>;
};

const fieldBase =
  "min-h-12 w-full rounded-lg border border-teal-700/20 bg-slate-950/60 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/70 focus:bg-slate-950 focus:ring-4 focus:ring-teal-700/15";

const quickCatchDraftKey = "carplog:quick-catch-draft";

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
  const initialDateParts = getLocalDateParts(new Date());
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
  const [pendingSession, setPendingSession] = useState<StoredSession | null>(null);
  const [timeLocationMode, setTimeLocationMode] =
    useState<TimeLocationMode>("auto");
  const [detectedTime, setDetectedTime] = useState(initialDateParts.time);
  const [manualDate, setManualDate] = useState(initialDateParts.date);
  const [manualTime, setManualTime] = useState(initialDateParts.time);
  const [manualSpot, setManualSpot] = useState("");
  const [useManualCurrentLocation, setUseManualCurrentLocation] = useState(false);

  function requestCurrentLocation() {
    if (!window.isSecureContext && !isLocalhost()) {
      setLocation(null);
      setLocationStatus("Posizione non disponibile: serve HTTPS o localhost.");
      return;
    }

    if (!navigator.geolocation) {
      setLocation(null);
      setLocationStatus("Geolocalizzazione non disponibile su questo browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("Posizione rilevata automaticamente");
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
  }

  useEffect(() => {
    requestCurrentLocation();
  }, []);

  useEffect(() => {
    const updateDetectedTime = () => {
      setDetectedTime(getLocalDateParts(new Date()).time);
    };
    const intervalId = window.setInterval(updateDetectedTime, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  function updateField(field: keyof QuickCatchFormState, value: string) {
    if (field === "weight") {
      setError("");
    }

    setSavedMessage("");
    setPendingSession(null);
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateTimeLocationMode(nextMode: TimeLocationMode) {
    setTimeLocationMode(nextMode);
    setSavedMessage("");
    setPendingSession(null);

    if (nextMode === "manual") {
      const currentDateParts = getLocalDateParts(new Date());
      setManualDate((current) => current || currentDateParts.date);
      setManualTime((current) => current || currentDateParts.time);
      setLocation(null);
      setUseManualCurrentLocation(false);
      setLocationStatus("Posizione non richiesta");
    }

    if (nextMode === "auto") {
      setLocationStatus("Rilevo lo spot...");
      requestCurrentLocation();
    }
  }

  function toggleManualCurrentLocation(checked: boolean) {
    setUseManualCurrentLocation(checked);
    setSavedMessage("");
    setPendingSession(null);

    if (!checked) {
      setLocation(null);
      setLocationStatus("Posizione non richiesta");
      return;
    }

    setLocationStatus("Rilevo la posizione...");
    requestCurrentLocation();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const weight = form.weight.trim();

    if (!weight) {
      setError("Inserisci il peso per salvare la cattura.");
      return;
    }

    if (timeLocationMode === "manual" && (!manualDate || !manualTime)) {
      setError("Inserisci data e ora della cattura.");
      return;
    }

    const now = new Date();
    const { date: autoDate, time: autoTime } = getLocalDateParts(now);
    const date = timeLocationMode === "manual" ? manualDate : autoDate;
    const time = timeLocationMode === "manual" ? manualTime : autoTime;
    const spotName =
      timeLocationMode === "manual"
        ? manualSpot.trim() || "Spot inserito manualmente"
        : location
          ? "Posizione attuale"
          : "Cattura rapida";
    const sessionLocation =
      timeLocationMode === "manual"
        ? {
            latitude:
              useManualCurrentLocation && location ? location.latitude : null,
            longitude:
              useManualCurrentLocation && location ? location.longitude : null,
          }
        : {
            latitude: location?.latitude ?? null,
            longitude: location?.longitude ?? null,
          };
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
        latitude: sessionLocation.latitude,
        longitude: sessionLocation.longitude,
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
      captureMetadata: {
        timeLocationMode,
      },
      catches: [
        {
          id: Date.now(),
          weight,
          length: "",
          bait: form.bait,
          time,
          notes,
          quickCatch: true,
          photoName: form.photoName || undefined,
        },
      ],
    };

    try {
      sessionStorage.setItem(quickCatchDraftKey, JSON.stringify(session));
    } catch {
      setError(
        "Draft locale non riuscito. Controlla spazio disponibile o impostazioni privacy del browser.",
      );
      return;
    }

    setPendingSession(session);
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
      timeLocationMode === "manual"
        ? "Cattura pronta con dati manuali"
        : location
          ? "Cattura pronta con ora e posizione"
          : "Cattura pronta con ora automatica",
    );
  }

  function savePendingSession() {
    if (!pendingSession) {
      return;
    }

    try {
      const storedSessions = readStoredSessions();

      localStorage.setItem(
        "carplog:sessions",
        JSON.stringify([...storedSessions, pendingSession]),
      );
      sessionStorage.removeItem(quickCatchDraftKey);
      window.location.href = "/storico";
    } catch {
      setError(
        "Salvataggio locale non riuscito. Controlla spazio disponibile o impostazioni privacy del browser.",
      );
    }
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
      </section>

      <section className="rounded-lg border border-teal-700/20 bg-slate-900/75 p-4 shadow-xl shadow-teal-950/20">
        <h2 className="text-base font-bold text-white">
          Quando e dove e stata presa?
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-teal-700/15 bg-slate-950/45 p-1">
          <button
            className={`min-h-11 rounded-md px-3 text-xs font-bold transition ${
              timeLocationMode === "auto"
                ? "bg-teal-700 text-white shadow-lg shadow-teal-950/25"
                : "text-slate-300 hover:bg-teal-700/10 hover:text-white"
            }`}
            type="button"
            onClick={() => updateTimeLocationMode("auto")}
          >
            Adesso / posizione attuale
          </button>
          <button
            className={`min-h-11 rounded-md px-3 text-xs font-bold transition ${
              timeLocationMode === "manual"
                ? "bg-teal-700 text-white shadow-lg shadow-teal-950/25"
                : "text-slate-300 hover:bg-teal-700/10 hover:text-white"
            }`}
            type="button"
            onClick={() => updateTimeLocationMode("manual")}
          >
            Inserisci manualmente
          </button>
        </div>

        {timeLocationMode === "auto" ? (
          <div className="mt-4 grid gap-2 rounded-lg border border-teal-700/15 bg-slate-950/45 p-3 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <Clock aria-hidden="true" className="text-teal-200" size={16} />
              Ora: <span className="font-semibold text-white">{detectedTime}</span>
            </p>
            <p className="flex items-center gap-2">
              <LocateFixed
                aria-hidden="true"
                className="text-teal-200"
                size={16}
              />
              Posizione:{" "}
              <span className="font-semibold text-white">
                {location ? "salvata" : "non disponibile"}
              </span>
            </p>
            <p className="text-xs leading-5 text-slate-400">{locationStatus}</p>
            <p className="text-xs leading-5 text-slate-400">
              Usa la posizione attuale solo se sei sullo spot.
            </p>
            <p className="text-xs leading-5 text-slate-400">
              Questi dati saranno indicati nel report come rilevati
              automaticamente.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                  <CalendarDays aria-hidden="true" size={15} />
                  Data
                </span>
                <input
                  className={fieldBase}
                  type="date"
                  value={manualDate}
                  onChange={(event) => setManualDate(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                  <Clock aria-hidden="true" size={15} />
                  Ora
                </span>
                <input
                  className={fieldBase}
                  type="time"
                  value={manualTime}
                  onChange={(event) => setManualTime(event.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                <MapPinned aria-hidden="true" size={15} />
                Spot
              </span>
              <input
                className={fieldBase}
                placeholder="Nome spot o postazione"
                value={manualSpot}
                onChange={(event) => setManualSpot(event.target.value)}
              />
            </label>
            <section className="rounded-lg border border-teal-700/15 bg-slate-950/45 p-3">
              <label className="flex items-start gap-3">
                <input
                  checked={useManualCurrentLocation}
                  className="mt-1 h-5 w-5 rounded border-teal-700/40 bg-slate-950 accent-teal-700"
                  type="checkbox"
                  onChange={(event) =>
                    toggleManualCurrentLocation(event.target.checked)
                  }
                />
                <span>
                  <span className="block text-sm font-bold text-white">
                    Posizione
                  </span>
                  <span className="mt-1 block text-sm text-slate-300">
                    Usa posizione attuale solo se sei sullo spot
                  </span>
                </span>
              </label>
              {useManualCurrentLocation ? (
                <p className="mt-3 text-sm font-semibold text-teal-100">
                  {location ? "Posizione rilevata automaticamente" : locationStatus}
                </p>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Se non attivi questa opzione, salvi solo il nome dello spot.
                </p>
              )}
            </section>
            <p className="text-xs leading-5 text-slate-400">
              Questi dati saranno indicati nel report come inseriti manualmente.
            </p>
          </div>
        )}
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
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/75 px-3 pb-3 pt-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-catch-saved-title"
        >
          <section className="mx-auto w-full max-w-md rounded-lg border border-teal-700/25 bg-slate-950 p-4 shadow-2xl shadow-black/60">
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-700" />
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-700 text-white">
                <Check aria-hidden="true" size={20} strokeWidth={2.6} />
              </span>
              <div>
                <h2 id="quick-catch-saved-title" className="text-xl font-bold text-white">
                  Cattura salvata
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Vuoi aggiungere dettagli alla sessione?
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-lg border border-teal-700/15 bg-teal-700/10 p-3 text-sm font-semibold text-teal-100">
              {savedMessage}
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white shadow-lg shadow-teal-950/35 transition hover:bg-teal-600"
                href="/nuova-sessione?quickCatchDraft=1"
              >
                Aggiungi dettagli
                <ChevronRight aria-hidden="true" size={17} />
              </Link>
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-4 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                type="button"
                onClick={savePendingSession}
              >
                Non ora
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </form>
  );
}
