import * as React from "react";
import {
  Star,
  CalendarDays,
  ArrowRight,
  ShieldOff,
  AlertTriangle,
  LayoutTemplate,
} from "lucide-react";
import { Obrigacao, areaNome } from "@/lib/domain";
import { proximaPendente } from "@/lib/store";
import { cn } from "@/lib/utils";

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Status do PLANO do impacto (visão de gestão, não status do governo).
 * Mapeia o `statusGeral` legado em rótulos mais claros pedidos pela spec.
 */
function planoLabel(o: Obrigacao): { label: string; tone: string } {
  switch (o.statusGeral) {
    case "Concluída":
      return { label: "Concluído", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "Em andamento":
      return { label: "Em execução", tone: "bg-sky-50 text-sky-700 border-sky-200" };
    case "Atualizada":
      return { label: "Em preparação", tone: "bg-amber-50 text-amber-800 border-amber-200" };
    case "Pendente":
      return { label: "Atenção / Risco", tone: "bg-orange-50 text-orange-700 border-orange-200" };
    default:
      return { label: "Não iniciado", tone: "bg-muted text-muted-foreground border-border" };
  }
}

export function ObrigacaoCard({
  o,
  onClick,
  hasConflict,
  fromTemplate,
  showNextArea = true,
}: {
  o: Obrigacao;
  onClick: () => void;
  hasConflict?: boolean;
  fromTemplate?: string;
  showNextArea?: boolean;
}) {
  const venc = new Date(o.dataVencimento + "T00:00:00");
  const daysLeft = Math.ceil((venc.getTime() - Date.now()) / 86400000);
  const danger = daysLeft <= 7 && o.statusGeral !== "Concluída";
  const prox = proximaPendente(o);
  const semNexus = o.requerValidacaoNexus === false;
  const plano = planoLabel(o);

  // Áreas que já avaliaram (concluídas ou sem ação) sobre o total efetivo.
  const totalAreas = Object.keys(o.areas).length;
  const avaliadas = Object.values(o.areas).filter(
    (a) => a.status === "Concluída" || a.semAcaoNecessaria
  ).length;

  // Ações marcadas como visíveis no card (selecionadas) — até 3 chips + contagem.
  // Respeita o flag exibirNoCard (default true) para evitar poluir o card.
  const acoesSel = o.acoes.filter((a) => a.selecionada && a.exibirNoCard !== false);
  const acoesVisiveis = acoesSel.slice(0, 3);
  const extras = acoesSel.length - acoesVisiveis.length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border bg-card px-3 py-2.5 text-left transition-all",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
        hasConflict && "border-amber-300/70"
      )}
    >
      {/* Cabeçalho: título + meta */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-semibold leading-tight text-foreground">
          {o.nome}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {hasConflict && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-label="Conflito de datas" />
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
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 text-[10.5px]">
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium text-muted-foreground",
            danger && "text-red-600"
          )}
        >
          <CalendarDays className="h-3 w-3" />
          {fmtDate(o.dataVencimento)} · {o.tipo}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            plano.tone
          )}
        >
          {plano.label}
        </span>
      </div>

      {/* Próxima área: somente para usuários autenticados */}
      {showNextArea && prox && (
        <div className="mt-2 flex items-center gap-1 text-[10.5px]">
          <span className="text-muted-foreground">Próx. área:</span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
            <ArrowRight className="h-2.5 w-2.5" />
            {areaNome(prox)}
          </span>
        </div>
      )}

      {/* Ações visíveis */}
      {acoesSel.length > 0 ? (
        <div className="mt-2 space-y-1">
          <div className="text-[10px] font-medium text-muted-foreground">
            Ações ({avaliadas}/{totalAreas})
          </div>
          <div className="flex flex-wrap gap-1">
            {acoesVisiveis.map((a) => (
              <span
                key={a.id}
                className="inline-flex max-w-[140px] items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
              >
                <span className="truncate">{a.nome}</span>
              </span>
            ))}
            {extras > 0 && (
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                +{extras}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[10px] italic text-muted-foreground">
          Nenhuma ação ainda
        </div>
      )}

      {/* Rodapé: template badge */}
      {fromTemplate && (
        <div className="mt-2 flex items-center gap-1 border-t border-border/60 pt-2 text-[9.5px] text-muted-foreground">
          <LayoutTemplate className="h-3 w-3" />
          <span className="truncate">Criado por template · {fromTemplate}</span>
        </div>
      )}
    </button>
  );
}
