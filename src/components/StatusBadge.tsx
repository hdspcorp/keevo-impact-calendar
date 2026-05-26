import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { StatusArea, StatusGeral, Criticidade } from "@/lib/domain";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  "Não iniciada": "bg-muted text-muted-foreground border-border",
  "Em andamento": "bg-amber-50 text-amber-700 border-amber-200",
  Atualizada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pendente: "bg-orange-50 text-orange-700 border-orange-200",
  Concluída: "bg-primary/10 text-primary border-primary/20",
  Atrasada: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({
  status,
  className,
}: {
  status: StatusGeral | StatusArea;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {status}
    </Badge>
  );
}

const CRIT_STYLES: Record<Criticidade, string> = {
  Baixa: "bg-slate-50 text-slate-600 border-slate-200",
  Média: "bg-amber-50 text-amber-700 border-amber-200",
  Alta: "bg-red-50 text-red-700 border-red-200",
};

export function CriticidadeBadge({ value }: { value: Criticidade }) {
  return (
    <Badge variant="outline" className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", CRIT_STYLES[value])}>
      Criticidade {value}
    </Badge>
  );
}
