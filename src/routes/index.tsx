import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Settings2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreProvider, useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { Filters, DEFAULT_FILTERS, FilterValues } from "@/components/Filters";
import { CalendarGrid } from "@/components/CalendarGrid";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ImpactDetailDrawer } from "@/components/ImpactDetailDrawer";
import { NewObrigacaoDrawer } from "@/components/NewObrigacaoDrawer";
import { NewEventoDrawer } from "@/components/NewEventoDrawer";
import { ManageTemplatesDrawer } from "@/components/ManageTemplatesDrawer";
import { Obrigacao } from "@/lib/domain";
import { isAreaAvaliada } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: () => (
    <StoreProvider>
      <Page />
      <Toaster position="top-right" richColors />
    </StoreProvider>
  ),
});

function Page() {
  const { obrigacoes, eventos } = useStore();
  const [filters, setFilters] = React.useState<FilterValues>(DEFAULT_FILTERS);
  const [selected, setSelected] = React.useState<Obrigacao | null>(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [evtOpen, setEvtOpen] = React.useState(false);
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
      if (filters.nexus === "yes" && o.requerValidacaoNexus === false) return false;
      if (filters.nexus === "no" && o.requerValidacaoNexus !== false) return false;
      if (filters.area !== "all") {
        if (isAreaAvaliada(o, filters.area as never)) return false;
      }
      if (filters.vencimento === "60d") {
        const d = new Date(o.dataVencimento + "T00:00:00").getTime();
        const days = (d - Date.now()) / 86400000;
        if (days < 0 || days > 60) return false;
      }
      return true;
    });
  }, [obrigacoes, filters]);

  const eventosFiltrados = React.useMemo(() => {
    if (filters.area === "all") return eventos;
    return eventos.filter((e) => e.area === filters.area);
  }, [eventos, filters.area]);

  // Permite abrir um impacto via ?impacto=ID (links de notificação)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("impacto");
    if (p) {
      const o = obrigacoes.find((x) => x.id === p);
      if (o) setSelected(o);
    }
  }, [obrigacoes]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1500px] space-y-5 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="sm:hidden">
            <h1 className="text-lg font-semibold">
              Calendário de Gestão de Impactos 2026
            </h1>
            <p className="text-xs text-muted-foreground">
              Visão estratégica para antecipação e preparação dos principais temas do ano.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setTplOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Gerenciar obrigações
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setEvtOpen(true)}>
              <CalendarPlus className="h-4 w-4" />
              Novo evento
            </Button>
            <Button className="gap-2" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova obrigação
            </Button>
          </div>
        </div>

        <Dashboard
          obrigacoes={obrigacoes}
          eventos={eventos}
          onOpenObrigacao={(o) => setSelected(o)}
        />

        <Filters value={filters} onChange={setFilters} />

        <CalendarGrid
          obrigacoes={filtered}
          eventos={eventosFiltrados}
          onSelect={(o) => setSelected(o)}
        />
      </main>

      <ImpactDetailDrawer
        obrigacao={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
      <NewObrigacaoDrawer open={newOpen} onOpenChange={setNewOpen} />
      <NewEventoDrawer open={evtOpen} onOpenChange={setEvtOpen} />
      <ManageTemplatesDrawer open={tplOpen} onOpenChange={setTplOpen} />
    </div>
  );
}
