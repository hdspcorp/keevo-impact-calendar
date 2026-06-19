import * as React from "react";
import { AlertTriangle, CheckCircle2, ListChecks, Star, Layers } from "lucide-react";
import { Obrigacao, Evento } from "@/lib/domain";
import { areaProgress } from "@/lib/store";
import { Conflito } from "@/lib/conflitos";
import { cn } from "@/lib/utils";

export function MetricsBar({
  obrigacoes,
  eventos,
  conflitos,
  onOpenConflitos,
}: {
  obrigacoes: Obrigacao[];
  eventos: Evento[];
  conflitos: Conflito[];
  onOpenConflitos?: () => void;
}) {
  const total = obrigacoes.length;
  // % médio de áreas avaliadas
  const avgPct =
    total === 0
      ? 0
      : Math.round(
          obrigacoes.reduce((sum, o) => sum + areaProgress(o).pct, 0) / total
        );
  const acoesPlanejadas = obrigacoes.reduce(
    (sum, o) => sum + o.acoes.filter((a) => a.selecionada).length,
    0
  );
  const emRisco = obrigacoes.filter((o) => {
    const venc = new Date(o.dataVencimento + "T00:00:00").getTime();
    const days = (venc - Date.now()) / 86400000;
    return days >= 0 && days <= 14 && o.statusGeral !== "Concluída";
  }).length;
  const conflitosDatas = conflitos.length;

  void eventos;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Metric icon={<Layers className="h-3.5 w-3.5" />} label="Total de impactos" value={total} />
      <Metric
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        label="Áreas avaliadas (média)"
        value={`${avgPct}%`}
      />
      <Metric
        icon={<ListChecks className="h-3.5 w-3.5" />}
        label="Ações planejadas"
        value={acoesPlanejadas}
      />
      <Metric
        icon={<Star className="h-3.5 w-3.5" />}
        label="Impactos em risco"
        value={emRisco}
        tone={emRisco > 0 ? "danger" : "default"}
      />
      <button
        onClick={onOpenConflitos}
        className="text-left"
        disabled={!onOpenConflitos}
      >
        <Metric
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="Conflitos de datas"
          value={conflitosDatas}
          tone={conflitosDatas > 0 ? "warning" : "default"}
          hover
        />
      </button>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "default",
  hover,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "default" | "danger" | "warning";
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-3 transition-colors",
        hover && "hover:border-primary/40",
        tone === "danger" && "border-red-200 bg-red-50/40",
        tone === "warning" && "border-amber-200 bg-amber-50/40"
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-2xl font-bold text-foreground",
          tone === "danger" && "text-red-700",
          tone === "warning" && "text-amber-700"
        )}
      >
        {value}
      </div>
    </div>
  );
}
