
## 1. Backend (Lovable Cloud) — resolve dados não compartilhados

Ativar Cloud e migrar o store de `localStorage` para Postgres com RLS. Auth simples por e-mail/senha (admin@keevo.com, nexus@keevo.com, etc. seedados).

Tabelas (schema `public`, com GRANTs + RLS):
- `obrigacoes` — campos atuais do tipo `Obrigacao` + `requer_validacao_nexus boolean default true`.
- `impactos` — vinculados a obrigações.
- `area_status` — status/histórico por área por impacto (substitui campos in-memory).
- `acoes_template` — checklist padrão por área (compartilhado).
- `acoes_impacto` — itens de checklist instanciados por impacto/área, com `selecionada`, `concluida`, `responsavel`, `custom`.
- `eventos` — novo: id, titulo, area, tipo, data_inicio, data_fim, descricao, responsavel, relevancia, gera_conflito, observacoes, criado_em, criado_por.
- `notificacoes_enviadas` — dedup de disparos (chave: `impacto_id + area_origem + area_destino + etapa`).
- `user_roles` (app_role enum: admin, nexus, area_user) + função `has_role`.

Políticas: leitura autenticada ampla (sistema interno); escrita restrita por área via `has_role`/`raw_user_meta_data.area`. Admin tudo.

Server functions (`src/lib/*.functions.ts`) substituem mutações do store: `listObrigacoes`, `upsertObrigacao`, `listEventos`, `upsertEvento`, `deleteEvento`, `concluirArea`, `marcarSemAcao`, `toggleAcao`, `addAcaoCustom`, `promoverParaTemplate`, `listNotificacoesEnviadas`. Cada uma com `requireSupabaseAuth`.

Store passa a ser um wrapper React Query (`useQuery` + `useMutation` com invalidação) — API pública mantém os mesmos hooks usados hoje pelos componentes para minimizar refactor.

## 2. Notificação Discord (multi-canal, seguro)

- Secret `DISCORD_WEBHOOK_URL` via `add_secret`.
- `src/lib/notifications/dispatcher.server.ts`: interface `NotificationChannel { send(payload) }`, implementação `discordChannel` (fetch ao webhook). Estrutura permite adicionar `emailChannel` depois sem refactor.
- `dispatchStageCompleted({ impactoId, areaOrigem, areaDestino, ... })`: monta payload (card, ação esperada, prazo, prioridade, link `/?impacto=ID`, timestamp), checa `notificacoes_enviadas`, envia, registra.
- Chamado dentro de `concluirArea` / `marcarSemAcao` server-side (fire-and-forget com try/catch logado).
- Nenhum webhook no bundle do cliente.

## 3. Novo Dashboard estratégico (substitui `AreaProgressPanel`)

Componente `src/components/dashboard/Dashboard.tsx` com tabs:

**Resumo** — KPIs absorvendo os 4 cards atuais (`SummaryCards` deixa de ser renderizado solto) + Ações atrasadas, Conflitos, Próximas áreas pendentes, Cards sem NEXUS.

**Alertas** — lista priorizada de conflitos detectados por `detectarConflitos()`:
- `marketing-overlap` (ação no mesmo período de evento Marketing),
- `multi-area` (≥2 áreas com ação relevante no período),
- `vencimento-sem-acao` (obrigação ≤30d sem ação marcada),
- `dependencia-longa` (>14d aguardando mesma área),
- `sem-responsavel`.

**Próximas Ações** — tabela compacta (item, área, prazo, status, prioridade) com ordenação por urgência.

**Fluxo** — por obrigação: última área que atuou + próxima pendente + data movimentação.

Filtros locais no topo: período, área, tipo evento, status, prioridade, conflito, requer NEXUS, eventos Marketing, vencendo em 60d.

## 4. Eventos por área

- `NewEventoDrawer.tsx` (CRUD) + botão "Novo evento" no header.
- `EventoCard.tsx` — visual distinto de obrigação; Marketing recebe ícone `Megaphone` + borda laranja Keevo.
- `CalendarGrid.tsx` — renderiza eventos junto às obrigações, com ícone `AlertTriangle` quando há conflito detectado.

## 5. Cards de impacto sem NEXUS

- `NewObrigacaoDrawer` e `ImpactDetailDrawer`: Switch "Requer validação do NEXUS?" com texto auxiliar.
- `StatusTrail`: oculta etapa NEXUS quando `false`.
- `ObrigacaoCard`: badge discreta "Sem validação NEXUS".
- `proximaPendente()` e fluxo de notificação pulam NEXUS automaticamente.

## 6. Cards do calendário mais enxutos (densidade média)

Refactor de `ObrigacaoCard.tsx` e `EventoCard.tsx`:
- Padding reduzido (`p-2`), tipografia menor (`text-xs` no título, `text-[10px]` em metadados).
- Badges compactos: substituir labels longos por ícones com tooltip (estrela roxa NEXUS, alerta de conflito, sem-NEXUS).
- Uma linha de título + uma linha de metadados (área | prazo) + faixa lateral colorida por status. Sem repetição visual.

## 7. Arquivos a tocar

Criar: 12 server fns (`*.functions.ts`), migration SQL, `Dashboard.tsx` + 4 sub-tabs, `NewEventoDrawer.tsx`, `EventoCard.tsx`, `notifications/*`, `useEventos.ts`, `useObrigacoes.ts`.
Editar: `store.tsx` (vira React Query wrapper), `routes/index.tsx`, `CalendarGrid.tsx`, `ObrigacaoCard.tsx`, `NewObrigacaoDrawer.tsx`, `ImpactDetailDrawer.tsx`, `StatusTrail.tsx`, `Header.tsx`, `Filters.tsx`, `start.ts` (attacher), `domain.ts` (tipos), `AreaLoginDialog.tsx` (passa a usar Supabase auth).
Remover: `AreaProgressPanel.tsx`, render solto de `SummaryCards` no index.

## 8. Ordem de execução

1. Ativar Cloud + migration + seeds + auth.
2. Server fns + React Query wrapper no store (mantendo API).
3. Dashboard novo + remoção de `AreaProgressPanel`/`SummaryCards` solto.
4. Eventos (drawer + card + calendar integration + conflitos).
5. Toggle "Requer NEXUS" + ajustes de fluxo.
6. Cards mais enxutos (densidade média).
7. Discord (secret + dispatcher + hook nas mutações).

Depois do plano aprovado, peço o `DISCORD_WEBHOOK_URL` via `add_secret` no momento certo (passo 7) — não junto com a ativação do Cloud.
