import * as React from "react";
import {
  AREAS,
  AREA_ORDEM,
  AreaSlug,
  ChecklistTemplate,
  DEFAULT_TEMPLATES,
  Obrigacao,
  SEED_OBRIGACOES,
  SEED_EVENTOS,
  Evento,
  acoesFromTemplates,
  areaOrdemEfetiva,
  emptyAreas,
  StatusGeral,
  Acao,
  HistoricoEntry,
  MOCK_USERS,
} from "./domain";
import { supabase } from "@/integrations/supabase/client";
import { notifyStageCompleted } from "./notifications/client";

// ---- Auth ----
export type Session =
  | { kind: "admin"; nome: string; email: string }
  | { kind: "area"; nome: string; email: string; area: AreaSlug }
  | null;

type Persisted = {
  obrigacoes: Obrigacao[];
  templates: ChecklistTemplate[];
  eventos: Evento[];
};

type State = Persisted & { session: Session };

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
  toggleRequerValidacaoNexus: (obrigacaoId: string) => void;

  addEvento: (e: Omit<Evento, "id" | "criadoEm" | "criadoPor">) => void;
  updateEvento: (id: string, patch: Partial<Evento>) => void;
  removeEvento: (id: string) => void;

  addTemplate: (t: Omit<ChecklistTemplate, "id" | "ordem">) => void;
  updateTemplate: (id: string, patch: Partial<ChecklistTemplate>) => void;
  removeTemplate: (id: string) => void;
  reorderTemplate: (id: string, dir: -1 | 1) => void;

  hydrated: boolean;
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
  requerValidacaoNexus: boolean;
};

const StoreCtx = React.createContext<Ctx | null>(null);
const SESSION_KEY = "keevo-impactos-session-v1";
const CLIENT_ID = (() => {
  if (typeof window === "undefined") return "server";
  try {
    let id = localStorage.getItem("keevo-client-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("keevo-client-id", id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
})();

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

function migrate(p: Partial<Persisted> | null | undefined): Persisted {
  const obrigacoes = (p?.obrigacoes ?? SEED_OBRIGACOES).map((o) => ({
    ...o,
    requerValidacaoNexus: o.requerValidacaoNexus ?? true,
  }));
  return {
    obrigacoes,
    templates: p?.templates ?? DEFAULT_TEMPLATES,
    eventos: p?.eventos ?? SEED_EVENTOS,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(() => ({
    ...migrate(null),
    session: (() => {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
      } catch {
        return null;
      }
    })(),
  }));
  const [hydrated, setHydrated] = React.useState(false);
  const skipNextSaveRef = React.useRef(true);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // -- initial load + realtime subscription --
  React.useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("app_state")
        .select("data")
        .eq("id", 1)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.warn("[store] load failed, using seed", error);
        setHydrated(true);
        return;
      }
      const remote = (data?.data ?? {}) as Partial<Persisted>;
      const empty = !remote.obrigacoes || remote.obrigacoes.length === 0;
      const merged = migrate(empty ? null : remote);
      skipNextSaveRef.current = true;
      setState((s) => ({ ...s, ...merged }));
      setHydrated(true);
    })();

    const channel = supabase
      .channel("app_state_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_state" },
        (payload) => {
          const row = (payload.new ?? payload.old) as
            | { data: Partial<Persisted>; updated_by: string | null }
            | undefined;
          if (!row) return;
          if (row.updated_by === CLIENT_ID) return; // ignora próprio write
          const merged = migrate(row.data);
          skipNextSaveRef.current = true;
          setState((s) => ({ ...s, ...merged }));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // -- persist on change (debounced) --
  React.useEffect(() => {
    if (!hydrated) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const payload: Persisted = {
        obrigacoes: state.obrigacoes,
        templates: state.templates,
        eventos: state.eventos,
      };
      const { error } = await supabase
        .from("app_state")
        .upsert(
          { id: 1, data: payload as unknown as Record<string, unknown>, updated_at: new Date().toISOString(), updated_by: CLIENT_ID },
          { onConflict: "id" }
        );
      if (error) console.warn("[store] save failed", error);
    }, 400);
  }, [state.obrigacoes, state.templates, state.eventos, hydrated]);

  // -- persist session locally --
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (state.session) localStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, [state.session]);

  const ctx: Ctx = {
    ...state,
    hydrated,

    login(userOrEmail, pass) {
      const q = userOrEmail.toLowerCase().trim();
      const found = MOCK_USERS.find(
        (u) =>
          (u.email.toLowerCase() === q || u.email.split("@")[0].toLowerCase() === q) &&
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
      const hist = makeHist("nexus", state.session, "criacao", `Obrigação "${data.nome}" criada.`);
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
          const nowIso = new Date().toISOString();
          let updated: Obrigacao = {
            ...o,
            acoes,
            areas: {
              ...o.areas,
              [area]: {
                ...o.areas[area],
                ultimaAtualizacao: nowIso,
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
            selecionada: true,
          };
          const nowIso = new Date().toISOString();
          let updated: Obrigacao = {
            ...o,
            acoes: [...o.acoes, nova],
            areas: {
              ...o.areas,
              [area]: {
                ...o.areas[area],
                ultimaAtualizacao: nowIso,
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
          let updated: Obrigacao = { ...o, acoes: o.acoes.filter((a) => a.id !== acaoId) };
          updated = pushHist(
            updated,
            makeHist(acao.area, s.session, "acao-custom-remove", `Ação customizada removida: "${acao.nome}"`)
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
          const nowIso = new Date().toISOString();
          let upd: Obrigacao = {
            ...x,
            areas: {
              ...x.areas,
              [area]: {
                ...x.areas[area],
                status: "Concluída",
                semAcaoNecessaria: false,
                concluidaEm: nowIso,
                ultimaAtualizacao: nowIso,
                atualizadoPor: s.session?.nome ?? "Sistema",
              },
            },
          };
          const nomes = selecionadas.map((a) => a.nome).join(", ");
          upd = pushHist(
            upd,
            makeHist(area, s.session, "pronto", `Avaliação concluída — ações selecionadas: ${nomes}.`)
          );
          // notificação fire-and-forget
          const prox = nextPending(upd, area);
          notifyStageCompleted({
            obrigacaoId: upd.id,
            obrigacaoNome: upd.nome,
            areaOrigem: area,
            areaDestino: prox,
            acaoEsperada: nomes,
            prazo: upd.dataVencimento,
            prioridade: upd.criticidade,
            usuario: s.session?.nome ?? "Sistema",
          }).catch(() => {});
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
          const nowIso = new Date().toISOString();
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
                concluidaEm: nowIso,
                ultimaAtualizacao: nowIso,
                atualizadoPor: s.session?.nome ?? "Sistema",
              },
            },
          };
          upd = pushHist(
            upd,
            makeHist(area, s.session, "sem-acao", "Avaliou o impacto e declarou que nenhuma ação será necessária.")
          );
          const prox = nextPending(upd, area);
          notifyStageCompleted({
            obrigacaoId: upd.id,
            obrigacaoNome: upd.nome,
            areaOrigem: area,
            areaDestino: prox,
            acaoEsperada: "Sem ação necessária",
            prazo: upd.dataVencimento,
            prioridade: upd.criticidade,
            usuario: s.session?.nome ?? "Sistema",
          }).catch(() => {});
          return upd;
        }),
      }));
    },

    reabrirArea(obrigacaoId, area) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((x) => {
          if (x.id !== obrigacaoId) return x;
          const nowIso = new Date().toISOString();
          let upd: Obrigacao = {
            ...x,
            areas: {
              ...x.areas,
              [area]: {
                ...x.areas[area],
                status: "Reaberta",
                semAcaoNecessaria: false,
                concluidaEm: undefined,
                ultimaAtualizacao: nowIso,
                atualizadoPor: s.session?.nome ?? "Sistema",
              },
            },
          };
          upd = pushHist(upd, makeHist(area, s.session, "reabertura", "Avaliação reaberta para edição."));
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
              v ? "NEXUS marcou o impacto como Ação necessária." : "NEXUS removeu a marcação de Ação necessária."
            )
          );
          return upd;
        }),
      }));
    },

    toggleRequerValidacaoNexus(obrigacaoId) {
      setState((s) => ({
        ...s,
        obrigacoes: s.obrigacoes.map((o) => {
          if (o.id !== obrigacaoId) return o;
          const v = !(o.requerValidacaoNexus ?? true);
          let upd: Obrigacao = { ...o, requerValidacaoNexus: v };
          upd = pushHist(
            upd,
            makeHist(
              "nexus",
              s.session,
              "info",
              v
                ? "Etapa do NEXUS reativada para este card."
                : "Card marcado como dispensa validação do NEXUS."
            )
          );
          return upd;
        }),
      }));
    },

    addEvento(e) {
      const ev: Evento = {
        ...e,
        id: `ev-${Date.now()}`,
        criadoEm: new Date().toISOString(),
        criadoPor: state.session?.nome ?? "Sistema",
      };
      setState((s) => ({ ...s, eventos: [ev, ...s.eventos] }));
    },
    updateEvento(id, patch) {
      setState((s) => ({
        ...s,
        eventos: s.eventos.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    removeEvento(id) {
      setState((s) => ({ ...s, eventos: s.eventos.filter((e) => e.id !== id) }));
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
        const sameArea = s.templates.filter((x) => x.area === t.area).sort((a, b) => a.ordem - b.ordem);
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
  const ord = areaOrdemEfetiva(o);
  const total = ord.length;
  const atualizadas = ord.filter((a) => isAreaAvaliada(o, a)).length;
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
  for (const a of areaOrdemEfetiva(o)) {
    if (!isAreaAvaliada(o, a)) return a;
  }
  return null;
}
function nextPending(o: Obrigacao, after: AreaSlug): AreaSlug | null {
  const ord = areaOrdemEfetiva(o);
  const idx = ord.indexOf(after);
  for (let i = idx + 1; i < ord.length; i++) {
    if (!isAreaAvaliada(o, ord[i])) return ord[i];
  }
  return null;
}

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

// Re-exports
export { AREA_ORDEM };
