import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreProvider, useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { SummaryCards } from "@/components/SummaryCards";
import { Filters, DEFAULT_FILTERS, FilterValues } from "@/components/Filters";
import { CalendarGrid } from "@/components/CalendarGrid";
import { PendingPanel } from "@/components/PendingPanel";
import { ImpactDetailDrawer } from "@/components/ImpactDetailDrawer";
import { NewObrigacaoDrawer } from "@/components/NewObrigacaoDrawer";
import { ManageTemplatesDrawer } from "@/components/ManageTemplatesDrawer";
import { Obrigacao } from "@/lib/domain";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: () => (
    <StoreProvider>
      <Dashboard />
      <Toaster position="top-right" richColors />
    </StoreProvider>
  ),
});

function Dashboard() {
  const { obrigacoes } = useStore();
  const [filters, setFilters] = React.useState<FilterValues>(DEFAULT_FILTERS);
  const [selected, setSelected] = React.useState<Obrigacao | null>(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [tplOpen, setTplOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    return obrigacoes.filter((o) => {
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (
          !o.nome.toLowerCase().includes(q) &&
          !o.linhaModulo.toLowerCase().includes(q) &&
          !o.impacto.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.status !== "all" && o.statusGeral !== filters.status) return false;
      if (filters.tipo !== "all" && o.tipo !== filters.tipo) return false;
      if (filters.acao === "yes" && !o.acaoNecessaria) return false;
      if (filters.acao === "no" && o.acaoNecessaria) return false;
      if (filters.area !== "all") {
        const st = o.areas[filters.area as keyof typeof o.areas]?.status;
        if (!st || st === "Atualizada" || st === "Concluída") return false;
      }
      return true;
    });
  }, [obrigacoes, filters]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-[1500px] space-y-5 px-6 py-6">
        {/* Top actions */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="sm:hidden">
            <h1 className="text-lg font-semibold">Calendário de Gestão de Impactos 2026</h1>
            <p className="text-xs text-muted-foreground">
              Visão estratégica para antecipação e preparação dos principais temas do ano.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setTplOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Gerenciar obrigações
            </Button>
            <Button className="gap-2" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova obrigação
            </Button>
          </div>
        </div>

        <SummaryCards obrigacoes={obrigacoes} />

        <Filters value={filters} onChange={setFilters} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <CalendarGrid obrigacoes={filtered} onSelect={(o) => setSelected(o)} />
          <PendingPanel obrigacoes={obrigacoes} onSelect={(o) => setSelected(o)} />
        </div>
      </main>

      <ImpactDetailDrawer
        obrigacao={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
      <NewObrigacaoDrawer open={newOpen} onOpenChange={setNewOpen} />
      <ManageTemplatesDrawer open={tplOpen} onOpenChange={setTplOpen} />
    </div>
  );
}
