import { PageHeader } from "@/components/page-header";
import { SessionHistory } from "@/components/session-history";

export default function StoricoPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Archivio"
        title="Storico"
        description="Sessioni salvate temporaneamente sul browser, filtrabili per risultato."
      />
      <SessionHistory />
    </div>
  );
}
