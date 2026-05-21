import { PageHeader } from "@/components/page-header";
import { NewSessionForm } from "@/components/new-session-form";

export default function NuovaSessionePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sessioni"
        title="Nuova sessione"
        description="Registra condizioni, setup e catture della giornata. Per ora tutto resta locale nella schermata."
      />
      <NewSessionForm />
    </div>
  );
}
