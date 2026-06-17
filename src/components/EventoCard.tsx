import * as React from "react";
import { CalendarDays, Megaphone, Tag, AlertTriangle, X } from "lucide-react";
import { Evento, areaNome } from "@/lib/domain";
import { cn } from "@/lib/utils";

function fmt(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function EventoCard({
  e,
  onClick,
  onRemove,
  canRemove,
}: {
  e: Evento;
  onClick?: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
}) {
  const isMkt = e.area === "marketing";
  return (
    <div
      className={cn(
        "group relative w-full rounded-xl border bg-card/80 p-2.5 text-left text-xs transition-all",
        isMkt ? "border-orange-300/70 bg-orange-50/40" : "border-border",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            isMkt ? "bg-orange-100 text-orange-600" : "bg-secondary text-secondary-foreground"
          )}
        >
          {isMkt ? <Megaphone className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[12px] font-medium text-foreground">{e.titulo}</span>
            {e.geraConflito && (
              <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" aria-label="Pode gerar conflito" />
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-2.5 w-2.5" />
              {fmt(e.dataInicio)}
              {e.dataFim ? ` → ${fmt(e.dataFim)}` : ""}
            </span>
            <span>· {areaNome(e.area)}</span>
            <span>· {e.tipo}</span>
          </div>
        </div>
        {canRemove && onRemove && (
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              onRemove();
            }}
            className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            title="Remover evento"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
