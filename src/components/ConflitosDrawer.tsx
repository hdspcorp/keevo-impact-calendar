import * as React from "react";
import { AlertTriangle, ArrowRight, CalendarDays, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Conflito } from "@/lib/conflitos";
import { Evento, Obrigacao, areaNome } from "@/lib/domain";

const PRI_STYLE: Record<Conflito["prioridade"], string> = {
  alta: "border-red-300 bg-red-50 text-red-700",
  media: "border-amber-300 bg-amber-50 text-amber-700",
  baixa: "border-zinc-300 bg-zinc-50 text-zinc-600",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  // aceita YYYY-MM-DD e ISO completo
  const d = iso.length === 10 ? new Date(iso + "T00:00:00") : new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function ConflitosDrawer({
  open,
  onOpenChange,
  conflitos,
  obrigacoes,
  eventos,
  onOpenObrigacao,
  onOpenEvento,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conflitos: Conflito[];
  obrigacoes: Obrigacao[];
  eventos?: Evento[];
  onOpenObrigacao: (o: Obrigacao) => void;
  onOpenEvento?: (e: Evento) => void;
}) {
  const findOb = (id?: string) => (id ? obrigacoes.find((o) => o.id === id) : undefined);
  const findEv = (id?: string) =>
    id && eventos ? eventos.find((e) => e.id === id) : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Painel de conflitos
            <Badge variant="secondary" className="ml-1">
              {conflitos.length}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Dois itens cujos períodos ou execuções se sobrepõem. Edite qualquer um para resolver.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {conflitos.length === 0 && (
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Nenhum conflito no momento.
            </div>
          )}
          {conflitos.map((c) => {
            const ob = findOb(c.obrigacaoId);
            const ev = findEv(c.eventoId);
            return (
              <article
                key={c.id}
                className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm"
              >
                <header className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-tight">{c.titulo}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.descricao}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRI_STYLE[c.prioridade]}`}
                  >
                    {c.prioridade}
                  </span>
                </header>

                {(ob || ev) && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                    {ob && (
                      <CompareCard
                        kind="Impacto"
                        title={ob.nome}
                        date={fmt(ob.dataVencimento)}
                        area={c.area ? areaNome(c.area) : ob.linhaModulo}
                        meta={`${ob.tipo} · ${ob.linhaModulo}`}
                        onEdit={() => {
                          onOpenObrigacao(ob);
                          onOpenChange(false);
                        }}
                      />
                    )}
                    <div className="hidden items-center justify-center sm:flex">
                      <div className="grid h-9 w-9 place-items-center rounded-full border bg-amber-50 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    </div>
                    {ev ? (
                      <CompareCard
                        kind="Evento"
                        title={ev.titulo}
                        date={`${fmt(ev.dataInicio)}${ev.dataFim ? ` → ${fmt(ev.dataFim)}` : ""}`}
                        area={areaNome(ev.area)}
                        meta={`${ev.tipo} · Relevância ${ev.relevancia}`}
                        responsavel={ev.responsavel}
                        onEdit={
                          onOpenEvento
                            ? () => {
                                onOpenEvento(ev);
                                onOpenChange(false);
                              }
                            : undefined
                        }
                      />
                    ) : c.area && ob ? (
                      <CompareCard
                        kind="Área pendente"
                        title={areaNome(c.area)}
                        date="—"
                        area={areaNome(c.area)}
                        meta="Próxima etapa pendente"
                        responsavel={ob.areas[c.area]?.responsavel || "Sem responsável"}
                        onEdit={() => {
                          onOpenObrigacao(ob);
                          onOpenChange(false);
                        }}
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-center text-[11px] text-muted-foreground">
                        Sem item secundário associado.
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CompareCard({
  kind,
  title,
  date,
  area,
  meta,
  responsavel,
  onEdit,
}: {
  kind: string;
  title: string;
  date: string;
  area: string;
  meta: string;
  responsavel?: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-background p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {kind}
      </div>
      <div className="mt-1 text-sm font-semibold leading-tight">{title}</div>
      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3" />
          {date}
        </div>
        <div>· Área: {area}</div>
        {responsavel && (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            {responsavel}
          </div>
        )}
        <div className="text-[10px]">{meta}</div>
      </div>
      {onEdit && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full justify-between"
          onClick={onEdit}
        >
          Editar / ajustar
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
