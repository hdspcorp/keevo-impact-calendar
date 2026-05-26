import * as React from "react";
import {
  AREAS,
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
} from "./domain";

// ---- Auth (mock) ----
export type Session =
  | { kind: "admin"; nome: string }
  | { kind: "area"; nome: string; area: AreaSlug }
  | null;

// Mock credenciais: senha = área (ex: "nexus"). Admin: admin / admin
const MOCK_USERS: { user: string; pass: string; session: Exclude<Session, null> }[] = [
  { user: "admin", pass: "admin", session: { kind: "admin", nome: "Administrador" } },
  ...AREAS.map((a) => ({
    user: a.slug,
    pass: a.slug,
    session: { kind: "area" as const, nome: `Usuário ${a.nome}`, area: a.slug },
  })),
];

type State = {
  obrigacoes: Obrigacao[];
  templates: ChecklistTemplate[];
  session: Session;
};

type Ctx = State & {
  // auth
  login: (user: string, pass: string) => Session;
  logout: () => void;
  canEditArea: (area: AreaSlug) => boolean;
  // obrigacoes
  addObrigacao: (data: NewObrigacaoInput) => Obrigacao;
  updateAreaStatus: (
    obrigacaoId: string,
    area: AreaSlug,
    patch: { status?: StatusArea; observacoes?: string; responsavel?: string }
  ) => void;
  toggleAcao: (obrigacaoId: string, acaoId: string) => void;
  addCustomAcao: (obrigacaoId: string, area: AreaSlug, nome: string) => void;
  removeAcao: (obrigacaoId: string, acaoId: string) => void;
  toggleAcaoNecessaria: (obrigacaoId: string) => void;
  // templates
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

const LS_KEY = "keevo-impactos-2026-v1";

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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(() => loadInitial());

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const addHistorico = (
    o: Obrigacao,
    area: AreaSlug,
    descricao: string,
    session: Session
  ): Obrigacao => {
    const entry: HistoricoEntry = {
      id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      area,
      usuario: session?.nome ?? "Sistema",
      descricao,
      data: new Date().toISOString(),
    };
    return { ...o, historico: [entry, ...o.historico].slice(0, 30) };
  };

  const ctx: Ctx = {
    ...state,

    login(user, pass) {
      const found = MOCK_USERS.find(
        (u) => u.user.toLowerCase() === user.toLowerCase() && u.pass === pass
      );
      if (!found) return null;
      setState((s) => ({ ...s, session: found.session }));
      return found.session;
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
      o.areas.nexus = {
        ...o.areas.nexus,
        responsavel: "NEXUS",
      };
      setState((s) => ({ ...s, obrigacoes: [o, ...s.obrigacoes] }));
      return o;
    },

    updateAreaStatus(obrigacaoId, area, patch) {
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
          const updated = { ...o, areas: { ...o.areas, [area]: next } };
          return addHistorico(
            updated,
            area,
            patch.status ? `Status atualizado para "${patch.status}"` : "Informações atualizadas",
            s.session
          );
        }),
      }));
    },

    toggleAcao(obrigacaoId, acaoId) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((o) => {
          if (o.id !== obrigacaoId) return o;
          let toggled: Acao | undefined;
          const acoes = o.acoes.map((a) => {
            if (a.id !== acaoId) return a;
            toggled = { ...a, concluida: !a.concluida };
            return toggled;
          });
          let updated = { ...o, acoes };
          if (toggled) {
            updated = addHistorico(
              updated,
              toggled.area,
              `${toggled.concluida ? "Concluiu" : "Reabriu"} ação: ${toggled.nome}`,
              s.session
            );
            // also update area's lastUpdate
            const a = toggled.area;
            updated.areas[a] = {
              ...updated.areas[a],
              ultimaAtualizacao: new Date().toISOString(),
              atualizadoPor: s.session?.nome ?? "Sistema",
            };
          }
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
            concluida: false,
          };
          let updated = { ...o, acoes: [...o.acoes, nova] };
          updated = addHistorico(updated, area, `Adicionou ação customizada: ${nome}`, s.session);
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
          let updated = { ...o, acoes: o.acoes.filter((a) => a.id !== acaoId) };
          if (acao)
            updated = addHistorico(updated, acao.area, `Removeu ação: ${acao.nome}`, s.session);
          return updated;
        }),
      }));
    },

    toggleAcaoNecessaria(obrigacaoId) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((o) => {
          if (o.id !== obrigacaoId) return o;
          const v = !o.acaoNecessaria;
          let updated = { ...o, acaoNecessaria: v };
          updated = addHistorico(
            updated,
            "nexus",
            v ? "NEXUS marcou como Ação necessária" : "NEXUS removeu marcação de Ação necessária",
            s.session
          );
          return updated;
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

// Aggregations
export function areaProgress(o: Obrigacao) {
  const total = AREAS.length;
  const atualizadas = AREAS.filter((a) => {
    const st = o.areas[a.slug].status;
    return st === "Atualizada" || st === "Concluída";
  }).length;
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

export function pendenteCom(o: Obrigacao): AreaSlug | null {
  const ordem: AreaSlug[] = ["nexus", "desenvolvimento", "conteudos", "marketing", "operacoes"];
  for (const a of ordem) {
    const st = o.areas[a].status;
    if (st !== "Atualizada" && st !== "Concluída") return a;
  }
  return null;
}
