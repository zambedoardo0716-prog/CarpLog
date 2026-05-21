"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Clock,
  CloudSun,
  Droplets,
  Fish,
  Gauge,
  LocateFixed,
  MapPinned,
  Plus,
  Ruler,
  Save,
  Thermometer,
  Trash2,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

type CatchEntry = {
  id: number;
  weight: string;
  length: string;
  bait: string;
  time: string;
  notes: string;
};

type SpotLocation = {
  latitude: number;
  longitude: number;
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
  catches: CatchEntry[];
};

const fieldBase =
  "min-h-12 w-full rounded-lg border border-white/10 bg-[#07110e]/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/70 focus:bg-[#0c1a18] focus:ring-4 focus:ring-emerald-300/10";

function getTodayValue() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
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
  if (error.code === error.PERMISSION_DENIED) {
    return "Permesso posizione negato.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Posizione non disponibile.";
  }

  if (error.code === error.TIMEOUT) {
    return "Timeout nel rilevamento della posizione.";
  }

  return "Permesso posizione negato o non disponibile";
}

function createSessionId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random()}`
  );
}

function debugLog(message: string, payload?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.log(message, payload);
  }
}

function getSaveMessage(catchesCount: number) {
  if (catchesCount === 0) {
    return "Sessione salvata correttamente senza catture";
  }

  if (catchesCount === 1) {
    return "Sessione salvata correttamente con 1 cattura";
  }

  return `Sessione salvata correttamente con ${catchesCount} catture`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-xl shadow-black/20">
      <h2 className="mb-4 text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
        <Icon aria-hidden="true" className="text-emerald-200/80" size={16} />
        {label}
      </span>
      {children}
    </label>
  );
}

export function NewSessionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const todayValue = getTodayValue();
  const [catches, setCatches] = useState<CatchEntry[]>([]);
  const [draftCatch, setDraftCatch] = useState<Omit<CatchEntry, "id">>({
    weight: "",
    length: "",
    bait: "",
    time: "",
    notes: "",
  });
  const [catchError, setCatchError] = useState("");
  const [catchMessage, setCatchMessage] = useState("");
  const [dateError, setDateError] = useState("");
  const [location, setLocation] = useState<SpotLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveMessage("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [saveMessage]);

  function updateDraft(field: keyof Omit<CatchEntry, "id">, value: string) {
    if (field === "weight") {
      setCatchError("");
    }

    setCatchMessage("");
    setDraftCatch((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addCatch() {
    if (!draftCatch.weight.trim()) {
      setCatchError("Inserisci almeno il peso per aggiungere la cattura.");
      return;
    }

    setCatchError("");
    setCatchMessage("Cattura aggiunta correttamente");
    setSaveMessage("");
    setCatches((current) => [
      ...current,
      {
        id: Date.now(),
        ...draftCatch,
      },
    ]);
    setDraftCatch({
      weight: "",
      length: "",
      bait: "",
      time: "",
      notes: "",
    });
  }

  function removeCatch(id: number) {
    setSaveMessage("");
    setCatchMessage("");
    setCatches((current) => current.filter((entry) => entry.id !== id));
  }

  function saveCurrentLocation() {
    setLocationMessage("");
    setSaveError("");
    setSaveMessage("");

    if (!window.isSecureContext && !isLocalhost()) {
      setLocation(null);
      setLocationMessage("La geolocalizzazione richiede HTTPS o localhost.");
      debugLog("[CarpLog] Geolocation blocked: insecure context", {
        isSecureContext: window.isSecureContext,
        hostname: window.location.hostname,
      });
      return;
    }

    if (!navigator.geolocation) {
      setLocation(null);
      setLocationMessage("La geolocalizzazione richiede HTTPS o localhost.");
      debugLog("[CarpLog] Geolocation unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        debugLog("[CarpLog] Coordinate ricevute", nextLocation);
        setLocation(nextLocation);
        setLocationMessage("Posizione salvata correttamente");
      },
      (error) => {
        setLocation(null);
        debugLog("[CarpLog] Geolocation error", {
          code: error.code,
          message: error.message,
        });
        setLocationMessage(getGeolocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  function handleDateChange(value: string) {
    setDateError(
      value > todayValue ? "La data della sessione non può essere futura." : "",
    );
    setSaveMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const sessionDate = String(formData.get("date") ?? "");

    if (sessionDate > todayValue) {
      setDateError("La data della sessione non può essere futura.");
      setSaveError("");
      setSaveMessage("");
      return;
    }

    setDateError("");
    setSaveError("");

    const storedSessions = readStoredSessions();
    const catchesToSave = draftCatch.weight.trim()
      ? [
          ...catches,
          {
            id: Date.now(),
            ...draftCatch,
          },
        ]
      : catches;

    const session: StoredSession = {
      id: createSessionId(),
      savedAt: new Date().toISOString(),
      session: {
        date: sessionDate,
        duration: String(formData.get("duration") ?? ""),
        spot: String(formData.get("spot") ?? ""),
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        weather: String(formData.get("weather") ?? ""),
        wind: String(formData.get("wind") ?? ""),
        temperature: String(formData.get("temperature") ?? ""),
        waterLevel: String(formData.get("waterLevel") ?? ""),
      },
      setup: {
        bait: String(formData.get("bait") ?? ""),
        rig: String(formData.get("rig") ?? ""),
        feeding: String(formData.get("feeding") ?? ""),
      },
      notes: String(formData.get("notes") ?? ""),
      catches: catchesToSave,
    };

    debugLog("[CarpLog] Coordinate salvate", {
      latitude: session.session.latitude,
      longitude: session.session.longitude,
    });

    try {
      localStorage.setItem(
        "carplog:sessions",
        JSON.stringify([...storedSessions, session]),
      );
      debugLog("[CarpLog] localStorage save ok", {
        key: "carplog:sessions",
        sessionsCount: storedSessions.length + 1,
      });
    } catch (error) {
      debugLog("[CarpLog] localStorage save error", error);
      setSaveError(
        "Salvataggio locale non riuscito. Controlla spazio disponibile o impostazioni privacy del browser.",
      );
      setSaveMessage("");
      return;
    }

    formRef.current?.reset();
    setCatches([]);
    setDraftCatch({
      weight: "",
      length: "",
      bait: "",
      time: "",
      notes: "",
    });
    setCatchError("");
    setCatchMessage("");
    setLocation(null);
    setLocationMessage("");
    setSaveMessage(getSaveMessage(catchesToSave.length));
  }

  return (
    <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
      {saveError ? (
        <div
          className="rounded-lg border border-red-300/25 bg-red-400/10 p-4 text-sm font-semibold text-red-100"
          role="alert"
        >
          {saveError}
        </div>
      ) : null}

      {saveMessage ? (
        <div
          className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-start gap-3 rounded-lg border border-emerald-300/30 bg-[#0d1b18] p-4 text-sm text-emerald-50 shadow-2xl shadow-black/50"
          aria-live="polite"
          role="status"
        >
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-400 text-[#07110e]">
            <Check aria-hidden="true" size={17} strokeWidth={2.6} />
          </span>
          <span>
            <span className="block font-bold">Sessione salvata correttamente</span>
            <span className="mt-1 block text-xs font-semibold text-emerald-100/75">
              {saveMessage}
            </span>
          </span>
        </div>
      ) : null}

      <Section title="Informazioni sessione">
        <div className="grid gap-4">
          <Field label="Data" icon={CalendarDays}>
            <input
              className={fieldBase}
              type="date"
              name="date"
              max={todayValue}
              required
              aria-invalid={dateError ? "true" : "false"}
              onChange={(event) => handleDateChange(event.target.value)}
            />
          </Field>
          {dateError ? (
            <p className="-mt-2 text-sm font-medium text-red-200">{dateError}</p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Durata" icon={Clock}>
              <input className={fieldBase} name="duration" placeholder="Es. 12h" />
            </Field>
            <Field label="Temperatura" icon={Thermometer}>
              <input className={fieldBase} name="temperature" placeholder="Es. 14 C" />
            </Field>
          </div>

          <Field label="Spot" icon={MapPinned}>
            <input
              className={fieldBase}
              name="spot"
              placeholder="Nome spot o postazione"
              required
            />
          </Field>

          <div className="rounded-lg border border-emerald-300/15 bg-[#07110e]/55 p-4">
            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-4 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/15"
              type="button"
              onClick={saveCurrentLocation}
            >
              <LocateFixed aria-hidden="true" size={18} />
              Salva posizione attuale
            </button>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              La posizione resta privata sul tuo dispositivo
            </p>
            {locationMessage ? (
              <p
                className={`mt-3 text-sm font-semibold ${
                  location ? "text-emerald-100" : "text-red-200"
                }`}
                role="status"
              >
                {locationMessage}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Meteo" icon={CloudSun}>
              <select className={fieldBase} name="weather" defaultValue="">
                <option value="" disabled>
                  Seleziona
                </option>
                <option>Sereno</option>
                <option>Nuvoloso</option>
                <option>Pioggia</option>
                <option>Nebbia</option>
                <option>Temporale</option>
              </select>
            </Field>
            <Field label="Vento" icon={Wind}>
              <select className={fieldBase} name="wind" defaultValue="">
                <option value="" disabled>
                  Seleziona
                </option>
                <option>Assente</option>
                <option>Leggero</option>
                <option>Moderato</option>
                <option>Forte</option>
              </select>
            </Field>
          </div>

          <Field label="Livello acqua" icon={Waves}>
            <select className={fieldBase} name="waterLevel" defaultValue="">
              <option value="" disabled>
                Seleziona livello
              </option>
              <option>Basso</option>
              <option>Normale</option>
              <option>Alto</option>
              <option>In crescita</option>
              <option>In calo</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Setup pesca">
        <div className="grid gap-4">
          <Field label="Esca usata" icon={Fish}>
            <input className={fieldBase} name="bait" placeholder="Boilies, mais, tiger nut..." />
          </Field>
          <Field label="Rig usato" icon={Gauge}>
            <input className={fieldBase} name="rig" placeholder="Hair rig, chod, ronnie..." />
          </Field>
          <Field label="Pasturazione" icon={Droplets}>
            <textarea
              className={`${fieldBase} min-h-24 resize-none py-3 leading-6`}
              name="feeding"
              placeholder="Quantita, mix, distanza, frequenza..."
            />
          </Field>
        </div>
      </Section>

      <Section title="Note">
        <textarea
          className={`${fieldBase} min-h-36 resize-none py-3 leading-6`}
          name="notes"
          placeholder="Condizioni, attivita del pesce, intuizioni da ricordare..."
        />
      </Section>

      <Section title="Catture">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso" icon={Gauge}>
              <input
                className={fieldBase}
                inputMode="decimal"
                placeholder="Es. 12,4 kg"
                aria-invalid={catchError ? "true" : "false"}
                value={draftCatch.weight}
                onChange={(event) => updateDraft("weight", event.target.value)}
              />
            </Field>
            <Field label="Lunghezza" icon={Ruler}>
              <input
                className={fieldBase}
                inputMode="decimal"
                placeholder="Es. 78 cm"
                value={draftCatch.length}
                onChange={(event) => updateDraft("length", event.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Esca" icon={Fish}>
              <input
                className={fieldBase}
                placeholder="Esca"
                value={draftCatch.bait}
                onChange={(event) => updateDraft("bait", event.target.value)}
              />
            </Field>
            <Field label="Ora" icon={Clock}>
              <input
                className={fieldBase}
                type="time"
                value={draftCatch.time}
                onChange={(event) => updateDraft("time", event.target.value)}
              />
            </Field>
          </div>

          <Field label="Note cattura" icon={Fish}>
            <textarea
              className={`${fieldBase} min-h-24 resize-none py-3 leading-6`}
              placeholder="Dettagli su mangiata, combattimento o posizione..."
              value={draftCatch.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
            />
          </Field>

          {catchError ? (
            <p className="-mt-1 text-sm font-medium text-red-200">{catchError}</p>
          ) : null}

          {catchMessage ? (
            <p className="-mt-1 text-sm font-semibold text-emerald-100" role="status">
              {catchMessage}
            </p>
          ) : null}

          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-4 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/15"
            type="button"
            onClick={addCatch}
          >
            <Plus aria-hidden="true" size={18} />
            Aggiungi cattura
          </button>

          {catches.length > 0 ? (
            <div className="space-y-3 pt-1">
              {catches.map((entry, index) => (
                <article
                  key={entry.id}
                  className="rounded-lg border border-emerald-300/15 bg-[#0b1715] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">
                        Cattura {index + 1}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {entry.time || "Ora non indicata"}
                      </p>
                    </div>
                    <button
                      aria-label={`Rimuovi cattura ${index + 1}`}
                      className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:border-red-300/30 hover:bg-red-400/10 hover:text-red-100"
                      type="button"
                      onClick={() => removeCatch(entry.id)}
                    >
                      <Trash2 aria-hidden="true" size={17} />
                    </button>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Peso</dt>
                      <dd className="mt-1 font-semibold text-white">
                        {entry.weight || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Lunghezza</dt>
                      <dd className="mt-1 font-semibold text-white">
                        {entry.length || "-"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-slate-500">Esca</dt>
                      <dd className="mt-1 font-semibold text-white">
                        {entry.bait || "-"}
                      </dd>
                    </div>
                  </dl>

                  {entry.notes ? (
                    <p className="mt-4 rounded-lg bg-white/[0.045] p-3 text-sm leading-6 text-slate-300">
                      {entry.notes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-black/10 p-4 text-sm leading-6 text-slate-400">
              Le catture aggiunte compariranno qui sotto, in card separate.
            </div>
          )}
        </div>
      </Section>

      <div className="grid gap-3 pt-1">
        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-bold text-[#07110e] shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300"
          type="submit"
        >
          <Save aria-hidden="true" size={18} />
          Salva sessione
        </button>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          href="/"
        >
          <Check aria-hidden="true" size={18} />
          Annulla
        </Link>
      </div>
    </form>
  );
}
