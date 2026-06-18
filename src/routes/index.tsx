import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Settings2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { StoreProvider, useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { AppSidebar, SidebarSection } from "@/components/AppSidebar";
import { Filters, DEFAULT_FILTERS, FilterValues } from "@/components/Filters";
import { CalendarGrid } from "@/components/CalendarGrid";
import { MyAreaCards, AreaDrillKind } from "@/components/MyAreaCards";
import { AreaItemsDrawer } from "@/components/AreaItemsDrawer";
import { ImpactDetailDrawer } from "@/components/ImpactDetailDrawer";
import { NewObrigacaoDrawer } from "@/components/NewObrigacaoDrawer";
import { NewEventoDrawer } from "@/components/NewEventoDrawer";
import { ManageTemplatesDrawer } from "@/components/ManageTemplatesDrawer";
import { AdminUsersPage } from "@/components/admin/AdminUsersPage";
import { AdminSettingsPage } from "@/components/admin/AdminSettingsPage";
import { ConflitosDrawer } from "@/components/ConflitosDrawer";
import { AreaSlug, Obrigacao } from "@/lib/domain";
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
  // Sidebar só existe para usuário logado; começa recolhida e persiste preferência.
  const [open, setOpen] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(SIDEBAR_OPEN_KEY);
      return raw === "1";
    } catch {
      return false;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_OPEN_KEY, open ? "1" : "0");
    } catch {}
  }, [open]);

  // Aplica cor primária configurada no :root.
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
  const { obrigacoes, eventos, session } = useStore();
  const [filters, setFilters] = React.useState<FilterValues>(DEFAULT_FILTERS);
  const [section, setSection] = React.useState<SidebarSection>("calendario");
  const [selected, setSelected] = React.useState<Obrigacao | null>(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [evtOpen, setEvtOpen] = React.useState(false);
  const [tplOpen, setTplOpen] = React.useState(false);
  const [drill, setDrill] = React.useState<AreaDrillKind | null>(null);

  const isPublic = !session;
  const isAdmin = session?.kind === "admin";
  const userArea: AreaSlug | null = session?.kind === "area" ? session.area : null;

  // Reset para "Calendário" quando logar/deslogar
  React.useEffect(() => {
    setSection("calendario");
  }, [session?.email]);

  // Conflitos para badge da sidebar + central de notificações
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

  // Em "Minha área" prioriza itens da área logada
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

  const [conflitosOpen, setConflitosOpen] = React.useState(false);
  const [adminPage, setAdminPage] = React.useState<"usuarios" | "configuracoes" | null>(null);

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

  // Admin não tem visão "minha área" — força "calendario"
  const effectiveSection: SidebarSection =
    isPublic || isAdmin || !userArea
      ? section === "minha-area"
        ? "calendario"
        : section
      : section;

  const showCalendario = adminPage === null;

  const content = (
    <SidebarInset className="min-w-0">
      <Header notificacoesCount={conflitos.length} onOpenNotificacoes={() => setConflitosOpen(true)} />

      {/* Barra sticky de ações — apenas admin pode criar */}
      {isAdmin && showCalendario && (
        <div className="sticky top-14 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-2.5 sm:px-6">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setTplOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
              Gerenciar obrigações
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setEvtOpen(true)}
            >
              <CalendarPlus className="h-4 w-4" />
              Novo evento
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova obrigação
            </Button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-5 sm:px-6">
        {adminPage === "usuarios" && <AdminUsersPage />}
        {adminPage === "configuracoes" && <AdminSettingsPage />}

        {showCalendario && (
          <>
            {isMinhaArea && userArea && (
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
          </>
        )}
      </main>

      <ImpactDetailDrawer
        obrigacao={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
      <NewObrigacaoDrawer open={newOpen} onOpenChange={setNewOpen} />
      <NewEventoDrawer open={evtOpen} onOpenChange={setEvtOpen} />
      <ManageTemplatesDrawer open={tplOpen} onOpenChange={setTplOpen} />
      <ConflitosDrawer
        open={conflitosOpen}
        onOpenChange={setConflitosOpen}
        conflitos={conflitos}
        obrigacoes={obrigacoes}
        onOpenObrigacao={(o) => setSelected(o)}
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

