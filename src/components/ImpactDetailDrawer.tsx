import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarDays,
  Lock,
  Pencil,
  Plus,
  Star,
  Trash2,
  Sparkles,
  History,
  CheckCircle2,
  MinusCircle,
  RotateCcw,
  ShieldCheck,
  Pin,
} from "lucide-react";
import {
  AREAS,
  AreaSlug,
  Obrigacao,
  Acao,
  areaNome,
} from "@/lib/domain";
import {
  acoesSelecionadasDaArea,
  areaStatusResumo,
  useStore,
} from "@/lib/store";
import { StatusBadge, CriticidadeBadge } from "./StatusBadge";
import { StatusTrail } from "./StatusTrail";
import { AreaLoginDialog } from "./AreaLoginDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ImpactDetailDrawer({
  obrigacao,
  open,
  onOpenChange,
}: {
  obrigacao: Obrigacao | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const {
    session,
    canEditArea,
    toggleAcaoNecessaria,
    toggleAcaoSelecionada,
    addCustomAcao,
    removeAcao,
    promoteCustomToTemplate,
    updateAreaMeta,
    concluirArea,
    marcarSemAcao,
    reabrirArea,
    obrigacoes,
  } = useStore();

  const o = obrigacao ? obrigacoes.find((x) => x.id === obrigacao.id) ?? obrigacao : null;
  const [loginFor, setLoginFor] = React.useState<AreaSlug | null>(null);

  if (!o) return null;

  const isAdmin = session?.kind === "admin";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-2xl lg:max-w-3xl"
      >
        {/* Header */}
        <SheetHeader className="space-y-3 border-b bg-gradient-to-b from-primary/[0.04] to-transparent px-6 pb-5 pt-6">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {o.linhaModulo}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {o.tipo}
                </span>
                <CriticidadeBadge value={o.criticidade} />
                {o.acaoNecessaria && (
                  <Badge className="gap-1 rounded-full border-0 bg-primary/12 text-primary hover:bg-primary/18">
                    <Star className="h-3 w-3 fill-primary" />
                    Ação necessária
                  </Badge>
                )}
              </div>
              <SheetTitle className="mt-2 text-xl font-semibold leading-tight">
                {o.nome}
              </SheetTitle>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Vence em{" "}
                  {new Date(o.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
                <StatusBadge status={o.statusGeral} />
              </div>
            </div>
          </div>

          {/* NEXUS quick toggle */}
          {(isAdmin || canEditArea("nexus")) && (
            <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-foreground">
                  Marcar como ação necessária (NEXUS)
                </span>
              </div>
              <Button
                size="sm"
                variant={o.acaoNecessaria ? "default" : "outline"}
                onClick={() => toggleAcaoNecessaria(o.id)}
              >
                {o.acaoNecessaria ? "Ativada" : "Ativar"}
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          <Section title="Resumo do impacto">
            <p className="text-sm leading-relaxed text-foreground/90">{o.impacto}</p>
            {o.resumo && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {o.resumo}
              </p>
            )}
          </Section>

          {/* Trilha de status (substitui "Situação atual") */}
          <Section title="Trilha de status">
            <StatusTrail obrigacao={o} />
          </Section>

          {/* Situação por área */}
          <Section title="Situação por área">
            <Accordion type="single" collapsible className="space-y-1.5">
              {AREAS.map((a) => (
                <AreaRow
                  key={a.slug}
                  area={a.slug}
                  obrigacao={o}
                  canEdit={canEditArea(a.slug)}
                  isAdmin={isAdmin}
                  onRequestLogin={() => setLoginFor(a.slug)}
                  onChangeObs={(obs) =>
                    updateAreaMeta(o.id, a.slug, { observacoes: obs })
                  }
                  onChangeResp={(r) =>
                    updateAreaMeta(o.id, a.slug, { responsavel: r })
                  }
                  onChangePrazo={(p) => updateAreaMeta(o.id, a.slug, { prazo: p })}
                  onToggleAcao={(id) => toggleAcaoSelecionada(o.id, id)}
                  onAddCustom={(nome) => addCustomAcao(o.id, a.slug, nome)}
                  onRemoveAcao={(id) => removeAcao(o.id, id)}
                  onPromote={(id) => {
                    promoteCustomToTemplate(o.id, id);
                    toast.success("Ação adicionada ao template da área.");
                  }}
                  onPronto={() => {
                    const ok = concluirArea(o.id, a.slug);
                    if (!ok) {
                      toast.error(
                        "Selecione uma ação ou informe que nenhuma ação será necessária."
                      );
                    } else {
                      toast.success(`${areaNome(a.slug)} concluiu a avaliação.`);
                    }
                  }}
                  onSemAcao={() => {
                    marcarSemAcao(o.id, a.slug);
                    toast.success(
                      `${areaNome(a.slug)} declarou que nenhuma ação será necessária.`
                    );
                  }}
                  onReabrir={() => {
                    reabrirArea(o.id, a.slug);
                    toast.message("Avaliação reaberta.");
                  }}
                />
              ))}
            </Accordion>
          </Section>

          {/* Histórico */}
          <Section
            title="Histórico recente"
            icon={<History className="h-3.5 w-3.5 text-muted-foreground" />}
          >
            {o.historico.length === 0 ? (
              <div className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                Nenhuma alteração registrada ainda.
              </div>
            ) : (
              <ul className="space-y-2">
                {o.historico.slice(0, 10).map((h) => (
                  <li key={h.id} className="flex items-start gap-3 text-xs">
                    <div
                      className={cn(
                        "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                        h.tipo === "pronto"
                          ? "bg-emerald-500"
                          : h.tipo === "sem-acao"
                            ? "bg-slate-400"
                            : h.tipo === "reabertura"
                              ? "bg-orange-400"
                              : h.tipo === "nexus-acao-necessaria"
                                ? "bg-primary"
                                : "bg-primary/40"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground">
                        <span className="font-medium">{h.usuario}</span>{" "}
                        <span className="text-muted-foreground">
                          ({areaNome(h.area)})
                        </span>{" "}
                        — {h.descricao}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {fmtDateTime(h.data)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </SheetContent>

      <AreaLoginDialog
        open={!!loginFor}
        onOpenChange={(v) => !v && setLoginFor(null)}
        forceArea={loginFor ?? undefined}
        onAuthenticated={() => toast.success("Você pode editar esta área.")}
      />
    </Sheet>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function AreaRow({
  area,
  obrigacao,
  canEdit,
  isAdmin,
  onRequestLogin,
  onChangeObs,
  onChangeResp,
  onChangePrazo,
  onToggleAcao,
  onAddCustom,
  onRemoveAcao,
  onPromote,
  onPronto,
  onSemAcao,
  onReabrir,
}: {
  area: AreaSlug;
  obrigacao: Obrigacao;
  canEdit: boolean;
  isAdmin: boolean;
  onRequestLogin: () => void;
  onChangeObs: (v: string) => void;
  onChangeResp: (v: string) => void;
  onChangePrazo: (v: string) => void;
  onToggleAcao: (id: string) => void;
  onAddCustom: (nome: string) => void;
  onRemoveAcao: (id: string) => void;
  onPromote: (id: string) => void;
  onPronto: () => void;
  onSemAcao: () => void;
  onReabrir: () => void;
}) {
  const st = obrigacao.areas[area];
  const acoesArea = obrigacao.acoes.filter((a) => a.area === area);
  const selected = acoesArea.filter((a) => a.selecionada);
  const [newAcao, setNewAcao] = React.useState("");
  const aNome = areaNome(area);

  const isClosed = st.status === "Concluída" || st.status === "Sem ação necessária";
  const editable = canEdit && !isClosed;

  return (
    <AccordionItem
      value={area}
      className="overflow-hidden rounded-xl border bg-background"
    >
      <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
        <div className="flex w-full items-center justify-between gap-3 pr-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-sm font-medium text-foreground">{aNome}</span>
            <StatusBadge status={st.status} />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">
              {areaStatusResumo(obrigacao, area)}
            </span>
            {canEdit ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <Pencil className="h-3 w-3" /> liberada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" /> bloqueada
              </span>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="space-y-3 border-t bg-card/40 px-3 pb-4 pt-3">
        {/* Aviso topo */}
        {canEdit ? (
          <div className="flex items-center gap-2 rounded-lg bg-primary/[0.06] px-3 py-1.5 text-[11px] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Editando como <strong>{aNome}</strong>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <span>Modo leitura. Para editar, faça login como {aNome}.</span>
            <Button size="sm" variant="outline" onClick={onRequestLogin}>
              Entrar para editar
            </Button>
          </div>
        )}

        {/* Estado e meta */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Meta label="Responsável">
            <Input
              className="h-9 text-xs"
              value={st.responsavel}
              disabled={!editable}
              onChange={(e) => onChangeResp(e.target.value)}
              placeholder="Nome"
            />
          </Meta>
          <Meta label="Prazo (opcional)">
            <Input
              type="date"
              className="h-9 text-xs"
              value={st.prazo ?? ""}
              disabled={!editable}
              onChange={(e) => onChangePrazo(e.target.value)}
            />
          </Meta>
          <Meta label="Última atualização">
            <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-xs text-muted-foreground">
              {fmtDateTime(st.ultimaAtualizacao)}
              {st.atualizadoPor && (
                <span className="ml-1 truncate">· {st.atualizadoPor}</span>
              )}
            </div>
          </Meta>
        </div>

        {/* Estado da avaliação */}
        <div
          className={cn(
            "rounded-xl border px-3 py-2 text-[11px]",
            st.status === "Concluída"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : st.status === "Sem ação necessária"
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : selected.length > 0
                  ? "border-primary/20 bg-primary/[0.05] text-primary"
                  : "border-border bg-muted/40 text-muted-foreground"
          )}
        >
          {st.status === "Concluída" && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Avaliação concluída — {selected.length} ação(ões) selecionadas
            </span>
          )}
          {st.status === "Sem ação necessária" && (
            <span className="inline-flex items-center gap-1">
              <MinusCircle className="h-3.5 w-3.5" />
              A área declarou que nenhuma ação será necessária.
            </span>
          )}
          {st.status !== "Concluída" && st.status !== "Sem ação necessária" && (
            <span>
              {selected.length > 0
                ? `${selected.length} ação(ões) marcada(s). Clique em PRONTO para concluir.`
                : "Marque as ações necessárias ou informe que nenhuma será necessária."}
            </span>
          )}
        </div>

        {/* Checklist */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Ações disponíveis para esta área
            </span>
            <span className="text-[10px] text-muted-foreground">
              {selected.length}/{acoesArea.length} marcadas
            </span>
          </div>
          <ul className="space-y-1">
            {acoesArea.length === 0 && (
              <li className="rounded-lg border border-dashed px-3 py-3 text-center text-[11px] text-muted-foreground">
                Nenhuma ação padrão configurada. Adicione uma ação customizada abaixo.
              </li>
            )}
            {acoesArea.map((a) => (
              <ActionItem
                key={a.id}
                a={a}
                editable={editable}
                isAdmin={isAdmin}
                onToggle={() => onToggleAcao(a.id)}
                onRemove={() => onRemoveAcao(a.id)}
                onPromote={() => onPromote(a.id)}
              />
            ))}
          </ul>

          {editable && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newAcao.trim()) return;
                onAddCustom(newAcao.trim());
                setNewAcao("");
              }}
              className="mt-2 flex gap-2"
            >
              <Input
                value={newAcao}
                onChange={(e) => setNewAcao(e.target.value)}
                placeholder="Adicionar ação customizada..."
                className="h-9 text-xs"
              />
              <Button type="submit" size="sm" variant="outline" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </form>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Observações da área
          </label>
          <Textarea
            value={st.observacoes}
            disabled={!editable}
            onChange={(e) => onChangeObs(e.target.value)}
            placeholder="Anote bloqueios, decisões, próximos passos..."
            rows={2}
            className="mt-1 text-xs"
          />
        </div>

        {/* Ações principais */}
        {canEdit && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
            {isClosed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onReabrir}
                className="gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reabrir avaliação
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSemAcao}
                  className="gap-1 border-slate-300"
                >
                  <MinusCircle className="h-3.5 w-3.5" />
                  Não será necessária nenhuma ação
                </Button>
                <Button
                  size="sm"
                  onClick={onPronto}
                  className="gap-1 px-5"
                  disabled={selected.length === 0}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> PRONTO
                </Button>
              </>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionItem({
  a,
  editable,
  isAdmin,
  onToggle,
  onRemove,
  onPromote,
}: {
  a: Acao;
  editable: boolean;
  isAdmin: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onPromote: () => void;
}) {
  return (
    <li
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors",
        a.selecionada ? "border-primary/30 bg-primary/[0.04]" : "border-border bg-background"
      )}
    >
      <Checkbox
        checked={a.selecionada}
        disabled={!editable}
        onCheckedChange={onToggle}
      />
      <span className={cn("flex-1 text-xs", a.selecionada && "text-foreground font-medium")}>
        {a.nome}
      </span>
      {a.origem === "custom" && (
        <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-accent">
          custom
        </span>
      )}
      {isAdmin && a.origem === "custom" && (
        <button
          onClick={onPromote}
          title="Adicionar ao template da área"
          className="text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
      )}
      {editable && a.origem === "custom" && (
        <button
          onClick={onRemove}
          title="Remover"
          className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}
