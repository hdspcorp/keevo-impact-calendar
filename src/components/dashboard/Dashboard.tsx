import * as React from "react";
import {
  CalendarClock,
  Star,
  TrendingUp,
  ListChecks,
  AlertTriangle,
  ShieldOff,
  ArrowRight,
  Clock,
  Users,
  Megaphone,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Obrigacao, Evento, areaNome, AREAS } from "@/lib/domain";
import {
  areaProgress,
  proximaPendente,
  ultimaAreaConcluida,
  isAreaAvaliada,
} from "@/lib/store";
import { detectarConflitos, Conflito } from "@/lib/conflitos";
import { cn } from "@/lib/utils";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  if (iso.length === 10) {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
  }
  return new Date(iso).toLocaleDateString("pt-BR");
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone = "default",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "primary" | "accent" | "danger" | "warn";
  onClick?: () => void;
}) {
  const toneCls =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "accent"
        ? "bg-accent/15 text-accent-foreground"
        : tone === "danger"
          ? "bg-red-100 text-red-600"
          : tone === "warn"
            ? "bg-amber-100 text-amber-700"
            : "bg-secondary text-secondary-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-3 text-left transition-all",
        onClick && "hover:-translate-y-0.5 hover:shadow-sm"
      )}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneCls)}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-xl font-semibold leading-tight text-foreground">{value}</div>
        {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
      </div>
    </button>
  );
}

const TIPO_LABEL: Record<Conflito["tipo"], { label: string; icon: React.ReactNode }> = {
  "marketing-overlap": { label: "Sobreposição com Marketing", icon: <Megaphone className="h-3.5 w-3.5" /> },
  "multi-area": { label: "Multi-área simultânea", icon: <Users className="h-3.5 w-3.5" /> },
  "vencimento-sem-acao": { label: "Vence sem ação definida", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  "dependencia-longa": { label: "Dependência longa", icon: <Clock className="h-3.5 w-3.5" /> },
  "sem-responsavel": { label: "Sem responsável", icon: <Users className="h-3.5 w-3.5" /> },
};

export function Dashboard({
  obrigacoes,
  eventos,
  onOpenObrigacao,
}: {
  obrigacoes: Obrigacao[];
  eventos: Evento[];
  onOpenObrigacao: (o: Obrigacao) => void;
}) {
  // ----- KPIs -----
  const total = obrigacoes.length;
  const in60 = obrigacoes.filter((o) => {
    const d = new Date(o.dataVencimento + "T00:00:00").getTime();
    const days = (d - Date.now()) / 86400000;
    return days >= 0 && days <= 60;
  }).length;
  const acoesNecessarias = obrigacoes.filter((o) => o.acaoNecessaria).length;
  const semNexus = obrigacoes.filter((o) => o.requerValidacaoNexus === false).length;
  const atrasadas = obrigacoes.filter((o) => {
    const d = new Date(o.dataVencimento + "T00:00:00").getTime();
    return d < Date.now() && o.statusGeral !== "Concluída";
  }).length;
  const progresso =
    total === 0
      ? 0
      : Math.round(obrigacoes.reduce((s, o) => s + areaProgress(o).pct, 0) / total);

  const conflitos = React.useMemo(
    () => detectarConflitos(obrigacoes, eventos),
    [obrigacoes, eventos]
  );

  const proximasAcoes = React.useMemo(() => {
    return obrigacoes
      .map((o) => ({ o, prox: proximaPendente(o) }))
      .filter((x) => x.prox)
      .sort(
        (a, b) =>
          new Date(a.o.dataVencimento).getTime() - new Date(b.o.dataVencimento).getTime()
      )
      .slice(0, 12);
  }, [obrigacoes]);

  return (
    <div className="rounded-2xl border bg-card/70 p-3 sm:p-4">
      <Tabs defaultValue="resumo">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="alertas" className="gap-1.5">
            Alertas
            {conflitos.length > 0 && (
              <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-700">
                {conflitos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="proximas">Próximas ações</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo</TabsTrigger>
        </TabsList>

        {/* ---------- RESUMO ---------- */}
        <TabsContent value="resumo" className="mt-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            <Kpi icon={<ListChecks className="h-4 w-4" />} label="Total de obrigações" value={total} />
            <Kpi
              icon={<CalendarClock className="h-4 w-4" />}
              label="Vencem em 60 dias"
              value={in60}
              tone="accent"
            />
            <Kpi
              icon={<Star className="h-4 w-4" />}
              label="Ações necessárias"
              value={acoesNecessarias}
              tone="primary"
            />
            <Kpi
              icon={<TrendingUp className="h-4 w-4" />}
              label="Progresso geral"
              value={`${progresso}%`}
              hint="média de áreas atualizadas"
            />
            <Kpi
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Conflitos detectados"
              value={conflitos.length}
              tone={conflitos.length > 0 ? "warn" : "default"}
            />
            <Kpi
              icon={<Clock className="h-4 w-4" />}
              label="Obrigações atrasadas"
              value={atrasadas}
              tone={atrasadas > 0 ? "danger" : "default"}
            />
            <Kpi
              icon={<ShieldOff className="h-4 w-4" />}
              label="Dispensam NEXUS"
              value={semNexus}
              hint="cards informativos / já validados"
            />
            <Kpi
              icon={<Users className="h-4 w-4" />}
              label="Próximas áreas pendentes"
              value={
                new Set(obrigacoes.map((o) => proximaPendente(o)).filter(Boolean) as string[])
                  .size
              }
              hint="áreas únicas com pendência"
            />
          </div>
        </TabsContent>

        {/* ---------- ALERTAS ---------- */}
        <TabsContent value="alertas" className="mt-4">
          {conflitos.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhum conflito ou risco detectado no momento.
            </div>
          ) : (
            <ul className="space-y-2">
              {conflitos.map((c) => {
                const meta = TIPO_LABEL[c.tipo];
                const obr = c.obrigacaoId
                  ? obrigacoes.find((o) => o.id === c.obrigacaoId)
                  : null;
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border bg-card p-3",
                      c.prioridade === "alta"
                        ? "border-red-200 bg-red-50/40"
                        : c.prioridade === "media"
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        c.prioridade === "alta"
                          ? "bg-red-100 text-red-600"
                          : c.prioridade === "media"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {meta.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {meta.label}
                        {c.data && <span>· {fmtDate(c.data)}</span>}
                      </div>
                      <div className="mt-0.5 text-sm font-medium text-foreground">{c.titulo}</div>
                      <div className="text-xs text-muted-foreground">{c.descricao}</div>
                    </div>
                    {obr && (
                      <button
                        onClick={() => onOpenObrigacao(obr)}
                        className="self-center rounded-md border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary"
                      >
                        Abrir
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        {/* ---------- PRÓXIMAS AÇÕES ---------- */}
        <TabsContent value="proximas" className="mt-4">
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Obrigação</th>
                  <th className="px-3 py-2 text-left">Próxima área</th>
                  <th className="px-3 py-2 text-left">Prazo</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {proximasAcoes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Todas as obrigações estão com avaliação completa.
                    </td>
                  </tr>
                )}
                {proximasAcoes.map(({ o, prox }) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer border-t hover:bg-secondary/40"
                    onClick={() => onOpenObrigacao(o)}
                  >
                    <td className="px-3 py-2 font-medium text-foreground">{o.nome}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-primary">
                        <ArrowRight className="h-3 w-3" />
                        {prox ? areaNome(prox) : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(o.dataVencimento)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{o.statusGeral}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          o.criticidade === "Alta"
                            ? "bg-red-100 text-red-700"
                            : o.criticidade === "Média"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {o.criticidade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ---------- FLUXO ---------- */}
        <TabsContent value="fluxo" className="mt-4">
          <ul className="space-y-1.5">
            {obrigacoes.slice(0, 20).map((o) => {
              const prox = proximaPendente(o);
              const ult = ultimaAreaConcluida(o);
              return (
                <li
                  key={o.id}
                  onClick={() => onOpenObrigacao(o)}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-xs hover:bg-secondary/40"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {o.nome}
                  </span>
                  <span className="hidden text-muted-foreground sm:inline">
                    última:{" "}
                    <span className="font-medium text-foreground">
                      {ult ? areaNome(ult.area) : "—"}
                    </span>
                    {ult && <> · {fmtDate(ult.iso)}</>}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-primary font-medium">
                    {prox ? areaNome(prox) : "fluxo concluído"}
                  </span>
                </li>
              );
            })}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
