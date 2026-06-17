import * as React from "react";
import { Obrigacao, MESES, Evento } from "@/lib/domain";
import { ObrigacaoCard } from "./ObrigacaoCard";
import { EventoCard } from "./EventoCard";
import { eventosNoConflitoComObrigacao } from "@/lib/conflitos";
import { useStore } from "@/lib/store";

export function CalendarGrid({
  obrigacoes,
  eventos,
  onSelect,
}: {
  obrigacoes: Obrigacao[];
  eventos: Evento[];
  onSelect: (o: Obrigacao) => void;
}) {
  const { removeEvento, session } = useStore();

  const byMonth = React.useMemo(() => {
    const map: Record<number, { obrigacoes: Obrigacao[]; eventos: Evento[] }> = {};
    for (let i = 0; i < 12; i++) map[i] = { obrigacoes: [], eventos: [] };
    for (const o of obrigacoes) {
      const m = new Date(o.dataVencimento + "T00:00:00").getMonth();
      map[m].obrigacoes.push(o);
    }
    for (const e of eventos) {
      const mIni = new Date(e.dataInicio + "T00:00:00").getMonth();
      const mFim = e.dataFim ? new Date(e.dataFim + "T00:00:00").getMonth() : mIni;
      for (let m = mIni; m <= mFim; m++) {
        if (map[m]) map[m].eventos.push(e);
      }
    }
    for (const m in map) {
      map[m].obrigacoes.sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
      map[m].eventos.sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
    }
    return map;
  }, [obrigacoes, eventos]);

  const currentMonth = new Date().getMonth();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MESES.map((nome, i) => {
        const { obrigacoes: oitems, eventos: eitems } = byMonth[i];
        const isCurrent = i === currentMonth;
        const total = oitems.length + eitems.length;
        return (
          <section key={nome} className="rounded-2xl border border-border/70 bg-card/60 p-3">
            <header className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{nome}</h2>
                {isCurrent && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Atual
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">{total}</span>
            </header>

            <div className="space-y-2">
              {total === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-[11px] text-muted-foreground">
                  Sem itens
                </div>
              )}
              {oitems.map((o) => {
                const conflitos = eventosNoConflitoComObrigacao(o, eventos);
                return (
                  <ObrigacaoCard
                    key={o.id}
                    o={o}
                    onClick={() => onSelect(o)}
                    hasConflict={conflitos.length > 0}
                  />
                );
              })}
              {eitems.map((e) => {
                const canRemove =
                  session?.kind === "admin" ||
                  (session?.kind === "area" && session.area === e.area);
                return (
                  <EventoCard
                    key={e.id}
                    e={e}
                    canRemove={canRemove}
                    onRemove={() => removeEvento(e.id)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
