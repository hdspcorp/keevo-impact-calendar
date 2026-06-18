import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ChevronRight } from "lucide-react";
import { Obrigacao, AreaSlug, areaNome } from "@/lib/domain";
import { proximaPendente, isAreaAvaliada } from "@/lib/store";
import { detectarConflitos } from "@/lib/conflitos";
import { Evento } from "@/lib/domain";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import type { AreaDrillKind } from "./MyAreaCards";

export function AreaItemsDrawer({
  drill,
  area,
  obrigacoes,
  eventos,
  onOpenObrigacao,
  onOpenChange,
}: {
  drill: AreaDrillKind | null;
  area: AreaSlug;
  obrigacoes: Obrigacao[];
  eventos: Evento[];
  onOpenObrigacao: (o: Obrigacao) => void;
  onOpenChange: (v: boolean) => void;
}) {
  const { title, description, items } = React.useMemo(() => {
    if (!drill) return { title: "", description: "", items: [] as Obrigacao[] };
    const conflitos = detectarConflitos(obrigacoes, eventos);
    switch (drill.kind) {
      case "obrigacoes-area":
        return {
          title: "Obrigações da área",
          description: `Todas as obrigações que ainda têm fluxo aberto para ${areaNome(area)}.`,
          items: obrigacoes.filter((o) => proximaPendente(o) !== null),
        };
      case "pendencias-area":
        return {
          title: "Pendências da área",
          description: `Itens que ${areaNome(area)} ainda não avaliou.`,
          items: obrigacoes.filter((o) => !isAreaAvaliada(o, area)),
        };
      case "acoes-necessarias":
        return {
          title: "Ações necessárias",
          description: "Cards marcados como ação necessária pelo NEXUS e ainda não tratados pela sua área.",
          items: obrigacoes.filter((o) => o.acaoNecessaria && !isAreaAvaliada(o, area)),
        };
      case "alerta-conflitos": {
        const ids = new Set(
          conflitos
            .filter((c) => !c.area || c.area === area || c.tipo === "marketing-overlap")
            .map((c) => c.obrigacaoId)
            .filter(Boolean) as string[]
        );
        return {
          title: "Conflitos de datas",
          description: "Cards com sobreposição de eventos ou riscos de calendário.",
          items: obrigacoes.filter((o) => ids.has(o.id)),
        };
      }
      case "alerta-sem-responsavel":
        return {
          title: "Itens sem responsável",
          description: `Cards em que ${areaNome(area)} é a próxima área pendente, mas sem responsável definido.`,
          items: obrigacoes.filter(
            (o) => proximaPendente(o) === area && !o.areas[area].responsavel
          ),
        };
      case "alerta-prazo-7d":
        return {
          title: "Prazos próximos (7 dias)",
          description: "Cards que vencem nos próximos 7 dias e ainda não foram avaliados pela sua área.",
          items: obrigacoes.filter((o) => {
            const d = new Date(o.dataVencimento + "T00:00:00").getTime();
            const days = (d - Date.now()) / 86400000;
            return days >= 0 && days <= 7 && !isAreaAvaliada(o, area);
          }),
        };
      case "proxima-acao": {
        const o = obrigacoes.find((x) => x.id === drill.obrigacaoId);
        return { title: "", description: "", items: o ? [o] : [] };
      }
    }
  }, [drill, obrigacoes, eventos, area]);

  // Atalho: quando é única ação clicada na lista, abre direto o detalhe
  React.useEffect(() => {
    if (drill?.kind === "proxima-acao" && items.length === 1) {
      onOpenObrigacao(items[0]);
      onOpenChange(false);
    }
  }, [drill, items, onOpenObrigacao, onOpenChange]);

  const open = !!drill && drill.kind !== "proxima-acao";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 pb-4 pt-6">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="space-y-2 px-5 py-4">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
              Nenhum item correspondente.
            </div>
          ) : (
            items.map((o) => {
              const prox = proximaPendente(o);
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    onOpenObrigacao(o);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition-all",
                    "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {o.nome}
                      </span>
                      <StatusBadge status={o.statusGeral} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      <span>
                        Vence em{" "}
                        {new Date(o.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                      <span>·</span>
                      <span>{o.linhaModulo}</span>
                      {prox && (
                        <>
                          <span>·</span>
                          <span>
                            próxima:{" "}
                            <span className="font-medium text-primary">{areaNome(prox)}</span>
                          </span>
                        </>
                      )}
                      {o.areas[area].responsavel && (
                        <>
                          <span>·</span>
                          <span>Resp.: {o.areas[area].responsavel}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
