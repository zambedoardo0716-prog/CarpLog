import { PageHeader } from "@/components/page-header";
import { MapPinned } from "lucide-react";

export default function SpotPage() {
  return (
    <>
      <PageHeader
        eyebrow="Acque"
        title="Spot"
        description="Qui ritroverai i tuoi posti di pesca. Per ora gli spot vengono salvati dentro le sessioni."
      />
      <section className="carp-rise rounded-lg border border-dashed border-teal-700/20 bg-slate-900/72 p-5 text-center shadow-xl shadow-teal-950/16">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-teal-700/15 text-teal-100">
          <MapPinned aria-hidden="true" size={23} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white">
          Spot personali
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Salva una sessione con nome spot e, se sei sul posto, posizione GPS.
        </p>
      </section>
    </>
  );
}
