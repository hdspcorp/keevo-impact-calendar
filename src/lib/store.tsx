import * as React from "react";
import {
  AREAS,
  AREA_ORDEM,
  AreaSlug,
  ChecklistTemplate,
  DEFAULT_TEMPLATES,
  Obrigacao,
  SEED_OBRIGACOES,
  acoesFromTemplates,
  emptyAreas,
  StatusGeral,
  StatusArea,
  Acao,
  HistoricoEntry,
  MOCK_USERS,
} from "./domain";

// ---- Auth ----
export type Session =
  | { kind: "admin"; nome: string; email: string }
  | { kind: "area"; nome: string; email: string; area: AreaSlug }
  | null;

type State = {
  obrigacoes: Obrigacao[];
  templates: ChecklistTemplate[];
  session: Session;
};

type Ctx = State & {
  login: (userOrEmail: string, pass: string) => Session;
  logout: () => void;
  canEditArea: (area: AreaSlug) => boolean;

  addObrigacao: (data: NewObrigacaoInput) => Obrigacao;
  updateAreaMeta: (
    obrigacaoId: string,
    area: AreaSlug,
    patch: { observacoes?: string; responsavel?: string; prazo?: string }
  ) => void;
  toggleAcaoSelecionada: (obrigacaoId: string, acaoId: string) => void;
  addCustomAcao: (obrigacaoId: string, area: AreaSlug, nome: string) => void;
  removeAcao: (obrigacaoId: string, acaoId: string) => void;
  promoteCustomToTemplate: (obrigacaoId: string, acaoId: string) => void;
  concluirArea: (obrigacaoId: string, area: AreaSlug) => boolean;
  marcarSemAcao: (obrigacaoId: string, area: AreaSlug) => void;
  reabrirArea: (obrigacaoId: string, area: AreaSlug) => void;
  toggleAcaoNecessaria: (obrigacaoId: string) => void;

  addTemplate: (t: Omit<ChecklistTemplate, "id" | "ordem">) => void;
  updateTemplate: (id: string, patch: Partial<ChecklistTemplate>) => void;
  removeTemplate: (id: string) => void;
  reorderTemplate: (id: string, dir: -1 | 1) => void;
};

export type NewObrigacaoInput = {
  nome: string;
  tipo: Obrigacao["tipo"];
  linhaModulo: string;
  dataVencimento: string;
  criticidade: Obrigacao["criticidade"];
  impacto: string;
  resumo: string;
  statusGeral: StatusGeral;
  acaoNecessaria: boolean;
};

const StoreCtx = React.createContext<Ctx | null>(null);
const LS_KEY = "keevo-impactos-2026-v2";

function loadInitial(): State {
  if (typeof window === "undefined") {
    return { obrigacoes: SEED_OBRIGACOES, templates: DEFAULT_TEMPLATES, session: null };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { obrigacoes: SEED_OBRIGACOES, templates: DEFAULT_TEMPLATES, session: null };
}

function makeHist(
  area: AreaSlug,
  session: Session,
  tipo: HistoricoEntry["tipo"],
  descricao: string
): HistoricoEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    area,
    usuario: session?.nome ?? "Sistema",
    tipo,
    descricao,
    data: new Date().toISOString(),
  };
}

function pushHist(o: Obrigacao, entry: HistoricoEntry): Obrigacao {
  return { ...o, historico: [entry, ...o.historico].slice(0, 60) };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(() => loadInitial());

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const ctx: Ctx = {
    ...state,

    login(userOrEmail, pass) {
      const q = userOrEmail.toLowerCase().trim();
      const found = MOCK_USERS.find(
        (u) =>
          (u.email.toLowerCase() === q ||
            u.email.split("@")[0].toLowerCase() === q) &&
          u.pass === pass
      );
      if (!found) return null;
      const session: Session =
        found.kind === "admin"
          ? { kind: "admin", nome: found.nome, email: found.email }
          : { kind: "area", nome: found.nome, email: found.email, area: found.area! };
      setState((s) => ({ ...s, session }));
      return session;
    },
    logout() {
      setState((s) => ({ ...s, session: null }));
    },
    canEditArea(area) {
      const s = state.session;
      if (!s) return false;
      if (s.kind === "admin") return true;
      return s.area === area;
    },

    addObrigacao(data) {
      const id = `ob-${Date.now()}`;
      const o: Obrigacao = {
        id,
        ...data,
        areas: emptyAreas(),
        acoes: acoesFromTemplates(state.templates, data.acaoNecessaria),
        historico: [],
      };
      o.areas.nexus = { ...o.areas.nexus, responsavel: "NEXUS" };
      const session = state.session;
      const hist = makeHist("nexus", session, "criacao", `Obrigação "${data.nome}" criada.`);
      const final = pushHist(o, hist);
      setState((s) => ({ ...s, obrigacoes: [final, ...s.obrigacoes] }));
      return final;
    },

    updateAreaMeta(obrigacaoId, area, patch) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((o) => {
          if (o.id !== obrigacaoId) return o;
          const prev = o.areas[area];
          const next = {
            ...prev,
            ...patch,
            ultimaAtualizacao: new Date().toISOString(),
            atualizadoPor: s.session?.nome ?? "Sistema",
          };
          return { ...o, areas: { ...o.areas, [area]: next } };
        }),
      }));
    },

    toggleAcaoSelecionada(obrigacaoId, acaoId) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((o) => {
          if (o.id !== obrigacaoId) return o;
          let toggled: Acao | undefined;
          const acoes = o.acoes.map((a) => {
            if (a.id !== acaoId) return a;
            const next: Acao = { ...a, selecionada: !a.selecionada };
            toggled = next;
            return next;
          });
          if (!toggled) return o;
          const area = toggled.area;
          const now = new Date().toISOString();
          let updated: Obrigacao = {
            ...o,
            acoes,
            areas: {
              ...o.areas,
              [area]: {
                ...o.areas[area],
                ultimaAtualizacao: now,
                atualizadoPor: s.session?.nome ?? "Sistema",
                // Se a área estava aguardando, passa a "Em análise" (rascunho)
                status:
                  o.areas[area].status === "Aguardando avaliação" ||
                  o.areas[area].status === "Reaberta"
                    ? "Em análise"
                    : o.areas[area].status,
                // Se ficou sem nenhuma seleção e estava em "Ações selecionadas", volta a "Em análise"
              },
            },
          };
          updated = pushHist(
            updated,
            makeHist(
              area,
              s.session,
              toggled.selecionada ? "acao-marcada" : "acao-desmarcada",
              `${toggled.selecionada ? "Marcou" : "Desmarcou"} a ação "${toggled.nome}"`
            )
          );
          return updated;
        }),
      }));
    },

    addCustomAcao(obrigacaoId, area, nome) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((o) => {
          if (o.id !== obrigacaoId) return o;
          const nova: Acao = {
            id: `ac-custom-${Date.now()}`,
            area,
            nome,
            origem: "custom",
            selecionada: true, // ação customizada já é considerada selecionada
          };
          const now = new Date().toISOString();
          let updated: Obrigacao = {
            ...o,
            acoes: [...o.acoes, nova],
            areas: {
              ...o.areas,
              [area]: {
                ...o.areas[area],
                ultimaAtualizacao: now,
                atualizadoPor: s.session?.nome ?? "Sistema",
                status:
                  o.areas[area].status === "Aguardando avaliação" ||
                  o.areas[area].status === "Reaberta"
                    ? "Em análise"
                    : o.areas[area].status,
              },
            },
          };
          updated = pushHist(
            updated,
            makeHist(area, s.session, "acao-custom-add", `Ação customizada adicionada: "${nome}"`)
          );
          return updated;
        }),
      }));
    },

    removeAcao(obrigacaoId, acaoId) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((o) => {
          if (o.id !== obrigacaoId) return o;
          const acao = o.acoes.find((a) => a.id === acaoId);
          if (!acao || acao.origem !== "custom") return o;
          let updated: Obrigacao = {
            ...o,
            acoes: o.acoes.filter((a) => a.id !== acaoId),
          };
          updated = pushHist(
            updated,
            makeHist(
              acao.area,
              s.session,
              "acao-custom-remove",
              `Ação customizada removida: "${acao.nome}"`
            )
          );
          return updated;
        }),
      }));
    },

    promoteCustomToTemplate(obrigacaoId, acaoId) {
      const session = state.session;
      if (session?.kind !== "admin") return;
      const o = state.obrigacoes.find((x) => x.id === obrigacaoId);
      const acao = o?.acoes.find((a) => a.id === acaoId);
      if (!acao || acao.origem !== "custom") return;
      setState((s) => {
        const ordem = s.templates.filter((t) => t.area === acao.area).length;
        const novo: ChecklistTemplate = {
          id: `tpl-${Date.now()}`,
          area: acao.area,
          nome: acao.nome,
          ordem,
          ativo: true,
          obrigatorio: false,
          somenteAcaoNecessaria: false,
        };
        return { ...s, templates: [...s.templates, novo] };
      });
    },

    concluirArea(obrigacaoId, area) {
      const o = state.obrigacoes.find((x) => x.id === obrigacaoId);
      if (!o) return false;
      const selecionadas = o.acoes.filter((a) => a.area === area && a.selecionada);
      if (selecionadas.length === 0) return false;
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((x) => {
          if (x.id !== obrigacaoId) return x;
          const now = new Date().toISOString();
          let upd: Obrigacao = {
            ...x,
            areas: {
              ...x.areas,
              [area]: {
                ...x.areas[area],
                status: "Concluída",
                semAcaoNecessaria: false,
                concluidaEm: now,
                ultimaAtualizacao: now,
                atualizadoPor: s.session?.nome ?? "Sistema",
              },
            },
          };
          const nomes = selecionadas.map((a) => a.nome).join(", ");
          upd = pushHist(
            upd,
            makeHist(
              area,
              s.session,
              "pronto",
              `Avaliação concluída — ações selecionadas: ${nomes}.`
            )
          );
          return upd;
        }),
      }));
      return true;
    },

    marcarSemAcao(obrigacaoId, area) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((x) => {
          if (x.id !== obrigacaoId) return x;
          const now = new Date().toISOString();
          // Desmarca todas as ações da área
          const acoes = x.acoes.map((a) =>
            a.area === area && a.origem === "template" ? { ...a, selecionada: false } : a
          );
          let upd: Obrigacao = {
            ...x,
            acoes,
            areas: {
              ...x.areas,
              [area]: {
                ...x.areas[area],
                status: "Sem ação necessária",
                semAcaoNecessaria: true,
                concluidaEm: now,
                ultimaAtualizacao: now,
                atualizadoPor: s.session?.nome ?? "Sistema",
              },
            },
          };
          upd = pushHist(
            upd,
            makeHist(
              area,
              s.session,
              "sem-acao",
              "Avaliou o impacto e declarou que nenhuma ação será necessária."
            )
          );
          return upd;
        }),
      }));
    },

    reabrirArea(obrigacaoId, area) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((x) => {
          if (x.id !== obrigacaoId) return x;
          const now = new Date().toISOString();
          let upd: Obrigacao = {
            ...x,
            areas: {
              ...x.areas,
              [area]: {
                ...x.areas[area],
                status: "Reaberta",
                semAcaoNecessaria: false,
                concluidaEm: undefined,
                ultimaAtualizacao: now,
                atualizadoPor: s.session?.nome ?? "Sistema",
              },
            },
          };
          upd = pushHist(
            upd,
            makeHist(area, s.session, "reabertura", "Avaliação reaberta para edição.")
          );
          return upd;
        }),
      }));
    },

    toggleAcaoNecessaria(obrigacaoId) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((o) => {
          if (o.id !== obrigacaoId) return o;
          const v = !o.acaoNecessaria;
          let upd: Obrigacao = { ...o, acaoNecessaria: v };
          upd = pushHist(
            upd,
            makeHist(
              "nexus",
              s.session,
              "nexus-acao-necessaria",
              v
                ? "NEXUS marcou o impacto como Ação necessária."
                : "NEXUS removeu a marcação de Ação necessária."
            )
          );
          return upd;
        }),
      }));
    },

    addTemplate(t) {
      setState((s) => {
        const ordem = s.templates.filter((x) => x.area === t.area).length;
        const novo: ChecklistTemplate = { ...t, id: `tpl-${Date.now()}`, ordem };
        return { ...s, templates: [...s.templates, novo] };
      });
    },
    updateTemplate(id, patch) {
      setState((s) => ({
        ...s,
        templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
    },
    removeTemplate(id) {
      setState((s) => ({ ...s, templates: s.templates.filter((t) => t.id !== id) }));
    },
    reorderTemplate(id, dir) {
      setState((s) => {
        const t = s.templates.find((x) => x.id === id);
        if (!t) return s;
        const sameArea = s.templates
          .filter((x) => x.area === t.area)
          .sort((a, b) => a.ordem - b.ordem);
        const idx = sameArea.findIndex((x) => x.id === id);
        const swap = sameArea[idx + dir];
        if (!swap) return s;
        const map = new Map(s.templates.map((x) => [x.id, { ...x }]));
        const a = map.get(t.id)!;
        const b = map.get(swap.id)!;
        const tmp = a.ordem;
        a.ordem = b.ordem;
        b.ordem = tmp;
        return { ...s, templates: Array.from(map.values()) };
      });
    },
  };

  return <StoreCtx.Provider value={ctx}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = React.useContext(StoreCtx);
  if (!c) throw new Error("useStore must be inside StoreProvider");
  return c;
}

// ---------- Aggregations ----------
export function isAreaAvaliada(o: Obrigacao, area: AreaSlug): boolean {
  const st = o.areas[area].status;
  return st === "Concluída" || st === "Sem ação necessária";
}

export function areaProgress(o: Obrigacao) {
  const total = AREAS.length;
  const atualizadas = AREAS.filter((a) => isAreaAvaliada(o, a.slug)).length;
  return { atualizadas, total, pct: Math.round((atualizadas / total) * 100) };
}

export function ultimaAtualizacaoArea(o: Obrigacao): { area: AreaSlug; iso: string } | null {
  let best: { area: AreaSlug; iso: string } | null = null;
  for (const a of AREAS) {
    const u = o.areas[a.slug].ultimaAtualizacao;
    if (u && (!best || u > best.iso)) best = { area: a.slug, iso: u };
  }
  return best;
}

export function ultimaAreaConcluida(o: Obrigacao): { area: AreaSlug; iso: string } | null {
  let best: { area: AreaSlug; iso: string } | null = null;
  for (const a of AREAS) {
    const c = o.areas[a.slug].concluidaEm;
    if (c && (!best || c > best.iso)) best = { area: a.slug, iso: c };
  }
  return best;
}

export function proximaPendente(o: Obrigacao): AreaSlug | null {
  for (const a of AREA_ORDEM) {
    if (!isAreaAvaliada(o, a)) return a;
  }
  return null;
}

// Compat alias
export const pendenteCom = proximaPendente;

export function acoesSelecionadasDaArea(o: Obrigacao, area: AreaSlug): Acao[] {
  return o.acoes.filter((a) => a.area === area && a.selecionada);
}

export function areaStatusResumo(o: Obrigacao, area: AreaSlug): string {
  const st = o.areas[area].status;
  if (st === "Concluída") {
    const n = acoesSelecionadasDaArea(o, area).length;
    return `${n} ação(ões) selecionadas`;
  }
  if (st === "Sem ação necessária") return "Sem ação necessária";
  if (st === "Em análise") {
    const n = acoesSelecionadasDaArea(o, area).length;
    return n > 0 ? `${n} ação(ões) marcadas` : "Em análise";
  }
  if (st === "Reaberta") return "Reaberta para edição";
  if (st === "Atrasada") return "Atrasada";
  return "Aguardando avaliação";
}
