import * as React from "react";
import { AREAS, AREA_ORDEM, Obrigacao, areaNome } from "@/lib/domain";
import { isAreaAvaliada } from "@/lib/store";
import { Progress } from "@/components/ui/progress";

/**
 * AreaProgressPanel — substitui o antigo "Próximas pendências".
 * Mostra, por área: total de impactos, quantos já foram avaliados
 * (concluídos ou "sem ação"), e quantos ainda aguardam.
 */
export function AreaProgressPanel({
  obrigacoes,
}: {
  obrigacoes: Obrigacao[];
}) {
  const rows = React.useMemo(() => {
    return AREA_ORDEM.map((slug) => {
      const total = obrigacoes.length;
      const avaliados = obrigacoes.filter((o) => isAreaAvaliada(o, slug)).length;
      const semAcao = obrigacoes.filter(
        (o) => o.areas[slug].status === "Sem ação necessária"
      ).length;
      const comAcao = obrigacoes.filter(
        (o) =>
          o.areas[slug].status === "Concluída" &&
          o.acoes.some((a) => a.area === slug && a.selecionada)
      ).length;
      const pendentes = total - avaliados;
      const cor = AREAS.find((a) => a.slug === slug)!.cor;
      return { slug, total, avaliados, semAcao, comAcao, pendentes, cor };
    });
  }, [obrigacoes]);

  const totalImpactos = obrigacoes.length;
  const totalComAcao = obrigacoes.filter((o) => o.acaoNecessaria).length;

  return (
    <aside className="space-y-4 rounded-2xl border bg-card p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Progresso por área</h3>
        <p className="text-[11px] text-muted-foreground">
          Avaliações concluídas ou marcadas como "sem ação".
        </p>
      </div>

      <div className="space-y-2.5">
        {rows.map((r) => {
          const pct = r.total === 0 ? 0 : Math.round((r.avaliados / r.total) * 100);
          return (
            <div key={r.slug} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: r.cor }}
                  />
                  {areaNome(r.slug)}
                </span>
                <span className="text-muted-foreground">
                  {r.avaliados}/{r.total}
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                  {r.comAcao} c/ ação
                </span>
                <span className="rounded-full bg-slate-50 px-1.5 py-0.5 text-slate-600">
                  {r.semAcao} sem ação
                </span>
                <span className="rounded-full bg-muted px-1.5 py-0.5">
                  {r.pendentes} pend.
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-primary/[0.04] p-3 text-[11px]">
        <div className="flex items-center justify-between text-foreground">
          <span>Impactos com estrela roxa</span>
          <span className="font-semibold text-primary">
            {totalComAcao}/{totalImpactos}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Marcados como ação necessária pelo NEXUS.
        </p>
      </div>
    </aside>
  );
}
