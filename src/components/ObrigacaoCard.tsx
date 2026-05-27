import * as React from "react";
import { Star, CalendarDays, Layers, ArrowRight } from "lucide-react";
import { Obrigacao, areaNome } from "@/lib/domain";
import {
  areaProgress,
  proximaPendente,
  ultimaAreaConcluida,
} from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function ObrigacaoCard({
  o,
  onClick,
}: {
  o: Obrigacao;
  onClick: () => void;
}) {
  const prog = areaProgress(o);
  const venc = new Date(o.dataVencimento + "T00:00:00");
  const daysLeft = Math.ceil((venc.getTime() - Date.now()) / 86400000);
  const danger = daysLeft <= 7 && o.statusGeral !== "Concluída";
  const prox = proximaPendente(o);
  const ult = ultimaAreaConcluida(o);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-2xl border bg-card p-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        o.acaoNecessaria && "ring-1 ring-primary/15"
      )}
    >
      {o.acaoNecessaria && (
        <Star
          className="absolute right-3 top-3 h-4 w-4 fill-primary text-primary drop-shadow-sm"
          aria-label="Ação necessária"
        />
      )}

      <h3 className="pr-6 text-sm font-semibold leading-snug text-foreground">
        {o.nome}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
          <Layers className="h-3 w-3" />
          {o.linhaModulo}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {o.tipo}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div
          className={cn(
            "flex items-center gap-1 text-[11px] font-medium",
            danger ? "text-red-600" : "text-muted-foreground"
          )}
        >
          <CalendarDays className="h-3 w-3" />
          {fmtDate(o.dataVencimento)}
        </div>
        <StatusBadge status={o.statusGeral} />
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {prog.atualizadas}/{prog.total} áreas avaliadas
          </span>
          <span className="font-medium text-foreground">{prog.pct}%</span>
        </div>
        <Progress value={prog.pct} className="h-1.5" />
      </div>

      {(prox || ult) && (
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          {prox ? (
            <span className="inline-flex items-center gap-1 truncate">
              <ArrowRight className="h-3 w-3 text-primary" />
              próxima:{" "}
              <span className="font-medium text-foreground">{areaNome(prox)}</span>
            </span>
          ) : (
            <span className="text-emerald-600">Todas as áreas avaliadas</span>
          )}
          {ult && (
            <span className="truncate text-right">
              última: {areaNome(ult.area)}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
