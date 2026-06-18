import * as React from "react";
import { Building2, Bell, CalendarClock, ChevronRight } from "lucide-react";
import { Obrigacao, AreaSlug } from "@/lib/domain";
import { proximaPendente, isAreaAvaliada } from "@/lib/store";
import { detectarConflitos } from "@/lib/conflitos";
import { Evento } from "@/lib/domain";
import { cn } from "@/lib/utils";

export type AreaDrillKind =
  | { kind: "obrigacoes-area" }
  | { kind: "pendencias-area" }
  | { kind: "acoes-necessarias" }
  | { kind: "alerta-conflitos" }
  | { kind: "alerta-sem-responsavel" }
  | { kind: "alerta-prazo-7d" }
  | { kind: "proxima-acao"; obrigacaoId: string };

function CardShell({
  icon,
  title,
  children,
  tone = "default",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "warn" | "primary";
}) {
  const toneCls =
    tone === "warn"
      ? "bg-orange-100 text-orange-600"
      : tone === "primary"
        ? "bg-primary/10 text-primary"
        : "bg-secondary text-secondary-foreground";
  return (
    <section className="flex h-full flex-col rounded-2xl border bg-card p-4">
      <header className="mb-3 flex items-center gap-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneCls)}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

export function MyAreaCards({
  area,
  obrigacoes,
  eventos,
  onDrill,
}: {
  area: AreaSlug;
  obrigacoes: Obrigacao[];
  eventos: Evento[];
  onDrill: (d: AreaDrillKind) => void;
}) {
  // Resumo
  const obrigacoesArea = obrigacoes.filter((o) => proximaPendente(o) !== null);
  const pendencias = obrigacoes.filter((o) => !isAreaAvaliada(o, area));
  const acoesNecessarias = obrigacoes.filter(
    (o) => o.acaoNecessaria && !isAreaAvaliada(o, area)
  );

  // Alertas
  const conflitos = React.useMemo(
    () => detectarConflitos(obrigacoes, eventos),
    [obrigacoes, eventos]
  );
  const conflitosArea = conflitos.filter(
    (c) => !c.area || c.area === area || c.tipo === "marketing-overlap"
  );
  const semResp = obrigacoes.filter((o) => {
    const prox = proximaPendente(o);
    return prox === area && !o.areas[area].responsavel;
  });
  const prazos7d = obrigacoes.filter((o) => {
    const d = new Date(o.dataVencimento + "T00:00:00").getTime();
    const days = (d - Date.now()) / 86400000;
    return days >= 0 && days <= 7 && !isAreaAvaliada(o, area);
  });

  // Próximas ações: obrigações onde a próxima pendente é a área logada
  const proximas = obrigacoes
    .filter((o) => proximaPendente(o) === area)
    .sort(
      (a, b) =>
        new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
    )
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Resumo */}
      <CardShell icon={<Building2 className="h-4 w-4" />} title="Resumo da área" tone="primary">
        <div className="grid grid-cols-3 gap-3">
          <DrillStat
            value={obrigacoesArea.length}
            label="Obrigações da área"
            sub="Total no ano"
            onClick={() => onDrill({ kind: "obrigacoes-area" })}
          />
          <DrillStat
            value={pendencias.length}
            label="Pendências"
            sub={
              obrigacoes.length
                ? `${Math.round((pendencias.length / obrigacoes.length) * 100)}% do total`
                : "—"
            }
            onClick={() => onDrill({ kind: "pendencias-area" })}
          />
          <DrillStat
            value={acoesNecessarias.length}
            label="Ações necessárias"
            sub="Requerem atenção"
            onClick={() => onDrill({ kind: "acoes-necessarias" })}
          />
        </div>
      </CardShell>

      {/* Alertas */}
      <CardShell icon={<Bell className="h-4 w-4" />} title="Alertas da área" tone="warn">
        <ul className="space-y-1.5">
          <AlertRow
            label="Conflitos de datas"
            count={conflitosArea.length}
            color="orange"
            onClick={() => onDrill({ kind: "alerta-conflitos" })}
          />
          <AlertRow
            label="Itens sem responsável"
            count={semResp.length}
            color="amber"
            onClick={() => onDrill({ kind: "alerta-sem-responsavel" })}
          />
          <AlertRow
            label="Prazos próximos (7 dias)"
            count={prazos7d.length}
            color="primary"
            onClick={() => onDrill({ kind: "alerta-prazo-7d" })}
          />
        </ul>
      </CardShell>

      {/* Próximas ações */}
      <CardShell icon={<CalendarClock className="h-4 w-4" />} title="Próximas ações da área">
        {proximas.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            Nenhuma ação imediata da área.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {proximas.map((o) => (
              <li
                key={o.id}
                onClick={() => onDrill({ kind: "proxima-acao", obrigacaoId: o.id })}
                className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-xs hover:border-primary/40 hover:bg-primary/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{o.nome}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {fmt(o.dataVencimento)} · {o.statusGeral}
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary" />
              </li>
            ))}
          </ul>
        )}
      </CardShell>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function DrillStat({
  value,
  label,
  sub,
  onClick,
}: {
  value: number;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border bg-background p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
    >
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold leading-tight text-primary">{value}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>
    </button>
  );
}

function AlertRow({
  label,
  count,
  color,
  onClick,
}: {
  label: string;
  count: number;
  color: "orange" | "amber" | "primary";
  onClick: () => void;
}) {
  const dot =
    color === "orange"
      ? "bg-orange-500"
      : color === "amber"
        ? "bg-amber-500"
        : "bg-primary";
  return (
    <li
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer items-center justify-between gap-2 rounded-lg border bg-background px-2.5 py-2 text-xs transition-colors hover:bg-secondary/60",
        count === 0 && "opacity-60"
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "min-w-[24px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold",
            count === 0
              ? "bg-muted text-muted-foreground"
              : color === "orange"
                ? "bg-orange-100 text-orange-700"
                : color === "amber"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-primary/10 text-primary"
          )}
        >
          {count}
        </span>
        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
      </span>
    </li>
  );
}
