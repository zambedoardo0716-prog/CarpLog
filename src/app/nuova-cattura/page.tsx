import { PageHeader } from "@/components/page-header";
import { QuickCatchForm } from "@/components/quick-catch-form";

export default function NuovaCatturaPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Modalita rapida"
        title="Nuova cattura"
        description="Salva subito peso, ora e posizione quando conta fare pochi tocchi."
      />
      <QuickCatchForm />
    </div>
  );
}
