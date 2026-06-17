import { Obrigacao, Evento, AreaSlug, areaNome, areaOrdemEfetiva } from "./domain";
import { proximaPendente, isAreaAvaliada } from "./store";

export type ConflitoTipo =
  | "marketing-overlap"
  | "multi-area"
  | "vencimento-sem-acao"
  | "dependencia-longa"
  | "sem-responsavel";

export type Conflito = {
  id: string;
  tipo: ConflitoTipo;
  titulo: string;
  descricao: string;
  area?: AreaSlug;
  obrigacaoId?: string;
  eventoId?: string;
  prioridade: "alta" | "media" | "baixa";
  data?: string;
};

const DAY = 86400000;

function rangeOverlap(aIni: string, aFim: string | undefined, bIni: string, bFim?: string) {
  const a1 = new Date(aIni).getTime();
  const a2 = new Date(aFim ?? aIni).getTime();
  const b1 = new Date(bIni).getTime();
  const b2 = new Date(bFim ?? bIni).getTime();
  return a1 <= b2 && b1 <= a2;
}

export function detectarConflitos(obrigacoes: Obrigacao[], eventos: Evento[]): Conflito[] {
  const out: Conflito[] = [];

  // 1. Marketing overlap: evento de marketing sobrepondo o vencimento de uma obrigação
  const eventosMkt = eventos.filter((e) => e.area === "marketing" && e.geraConflito);
  for (const o of obrigacoes) {
    for (const e of eventosMkt) {
      if (rangeOverlap(o.dataVencimento, undefined, e.dataInicio, e.dataFim)) {
        out.push({
          id: `c-mkt-${o.id}-${e.id}`,
          tipo: "marketing-overlap",
          titulo: `"${o.nome}" coincide com "${e.titulo}"`,
          descricao: `Vencimento (${o.dataVencimento}) dentro da janela da campanha de Marketing.`,
          obrigacaoId: o.id,
          eventoId: e.id,
          prioridade: "alta",
          data: o.dataVencimento,
        });
      }
    }
  }

  // 2. Multi-area: dois eventos relevantes (alta) no mesmo período
  for (let i = 0; i < eventos.length; i++) {
    for (let j = i + 1; j < eventos.length; j++) {
      const a = eventos[i];
      const b = eventos[j];
      if (a.area === b.area) continue;
      if (a.relevancia !== "Alta" || b.relevancia !== "Alta") continue;
      if (rangeOverlap(a.dataInicio, a.dataFim, b.dataInicio, b.dataFim)) {
        out.push({
          id: `c-multi-${a.id}-${b.id}`,
          tipo: "multi-area",
          titulo: `${areaNome(a.area)} × ${areaNome(b.area)} no mesmo período`,
          descricao: `"${a.titulo}" e "${b.titulo}" se sobrepõem.`,
          prioridade: "media",
          data: a.dataInicio,
        });
      }
    }
  }

  // 3. Vencimento sem ação definida (≤30d sem nenhuma ação marcada)
  const now = Date.now();
  for (const o of obrigacoes) {
    const venc = new Date(o.dataVencimento + "T00:00:00").getTime();
    const days = (venc - now) / DAY;
    if (days < 0 || days > 30) continue;
    const totalSel = o.acoes.filter((a) => a.selecionada).length;
    const algumaSemAcao = areaOrdemEfetiva(o).some((a) => o.areas[a].semAcaoNecessaria);
    if (totalSel === 0 && !algumaSemAcao) {
      out.push({
        id: `c-venc-${o.id}`,
        tipo: "vencimento-sem-acao",
        titulo: `"${o.nome}" vence em ${Math.max(0, Math.ceil(days))}d sem ação definida`,
        descricao: "Nenhuma área marcou ações nem declarou que não há ação necessária.",
        obrigacaoId: o.id,
        prioridade: days <= 7 ? "alta" : "media",
        data: o.dataVencimento,
      });
    }
  }

  // 4. Dependência longa: mesma área aguardando há >14 dias
  for (const o of obrigacoes) {
    const prox = proximaPendente(o);
    if (!prox) continue;
    const ult = o.areas[prox].ultimaAtualizacao ?? o.historico[o.historico.length - 1]?.data;
    if (!ult) continue;
    const dias = (now - new Date(ult).getTime()) / DAY;
    if (dias > 14) {
      out.push({
        id: `c-dep-${o.id}`,
        tipo: "dependencia-longa",
        titulo: `${areaNome(prox)} segura "${o.nome}" há ${Math.floor(dias)}d`,
        descricao: "Sem movimentação na próxima área pendente.",
        obrigacaoId: o.id,
        area: prox,
        prioridade: dias > 30 ? "alta" : "media",
      });
    }
  }

  // 5. Sem responsável: obrigação cuja próxima área pendente não tem responsável
  for (const o of obrigacoes) {
    const prox = proximaPendente(o);
    if (!prox) continue;
    if (!o.areas[prox].responsavel) {
      out.push({
        id: `c-resp-${o.id}`,
        tipo: "sem-responsavel",
        titulo: `"${o.nome}" sem responsável em ${areaNome(prox)}`,
        descricao: "Defina quem vai atuar nessa etapa.",
        obrigacaoId: o.id,
        area: prox,
        prioridade: "baixa",
      });
    }
  }

  // ordena por prioridade
  const w: Record<Conflito["prioridade"], number> = { alta: 0, media: 1, baixa: 2 };
  out.sort((a, b) => w[a.prioridade] - w[b.prioridade]);
  return out;
}

export function eventosNoConflitoComObrigacao(o: Obrigacao, eventos: Evento[]): Evento[] {
  return eventos.filter(
    (e) => e.geraConflito && rangeOverlap(o.dataVencimento, undefined, e.dataInicio, e.dataFim)
  );
}
