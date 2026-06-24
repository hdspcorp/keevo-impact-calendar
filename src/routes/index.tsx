import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Settings2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { StoreProvider, useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { AppSidebar, SidebarSection } from "@/components/AppSidebar";
import { Filters, DEFAULT_FILTERS, FilterValues } from "@/components/Filters";
import { CalendarGrid } from "@/components/CalendarGrid";
import { MyAreaCards, AreaDrillKind } from "@/components/MyAreaCards";
import { AreaItemsDrawer } from "@/components/AreaItemsDrawer";
import { ImpactDetailDrawer } from "@/components/ImpactDetailDrawer";
import { EventoDetailDrawer } from "@/components/EventoDetailDrawer";
import { NewObrigacaoDrawer } from "@/components/NewObrigacaoDrawer";
import { NewEventoDrawer, EventoInicial } from "@/components/NewEventoDrawer";
import { ManageTemplatesDrawer } from "@/components/ManageTemplatesDrawer";
import { AdminUsersPage } from "@/components/admin/AdminUsersPage";
import { AdminSettingsPage } from "@/components/admin/AdminSettingsPage";
import { AdminAtalhosPage } from "@/components/admin/AdminAtalhosPage";
import { ConflitosDrawer } from "@/components/ConflitosDrawer";
import { AtalhosBar } from "@/components/AtalhosBar";
import { MetricsBar } from "@/components/MetricsBar";
import { AreaSlug, AtalhoEvento, Evento, Obrigacao } from "@/lib/domain";
import { isAreaAvaliada, proximaPendente } from "@/lib/store";
import { detectarConflitos } from "@/lib/conflitos";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const SIDEBAR_OPEN_KEY = "keevo-sidebar-open-v1";

export const Route = createFileRoute("/")({
  component: () => (
    <StoreProvider>
      <Shell />
      <Toaster position="top-right" richColors />
    </StoreProvider>
  ),
});

function Shell() {
  const { session, settings } = useStore();
  const [open, setOpen] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_OPEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_OPEN_KEY, open ? "1" : "0");
    } catch {}
  }, [open]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--primary",
      `oklch(${settings.corPrimaria})`
    );
  }, [settings.corPrimaria]);

  if (!session) {
    return <Page hideSidebar />;
  }
  return (
    <SidebarProvider open={open} onOpenChange={setOpen} defaultOpen={false}>
      <Page hideSidebar={false} />
    </SidebarProvider>
  );
}

function Page({ hideSidebar }: { hideSidebar: boolean }) {
  const { obrigacoes, eventos, atalhos, session } = useStore();
  const [filters, setFilters] = React.useState<FilterValues>(DEFAULT_FILTERS);
  const [section, setSection] = React.useState<SidebarSection>("calendario");
  const [selected, setSelected] = React.useState<Obrigacao | null>(null);
  const [selectedEvento, setSelectedEvento] = React.useState<Evento | null>(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [evtOpen, setEvtOpen] = React.useState(false);
  const [evtInitial, setEvtInitial] = React.useState<EventoInicial | undefined>(undefined);
  const [tplOpen, setTplOpen] = React.useState(false);
  const [drill, setDrill] = React.useState<AreaDrillKind | null>(null);

  const isPublic = !session;
  const isAdmin = session?.kind === "admin";
  const userArea: AreaSlug | null = session?.kind === "area" ? session.area : null;

  React.useEffect(() => {
    setSection("calendario");
  }, [session?.email]);

  const conflitos = React.useMemo(
    () => detectarConflitos(obrigacoes, eventos),
    [obrigacoes, eventos]
  );

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

  const isMinhaArea = section === "minha-area" && !!userArea;

  const calendarItems = React.useMemo(() => {
    if (isMinhaArea && userArea) {
      return filtered.filter(
        (o) => !isAreaAvaliada(o, userArea) || proximaPendente(o) === userArea
      );
    }
    return filtered;
  }, [filtered, isMinhaArea, userArea]);

  const eventosVisiveis = React.useMemo(() => {
    let base = eventos;
    if (filters.area !== "all") base = base.filter((e) => e.area === filters.area);
    if (isMinhaArea && userArea) base = base.filter((e) => e.area === userArea);
    return base;
  }, [eventos, filters.area, isMinhaArea, userArea]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("impacto");
    if (p) {
      const o = obrigacoes.find((x) => x.id === p);
      if (o) setSelected(o);
    }
  }, [obrigacoes]);

  React.useEffect(() => {
    if (drill?.kind === "proxima-acao") {
      const o = obrigacoes.find((x) => x.id === drill.obrigacaoId);
      if (o) {
        setSelected(o);
        setDrill(null);
      }
    }
  }, [drill, obrigacoes]);

  const [conflitosOpen, setConflitosOpen] = React.useState(false);
  const [adminPage, setAdminPage] = React.useState<
    "usuarios" | "configuracoes" | "atalhos" | null
  >(null);

  const handleNavigate = (s: SidebarSection) => {
    if (s === "minha-area" && !userArea) {
      toast.info("Faça login com um usuário de área para acessar a Minha área.");
      return;
    }
    if (s === "configuracoes") {
      if (!isAdmin) return;
      setAdminPage("configuracoes");
      setSection("configuracoes");
      return;
    }
    if (s === "usuarios") {
      if (!isAdmin) return;
      setAdminPage("usuarios");
      setSection("usuarios");
      return;
    }
    if (s === "atalhos") {
      if (!isAdmin) return;
      setAdminPage("atalhos");
      setSection("atalhos");
      return;
    }
    if (s === "templates") {
      if (!isAdmin) return;
      setTplOpen(true);
      return;
    }
    if (s === "relatorios") {
      toast.info("Relatórios em breve.");
      return;
    }
    if (s === "ajuda") {
      toast.info("Central de ajuda em breve.");
      return;
    }
    if (s === "conflitos") {
      setConflitosOpen(true);
      return;
    }
    setAdminPage(null);
    setSection(s);
  };

  const effectiveSection: SidebarSection =
    isPublic || isAdmin || !userArea
      ? section === "minha-area"
        ? "calendario"
        : section
      : section;

  const showCalendario = adminPage === null;

  const openAtalho = (a: AtalhoEvento) => {
    const hoje = new Date();
    const inicio = hoje.toISOString().slice(0, 10);
    const fim = new Date(hoje.getTime() + Math.max(0, a.duracaoDias - 1) * 86400000)
      .toISOString()
      .slice(0, 10);
    setEvtInitial({
      titulo: a.nome,
      area: a.area,
      tipo: a.tipo,
      relevancia: a.relevancia,
      geraConflito: a.geraConflito,
      descricao: a.descricao,
      dataInicio: inicio,
      dataFim: a.duracaoDias > 1 ? fim : "",
    });
    setEvtOpen(true);
  };

  const openNovoEvento = () => {
    setEvtInitial(undefined);
    setEvtOpen(true);
  };

  const content = (
    <SidebarInset className="min-w-0">
      <Header
        notificacoesCount={conflitos.length}
        onOpenNotificacoes={() => setConflitosOpen(true)}
      />

      {/* Barra superior: tabs (Todos/Minha área) e ações de criação para usuários logados */}
      {showCalendario && (
        <div className="sticky top-14 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
            {!!userArea && !isAdmin && (
              <Tabs
                value={section === "minha-area" ? "minha-area" : "todos"}
                onValueChange={(v) =>
                  setSection(v === "minha-area" ? "minha-area" : "calendario")
                }
              >
                <TabsList>
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="minha-area">Minha área</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setTplOpen(true)}
                >
                  <Settings2 className="h-4 w-4" />
                  Gerenciar obrigações
                </Button>
              )}
              {session && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={openNovoEvento}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Novo evento
                </Button>
              )}
              {isAdmin && (
                <Button size="sm" className="gap-2" onClick={() => setNewOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nova obrigação
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-5 sm:px-6">
        {adminPage === "usuarios" && <AdminUsersPage />}
        {adminPage === "configuracoes" && <AdminSettingsPage />}
        {adminPage === "atalhos" && <AdminAtalhosPage />}

        {showCalendario && (
          <>
            {session && <AtalhosBar atalhos={atalhos} onUse={openAtalho} />}

            {isMinhaArea && userArea && (
              <>
                <MetricsBar
                  obrigacoes={obrigacoes}
                  eventos={eventos}
                  conflitos={conflitos}
                  onOpenConflitos={() => setConflitosOpen(true)}
                />
                <MyAreaCards
                  area={userArea}
                  obrigacoes={obrigacoes}
                  eventos={eventos}
                  onDrill={setDrill}
                />
              </>
            )}

            <Filters value={filters} onChange={setFilters} />

            <CalendarGrid
              obrigacoes={calendarItems}
              eventos={eventosVisiveis}
              onSelect={(o) => setSelected(o)}
              onSelectEvento={(e) => setSelectedEvento(e)}
            />
          </>
        )}
      </main>

      <ImpactDetailDrawer
        obrigacao={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
      <EventoDetailDrawer
        evento={selectedEvento}
        open={!!selectedEvento}
        onOpenChange={(v) => !v && setSelectedEvento(null)}
      />
      <NewObrigacaoDrawer open={newOpen} onOpenChange={setNewOpen} />
      <NewEventoDrawer open={evtOpen} onOpenChange={setEvtOpen} initial={evtInitial} />
      <ManageTemplatesDrawer open={tplOpen} onOpenChange={setTplOpen} />
      <ConflitosDrawer
        open={conflitosOpen}
        onOpenChange={setConflitosOpen}
        conflitos={conflitos}
        obrigacoes={obrigacoes}
        eventos={eventos}
        onOpenObrigacao={(o) => setSelected(o)}
        onOpenEvento={(e) => setSelectedEvento(e)}
      />

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
    </SidebarInset>
  );

  if (hideSidebar) {
    return <div className="flex min-h-screen w-full">{content}</div>;
  }
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar
        active={effectiveSection}
        conflitosCount={conflitos.length}
        showMinhaArea={!!userArea}
        isAdmin={!!isAdmin}
        onNavigate={handleNavigate}
      />
      {content}
    </div>
  );
}
