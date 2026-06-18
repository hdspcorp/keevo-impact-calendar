import * as React from "react";
import { Star, CalendarDays, ArrowRight, ShieldOff, AlertTriangle } from "lucide-react";
import { Obrigacao, areaNome } from "@/lib/domain";
import { areaProgress, proximaPendente } from "@/lib/store";
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
  hasConflict,
}: {
  o: Obrigacao;
  onClick: () => void;
  hasConflict?: boolean;
}) {
  const prog = areaProgress(o);
  const venc = new Date(o.dataVencimento + "T00:00:00");
  const daysLeft = Math.ceil((venc.getTime() - Date.now()) / 86400000);
  const danger = daysLeft <= 7 && o.statusGeral !== "Concluída";
  const prox = proximaPendente(o);
  const semNexus = o.requerValidacaoNexus === false;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-xl border bg-card px-3 py-2.5 text-left transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm",
        o.acaoNecessaria && "ring-1 ring-primary/15"
      )}
    >
      {/* Faixa lateral por status */}
      <div
        className={cn(
          "absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full",
          o.statusGeral === "Concluída"
            ? "bg-emerald-400"
            : o.statusGeral === "Em andamento"
              ? "bg-amber-400"
              : o.statusGeral === "Pendente"
                ? "bg-orange-400"
                : "bg-border"
        )}
      />

      {/* Ícones superiores */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        {hasConflict && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-label="Conflito de agenda" />
        )}
        {semNexus && (
          <ShieldOff
            className="h-3.5 w-3.5 text-muted-foreground"
            aria-label="Sem validação NEXUS"
          />
        )}
        {o.acaoNecessaria && (
          <Star
            className="h-3.5 w-3.5 fill-primary text-primary"
            aria-label="Ação necessária"
          />
        )}
      </div>

      <h3 className="pr-14 text-[13px] font-semibold leading-tight text-foreground">
        {o.nome}
      </h3>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              danger && "text-red-600"
            )}
          >
            <CalendarDays className="h-2.5 w-2.5" />
            {fmtDate(o.dataVencimento)}
          </span>
          <span>· {o.tipo}</span>
        </div>
        <StatusBadge status={o.statusGeral} />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Progress value={prog.pct} className="h-1 flex-1" />
        <span className="text-[10px] font-medium text-muted-foreground">
          {prog.atualizadas}/{prog.total}
        </span>
      </div>

      {prox && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px]">
          <span className="text-muted-foreground">Próxima área:</span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
            <ArrowRight className="h-2.5 w-2.5" />
            {areaNome(prox)}
          </span>
        </div>
      )}
    </button>
  );
}
