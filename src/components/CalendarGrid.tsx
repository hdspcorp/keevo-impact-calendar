import * as React from "react";
import { Obrigacao, MESES } from "@/lib/domain";
import { ObrigacaoCard } from "./ObrigacaoCard";

export function CalendarGrid({
  obrigacoes,
  onSelect,
}: {
  obrigacoes: Obrigacao[];
  onSelect: (o: Obrigacao) => void;
}) {
  const byMonth = React.useMemo(() => {
    const map: Record<number, Obrigacao[]> = {};
    for (let i = 0; i < 12; i++) map[i] = [];
    for (const o of obrigacoes) {
      const m = new Date(o.dataVencimento + "T00:00:00").getMonth();
      map[m].push(o);
    }
    for (const m in map) map[m].sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
    return map;
  }, [obrigacoes]);

  const currentMonth = new Date().getMonth();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MESES.map((nome, i) => {
        const items = byMonth[i];
        const isCurrent = i === currentMonth;
        return (
          <section
            key={nome}
            className="rounded-2xl border border-border/70 bg-card/60 p-3"
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{nome}</h2>
                {isCurrent && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Atual
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">{items.length}</span>
            </header>

            <div className="space-y-2.5">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-[11px] text-muted-foreground">
                  Sem obrigações
                </div>
              ) : (
                items.map((o) => <ObrigacaoCard key={o.id} o={o} onClick={() => onSelect(o)} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
