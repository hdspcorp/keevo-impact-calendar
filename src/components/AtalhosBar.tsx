import * as React from "react";
import { Zap } from "lucide-react";
import { AtalhoEvento, areaNome } from "@/lib/domain";

export function AtalhosBar({
  atalhos,
  onUse,
}: {
  atalhos: AtalhoEvento[];
  onUse: (a: AtalhoEvento) => void;
}) {
  const ativos = atalhos.filter((a) => a.ativo).sort((a, b) => a.ordem - b.ordem);
  if (ativos.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-3">
      <header className="mb-2 flex items-center gap-2 px-1">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Atalhos rápidos
        </h2>
      </header>
      <div className="flex flex-wrap gap-2">
        {ativos.map((a) => (
          <button
            key={a.id}
            onClick={() => onUse(a)}
            className="group flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            title={a.descricao ?? a.nome}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-base">
              {a.icone ?? "⚡"}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground">{a.nome}</div>
              <div className="text-[10px] text-muted-foreground">
                {a.tipo} · {areaNome(a.area)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
