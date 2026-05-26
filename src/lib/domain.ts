// Domain types & seed data for Calendário de Gestão de Impactos 2026
// Designed to map cleanly onto Supabase tables later.

export type AreaSlug = "nexus" | "desenvolvimento" | "conteudos" | "marketing" | "operacoes";

export const AREAS: { slug: AreaSlug; nome: string; cor: string }[] = [
  { slug: "nexus", nome: "NEXUS", cor: "oklch(0.46 0.22 295)" },
  { slug: "desenvolvimento", nome: "Desenvolvimento", cor: "oklch(0.55 0.15 230)" },
  { slug: "conteudos", nome: "Conteúdos", cor: "oklch(0.6 0.16 160)" },
  { slug: "marketing", nome: "Marketing", cor: "oklch(0.7 0.18 50)" },
  { slug: "operacoes", nome: "Operações / Suporte", cor: "oklch(0.55 0.14 0)" },
];

export const areaNome = (s: AreaSlug) => AREAS.find((a) => a.slug === s)!.nome;

export type StatusGeral = "Não iniciada" | "Em andamento" | "Atualizada" | "Pendente" | "Concluída";
export type StatusArea = StatusGeral | "Atrasada";

export const STATUS_GERAL: StatusGeral[] = [
  "Não iniciada",
  "Em andamento",
  "Atualizada",
  "Pendente",
  "Concluída",
];

export type Periodicidade = "Mensal" | "Anual" | "Eventual";
export type Criticidade = "Baixa" | "Média" | "Alta";

export type ChecklistTemplate = {
  id: string;
  area: AreaSlug;
  nome: string;
  ordem: number;
  ativo: boolean;
  obrigatorio: boolean;
  somenteAcaoNecessaria: boolean;
};

export type Acao = {
  id: string;
  area: AreaSlug;
  nome: string;
  origem: "template" | "custom";
  concluida: boolean;
};

export type AreaStatus = {
  area: AreaSlug;
  status: StatusArea;
  observacoes: string;
  responsavel: string;
  ultimaAtualizacao?: string; // ISO
  atualizadoPor?: string;
};

export type HistoricoEntry = {
  id: string;
  area: AreaSlug;
  usuario: string;
  descricao: string;
  data: string; // ISO
};

export type Obrigacao = {
  id: string;
  nome: string;
  tipo: Periodicidade;
  linhaModulo: string;
  dataVencimento: string; // ISO yyyy-mm-dd
  criticidade: Criticidade;
  impacto: string;
  resumo: string;
  observacoes?: string;
  statusGeral: StatusGeral;
  acaoNecessaria: boolean;
  areas: Record<AreaSlug, AreaStatus>;
  acoes: Acao[];
  historico: HistoricoEntry[];
};

// ---------- TEMPLATES ----------
const T = (
  area: AreaSlug,
  itens: string[],
  somenteAN: boolean[] = []
): ChecklistTemplate[] =>
  itens.map((nome, i) => ({
    id: `tpl-${area}-${i}`,
    area,
    nome,
    ordem: i,
    ativo: true,
    obrigatorio: false,
    somenteAcaoNecessaria: somenteAN[i] ?? false,
  }));

export const DEFAULT_TEMPLATES: ChecklistTemplate[] = [
  ...T("nexus", [
    "Ação necessária",
    "Keevo Live",
    "Suporte ao Vivo",
    "Treinamento Interno",
    "Comunicado",
    "Conteúdo técnico",
  ]),
  ...T("desenvolvimento", [
    "Validar viabilidade",
    "Verificar dependências",
    "Informar previsão de liberação",
    "Confirmar se há implementação",
    "Atualizar status técnico",
  ]),
  ...T("conteudos", [
    "Produzir conteúdo",
    "Revisar conteúdo",
    "Validar linguagem",
    "Publicar material",
    "Informar data de liberação do conteúdo",
  ]),
  ...T("marketing", [
    "Planejar divulgação",
    "Definir datas de divulgação",
    "Validar necessidade de edição",
    "Entregar data de finalização das peças",
    "Publicar comunicação",
  ]),
  ...T("operacoes", [
    "Validar entendimento do tema",
    "Preparar time para atendimento",
    "Revisar materiais de apoio",
    "Compartilhar orientações internas",
    "Confirmar prontidão do atendimento",
  ]),
];

// ---------- Helpers ----------
export const emptyAreas = (): Record<AreaSlug, AreaStatus> =>
  AREAS.reduce(
    (acc, a) => {
      acc[a.slug] = {
        area: a.slug,
        status: "Não iniciada",
        observacoes: "",
        responsavel: "",
      };
      return acc;
    },
    {} as Record<AreaSlug, AreaStatus>
  );

export const acoesFromTemplates = (
  templates: ChecklistTemplate[],
  acaoNecessaria: boolean
): Acao[] =>
  templates
    .filter((t) => t.ativo && (!t.somenteAcaoNecessaria || acaoNecessaria))
    .sort((a, b) => a.area.localeCompare(b.area) || a.ordem - b.ordem)
    .map((t) => ({
      id: `ac-${t.id}-${Math.random().toString(36).slice(2, 7)}`,
      area: t.area,
      nome: t.nome,
      origem: "template",
      concluida: false,
    }));

// ---------- SEED OBRIGAÇÕES ----------
const now = new Date().toISOString();

const mk = (o: Omit<Obrigacao, "areas" | "acoes" | "historico"> & {
  progresso?: Partial<Record<AreaSlug, Partial<AreaStatus>>>;
}): Obrigacao => {
  const areas = emptyAreas();
  if (o.progresso) {
    for (const k of Object.keys(o.progresso) as AreaSlug[]) {
      areas[k] = { ...areas[k], ...o.progresso[k]! };
    }
  }
  const acoes = acoesFromTemplates(DEFAULT_TEMPLATES, o.acaoNecessaria);
  return { ...o, areas, acoes, historico: [] };
};

export const SEED_OBRIGACOES: Obrigacao[] = [
  mk({
    id: "ob-1",
    nome: "Pagamento de Salários",
    tipo: "Mensal",
    linhaModulo: "Folha de Pagamento",
    dataVencimento: "2026-02-05",
    criticidade: "Alta",
    impacto: "Cálculo e geração da folha mensal de todos os clientes.",
    resumo:
      "Rotina mensal de fechamento da folha. Requer verificação de eventos, descontos e integração bancária.",
    statusGeral: "Em andamento",
    acaoNecessaria: true,
    progresso: {
      nexus: { status: "Atualizada", ultimaAtualizacao: now, atualizadoPor: "Ana (NEXUS)" },
      conteudos: { status: "Atualizada", ultimaAtualizacao: now, atualizadoPor: "Bruno" },
      marketing: { status: "Pendente" },
    },
  }),
  mk({
    id: "ob-2",
    nome: "eSocial Geral | MEI | Segurado Especial",
    tipo: "Mensal",
    linhaModulo: "eSocial",
    dataVencimento: "2026-03-15",
    criticidade: "Alta",
    impacto: "Envio de eventos S-1000 a S-5000 conforme calendário do governo.",
    resumo: "Atualização das tabelas e validação dos novos leiautes do eSocial.",
    statusGeral: "Não iniciada",
    acaoNecessaria: true,
    progresso: {
      nexus: { status: "Atualizada", ultimaAtualizacao: now, atualizadoPor: "Ana (NEXUS)" },
    },
  }),
  mk({
    id: "ob-3",
    nome: "EFD Contribuições",
    tipo: "Mensal",
    linhaModulo: "Fiscal",
    dataVencimento: "2026-04-14",
    criticidade: "Média",
    impacto: "Apuração e envio mensal de PIS/COFINS.",
    resumo: "Verificação de regras especiais e validação do leiaute vigente.",
    statusGeral: "Não iniciada",
    acaoNecessaria: false,
  }),
  mk({
    id: "ob-4",
    nome: "Novo cálculo do IRPF Pessoa Física",
    tipo: "Anual",
    linhaModulo: "Folha / IR",
    dataVencimento: "2026-05-29",
    criticidade: "Alta",
    impacto:
      "Alteração na faixa de isenção e nova tabela progressiva para o ano-calendário.",
    resumo:
      "Necessária atualização do motor de cálculo, comunicação ao mercado e treinamento interno.",
    statusGeral: "Em andamento",
    acaoNecessaria: true,
    progresso: {
      nexus: { status: "Atualizada", ultimaAtualizacao: now, atualizadoPor: "Ana (NEXUS)" },
      desenvolvimento: { status: "Em andamento", ultimaAtualizacao: now, atualizadoPor: "Carlos" },
    },
  }),
  mk({
    id: "ob-5",
    nome: "Reforma Tributária do Consumo",
    tipo: "Eventual",
    linhaModulo: "Fiscal / Estratégico",
    dataVencimento: "2026-07-01",
    criticidade: "Alta",
    impacto:
      "Implantação gradual do IBS/CBS impactando módulos fiscais, contábeis e contratos.",
    resumo:
      "Tema estratégico do ano. Requer plano de comunicação, treinamentos e revisão de toda a stack fiscal.",
    statusGeral: "Pendente",
    acaoNecessaria: true,
    progresso: {
      nexus: { status: "Atualizada", ultimaAtualizacao: now, atualizadoPor: "Ana (NEXUS)" },
      conteudos: { status: "Em andamento", ultimaAtualizacao: now, atualizadoPor: "Bruno" },
    },
  }),
  mk({
    id: "ob-6",
    nome: "DCTFWeb - Competência",
    tipo: "Mensal",
    linhaModulo: "Fiscal",
    dataVencimento: "2026-06-15",
    criticidade: "Média",
    impacto: "Geração e transmissão da DCTFWeb mensal.",
    resumo: "Conferência das informações vindas do eSocial e EFD-Reinf.",
    statusGeral: "Não iniciada",
    acaoNecessaria: false,
  }),
  mk({
    id: "ob-7",
    nome: "Férias Coletivas - Comunicação",
    tipo: "Eventual",
    linhaModulo: "RH",
    dataVencimento: "2026-12-10",
    criticidade: "Baixa",
    impacto: "Aviso prévio de férias coletivas para clientes.",
    resumo: "Planejar comunicação institucional e canais de plantão.",
    statusGeral: "Não iniciada",
    acaoNecessaria: false,
  }),
  mk({
    id: "ob-8",
    nome: "DIRF 2026",
    tipo: "Anual",
    linhaModulo: "Fiscal / Folha",
    dataVencimento: "2026-02-27",
    criticidade: "Alta",
    impacto: "Entrega anual obrigatória.",
    resumo: "Validar layout e geração do arquivo.",
    statusGeral: "Em andamento",
    acaoNecessaria: false,
  }),
];

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
