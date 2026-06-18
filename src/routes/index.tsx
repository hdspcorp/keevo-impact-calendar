import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Settings2, CalendarPlus, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreProvider, useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { Filters, DEFAULT_FILTERS, FilterValues } from "@/components/Filters";
import { CalendarGrid } from "@/components/CalendarGrid";
import { MyAreaCards, AreaDrillKind } from "@/components/MyAreaCards";
import { AreaItemsDrawer } from "@/components/AreaItemsDrawer";
import { ImpactDetailDrawer } from "@/components/ImpactDetailDrawer";
import { NewObrigacaoDrawer } from "@/components/NewObrigacaoDrawer";
import { NewEventoDrawer } from "@/components/NewEventoDrawer";
import { ManageTemplatesDrawer } from "@/components/ManageTemplatesDrawer";
import { AreaSlug, Obrigacao } from "@/lib/domain";
import { isAreaAvaliada, proximaPendente } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: () => (
    <StoreProvider>
      <Page />
      <Toaster position="top-right" richColors />
    </StoreProvider>
  ),
});

type Tab = "todos" | "minha";

function Page() {
  const { obrigacoes, eventos, session } = useStore();
  const [filters, setFilters] = React.useState<FilterValues>(DEFAULT_FILTERS);
  const [tab, setTab] = React.useState<Tab>("todos");
  const [selected, setSelected] = React.useState<Obrigacao | null>(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [evtOpen, setEvtOpen] = React.useState(false);
  const [tplOpen, setTplOpen] = React.useState(false);
  const [drill, setDrill] = React.useState<AreaDrillKind | null>(null);

  const isPublic = !session;
  const isAdmin = session?.kind === "admin";
  const userArea: AreaSlug | null = session?.kind === "area" ? session.area : null;
  // Admin não tem "minha área" — força aba Todos.
  const effectiveTab: Tab = isPublic || isAdmin ? "todos" : tab;

  // Reset para "todos" quando logar/deslogar
  React.useEffect(() => {
    setTab("todos");
  }, [session?.email]);

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

  // Em "Minha área" prioriza itens da área logada
  const calendarItems = React.useMemo(() => {
    if (effectiveTab === "minha" && userArea) {
      return filtered.filter(
        (o) => !isAreaAvaliada(o, userArea) || proximaPendente(o) === userArea
      );
    }
    return filtered;
  }, [filtered, effectiveTab, userArea]);

  const eventosVisiveis = React.useMemo(() => {
    let base = eventos;
    if (filters.area !== "all") base = base.filter((e) => e.area === filters.area);
    if (effectiveTab === "minha" && userArea) base = base.filter((e) => e.area === userArea);
    return base;
  }, [eventos, filters.area, effectiveTab, userArea]);

  // Abre impacto via ?impacto=ID
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("impacto");
    if (p) {
      const o = obrigacoes.find((x) => x.id === p);
      if (o) setSelected(o);
    }
  }, [obrigacoes]);

  // Drill "proxima-acao" abre direto o impacto
  React.useEffect(() => {
    if (drill?.kind === "proxima-acao") {
      const o = obrigacoes.find((x) => x.id === drill.obrigacaoId);
      if (o) {
        setSelected(o);
        setDrill(null);
      }
    }
  }, [drill, obrigacoes]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1500px] space-y-5 px-6 py-6">
        {/* Linha de ações + abas */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs só após login */}
          {!isPublic ? (
            <div className="inline-flex rounded-xl border bg-card p-1">
              <TabButton
                active={effectiveTab === "todos"}
                onClick={() => setTab("todos")}
                icon={<Globe className="h-4 w-4" />}
              >
                Todos
              </TabButton>
              {userArea && (
                <TabButton
                  active={effectiveTab === "minha"}
                  onClick={() => setTab("minha")}
                  icon={<User className="h-4 w-4" />}
                >
                  Minha área
                </TabButton>
              )}
            </div>
          ) : (
            <span />
          )}

          {/* Botões só após login */}
          {!isPublic && (
            <div className="flex flex-wrap items-center gap-2">
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
          )}
        </div>

        {/* Cards superiores: apenas na visão Minha área */}
        {effectiveTab === "minha" && userArea && (
          <MyAreaCards
            area={userArea}
            obrigacoes={obrigacoes}
            eventos={eventos}
            onDrill={setDrill}
          />
        )}

        <Filters value={filters} onChange={setFilters} />

        <CalendarGrid
          obrigacoes={calendarItems}
          eventos={eventosVisiveis}
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

      {userArea && (
        <AreaItemsDrawer
          drill={drill}
          area={userArea}
          obrigacoes={obrigacoes}
          eventos={eventos}
          onOpenObrigacao={(o) => setSelected(o)}
          onOpenChange={(v) => !v && setDrill(null)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
