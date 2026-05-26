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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import {
  AREAS,
  AreaSlug,
  Obrigacao,
  Acao,
  StatusArea,
  areaNome,
} from "@/lib/domain";
import {
  areaProgress,
  pendenteCom,
  ultimaAtualizacaoArea,
  useStore,
} from "@/lib/store";
import { StatusBadge, CriticidadeBadge } from "./StatusBadge";
import { AreaLoginDialog } from "./AreaLoginDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_AREA_OPTIONS: StatusArea[] = [
  "Não iniciada",
  "Em andamento",
  "Atualizada",
  "Pendente",
  "Concluída",
  "Atrasada",
];

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
    toggleAcao,
    addCustomAcao,
    removeAcao,
    updateAreaStatus,
    obrigacoes,
  } = useStore();

  // Always read the latest from store
  const o = obrigacao ? obrigacoes.find((x) => x.id === obrigacao.id) ?? obrigacao : null;

  const [loginFor, setLoginFor] = React.useState<AreaSlug | null>(null);

  if (!o) return null;

  const prog = areaProgress(o);
  const ult = ultimaAtualizacaoArea(o);
  const pend = pendenteCom(o);
  const isAdmin = session?.kind === "admin";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-2xl lg:max-w-3xl"
      >
        {/* Header */}
        <SheetHeader className="space-y-3 border-b px-6 pb-5 pt-6">
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
                  <Badge className="gap-1 rounded-full border-0 bg-primary/10 text-primary hover:bg-primary/15">
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

          {/* NEXUS quick toggle (admin or nexus) */}
          {(isAdmin || canEditArea("nexus")) && (
            <div className="flex items-center justify-between rounded-xl border bg-primary/[0.04] px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-foreground">Marcar como ação necessária (NEXUS)</span>
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
          {/* Resumo */}
          <Section title="Resumo do impacto">
            <p className="text-sm leading-relaxed text-foreground/90">{o.impacto}</p>
            {o.resumo && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{o.resumo}</p>
            )}
          </Section>

          {/* Situação atual */}
          <Section title="Situação atual">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Info label="Última atualização" value={ult ? areaNome(ult.area) : "—"} />
              <Info label="Quando" value={fmtDateTime(ult?.iso)} />
              <Info
                label="Pendente com"
                value={pend ? areaNome(pend) : "Nenhuma"}
                accent={!!pend}
              />
              <Info label="Áreas atualizadas" value={`${prog.atualizadas}/${prog.total}`} />
            </div>
            <div className="mt-3">
              <Progress value={prog.pct} className="h-1.5" />
              <div className="mt-1 text-right text-[11px] text-muted-foreground">
                {prog.pct}% concluído
              </div>
            </div>
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
                  onRequestLogin={() => setLoginFor(a.slug)}
                  onChangeStatus={(s) =>
                    updateAreaStatus(o.id, a.slug, { status: s })
                  }
                  onChangeObs={(obs) =>
                    updateAreaStatus(o.id, a.slug, { observacoes: obs })
                  }
                  onChangeResp={(r) =>
                    updateAreaStatus(o.id, a.slug, { responsavel: r })
                  }
                  onToggleAcao={(id) => toggleAcao(o.id, id)}
                  onAddCustom={(nome) => addCustomAcao(o.id, a.slug, nome)}
                  onRemoveAcao={(id) => removeAcao(o.id, id)}
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
                {o.historico.slice(0, 8).map((h) => (
                  <li key={h.id} className="flex items-start gap-3 text-xs">
                    <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
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
        onAuthenticated={() => {
          toast.success("Você pode editar esta área.");
        }}
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
    <section className="rounded-2xl border bg-card p-4">
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

function Info({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 truncate text-sm font-medium",
          accent ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function AreaRow({
  area,
  obrigacao,
  canEdit,
  onRequestLogin,
  onChangeStatus,
  onChangeObs,
  onChangeResp,
  onToggleAcao,
  onAddCustom,
  onRemoveAcao,
}: {
  area: AreaSlug;
  obrigacao: Obrigacao;
  canEdit: boolean;
  onRequestLogin: () => void;
  onChangeStatus: (s: StatusArea) => void;
  onChangeObs: (v: string) => void;
  onChangeResp: (v: string) => void;
  onToggleAcao: (id: string) => void;
  onAddCustom: (nome: string) => void;
  onRemoveAcao: (id: string) => void;
}) {
  const st = obrigacao.areas[area];
  const acoesArea = obrigacao.acoes.filter((a) => a.area === area);
  const doneCount = acoesArea.filter((a) => a.concluida).length;
  const [newAcao, setNewAcao] = React.useState("");
  const aNome = areaNome(area);

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
            <span>
              {doneCount}/{acoesArea.length} ações
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
        {!canEdit && (
          <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <span>Para editar esta área, faça login com a conta de {aNome}.</span>
            <Button size="sm" variant="outline" onClick={onRequestLogin}>
              Entrar para editar
            </Button>
          </div>
        )}

        {/* Meta fields */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Status
            </label>
            <Select
              value={st.status}
              onValueChange={(v) => onChangeStatus(v as StatusArea)}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_AREA_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Responsável
            </label>
            <Input
              className="h-9 text-xs"
              value={st.responsavel}
              disabled={!canEdit}
              onChange={(e) => onChangeResp(e.target.value)}
              placeholder="Nome"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Última atualização
            </label>
            <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-xs text-muted-foreground">
              {fmtDateTime(st.ultimaAtualizacao)}{" "}
              {st.atualizadoPor && <span className="ml-1">· {st.atualizadoPor}</span>}
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Checklist da área
            </span>
            <span className="text-[10px] text-muted-foreground">
              {doneCount}/{acoesArea.length}
            </span>
          </div>
          <ul className="space-y-1">
            {acoesArea.length === 0 && (
              <li className="rounded-lg border border-dashed px-3 py-3 text-center text-[11px] text-muted-foreground">
                Sem itens. Adicione ações customizadas abaixo.
              </li>
            )}
            {acoesArea.map((a) => (
              <li
                key={a.id}
                className="group flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5"
              >
                <Checkbox
                  checked={a.concluida}
                  disabled={!canEdit}
                  onCheckedChange={() => onToggleAcao(a.id)}
                />
                <span
                  className={cn(
                    "flex-1 text-xs",
                    a.concluida && "text-muted-foreground line-through"
                  )}
                >
                  {a.nome}
                </span>
                {a.origem === "custom" && (
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                    custom
                  </span>
                )}
                {canEdit && a.origem === "custom" && (
                  <button
                    onClick={() => onRemoveAcao(a.id)}
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {a.concluida && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </li>
            ))}
          </ul>

          {canEdit && (
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
            disabled={!canEdit}
            onChange={(e) => onChangeObs(e.target.value)}
            placeholder="Anote bloqueios, decisões, próximos passos..."
            rows={2}
            className="mt-1 text-xs"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
