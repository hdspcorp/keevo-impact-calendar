import * as React from "react";
import { CalendarClock, Star, TrendingUp, ListChecks } from "lucide-react";
import { Obrigacao } from "@/lib/domain";
import { areaProgress } from "@/lib/store";

function Card({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "primary" | "accent";
}) {
  const toneCls =
    tone === "primary"
      ? "bg-primary/8 text-primary"
      : tone === "accent"
        ? "bg-accent/15 text-accent"
        : "bg-secondary text-secondary-foreground";
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneCls}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-2xl font-semibold leading-tight text-foreground">{value}</div>
        {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

export function SummaryCards({ obrigacoes }: { obrigacoes: Obrigacao[] }) {
  const total = obrigacoes.length;
  const in60 = obrigacoes.filter((o) => {
    const d = new Date(o.dataVencimento + "T00:00:00").getTime();
    const days = (d - Date.now()) / 86400000;
    return days >= 0 && days <= 60;
  }).length;
  const acoes = obrigacoes.filter((o) => o.acaoNecessaria).length;
  const progresso =
    total === 0
      ? 0
      : Math.round(
          obrigacoes.reduce((sum, o) => sum + areaProgress(o).pct, 0) / total
        );

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card icon={<ListChecks className="h-4 w-4" />} label="Total de obrigações" value={total} />
      <Card
        icon={<CalendarClock className="h-4 w-4" />}
        label="Vencem em 60 dias"
        value={in60}
        tone="accent"
      />
      <Card
        icon={<Star className="h-4 w-4" />}
        label="Ações necessárias (NEXUS)"
        value={acoes}
        tone="primary"
      />
      <Card
        icon={<TrendingUp className="h-4 w-4" />}
        label="Progresso geral"
        value={`${progresso}%`}
        hint="média de áreas atualizadas"
      />
    </div>
  );
}
