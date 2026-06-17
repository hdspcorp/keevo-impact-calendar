import * as React from "react";
import { CheckCircle2, Circle, Clock, MinusCircle, RotateCcw } from "lucide-react";
import { AreaSlug, Obrigacao, areaNome, areaOrdemEfetiva } from "@/lib/domain";
import { areaProgress, proximaPendente, isAreaAvaliada } from "@/lib/store";
import { cn } from "@/lib/utils";

function fmt(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusTrail({ obrigacao: o }: { obrigacao: Obrigacao }) {
  const prog = areaProgress(o);
  const next = proximaPendente(o);
  const ordem = areaOrdemEfetiva(o);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Trilha de avaliação
          </div>
          <div className="mt-0.5 text-sm text-foreground">
            <span className="font-semibold">
              {prog.atualizadas}/{prog.total}
            </span>{" "}
            áreas avaliadas
            {next && (
              <span className="text-muted-foreground">
                {" · "}próxima:{" "}
                <span className="font-medium text-primary">{areaNome(next)}</span>
              </span>
            )}
            {o.requerValidacaoNexus === false && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                Dispensa NEXUS
              </span>
            )}
          </div>
        </div>
      </div>

      <ol
        className={cn(
          "grid grid-cols-1 gap-2 md:gap-1",
          ordem.length === 4 ? "md:grid-cols-4" : "md:grid-cols-5"
        )}
      >
        {ordem.map((slug, i) => {
          const st = o.areas[slug];
          const avaliada = isAreaAvaliada(o, slug);
          const isNext = next === slug;

          const Icon =
            st.status === "Concluída"
              ? CheckCircle2
              : st.status === "Sem ação necessária"
                ? MinusCircle
                : st.status === "Em análise"
                  ? Clock
                  : st.status === "Reaberta"
                    ? RotateCcw
                    : Circle;

          const tone =
            st.status === "Concluída"
              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
              : st.status === "Sem ação necessária"
                ? "text-slate-600 bg-slate-50 border-slate-200"
                : st.status === "Em análise" || st.status === "Reaberta"
                  ? "text-amber-700 bg-amber-50 border-amber-200"
                  : isNext
                    ? "text-primary bg-primary/8 border-primary/30 ring-2 ring-primary/15"
                    : "text-muted-foreground bg-muted/40 border-border";

          return (
            <li
              key={slug}
              className={cn("relative rounded-xl border p-2.5 transition-all", tone)}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4 shrink-0", avaliada && "fill-current/10")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-semibold uppercase tracking-wide opacity-80">
                    {i + 1}. {areaNome(slug)}
                  </div>
                  <div className="truncate text-xs font-medium">{st.status}</div>
                </div>
              </div>
              <div className="mt-1.5 text-[10px] leading-tight opacity-70">
                {st.atualizadoPor ? (
                  <>
                    {st.atualizadoPor}
                    {fmt(st.ultimaAtualizacao) && <> · {fmt(st.ultimaAtualizacao)}</>}
                  </>
                ) : (
                  <>Sem avaliação</>
                )}
              </div>
              {isNext && (
                <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground shadow">
                  Próxima
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function statusFromArea(slug: AreaSlug) {
  return slug;
}
