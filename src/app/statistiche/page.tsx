import { PageHeader } from "@/components/page-header";
import { StatisticsDashboard } from "@/components/statistics-dashboard";

export default function StatistichePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analisi"
        title="Statistiche"
        description="Statistiche calcolate dalle sessioni salvate temporaneamente su questo browser."
      />
      <StatisticsDashboard />
    </div>
  );
}
