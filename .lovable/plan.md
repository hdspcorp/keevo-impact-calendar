# Reconstrução do Calendário / Gestão de Impactos

Entrega única, aderente ao documento builder (mockups como referência visual, não a UI atual). Abaixo o que será feito, agrupado por bloco. Nada nasce travado: tudo que o ADMIN cria continua editável.

## 1. Modelagem (fonte única de verdade)
- Entidade base **Item do Calendário** com `tipo: 'evento' | 'obrigacao'` e contexto **Impacto** (áreas envolvidas, ações planejadas, checklist, status).
- Áreas tornam-se **configuráveis** (CRUD pelo ADMIN), incluindo **Curadoria** no mesmo nível de Conteúdo/Marketing (paralelo, não bloqueia).
- Ações por área ganham: `responsavel`, `status`, `observacao`, `dataInicio?`, `dataFim?`, `exibirNoCard: boolean`.
- Atalhos inteligentes viram entidade real (`AtalhoInteligente`): nome, descrição, tipo, áreas, ações padrão, recorrência, notificações, visibilidade, ativo, ordem.
- Recorrência: semanal, mensal, dias úteis, com regra "se cair em dia não útil → antecipar | postergar".
- Configurações do módulo (`ModuleSettings`): seções do detalhe (ordem/visibilidade), labels editáveis, notificações (canal, destinatários, regras).
- Persistência: tudo continua em `app_state` (snapshot JSON) — já é o padrão do projeto e mantém edição em runtime pelo ADMIN.

## 2. Login (`AreaLoginDialog` / tela de login)
- Remove totalmente blocos de "exemplo de acesso", credenciais demo, dicas de teste.
- Mantém ADMIN/ADMIN funcional.
- Adiciona fluxo "Alterar senha" (perfil/admin) para o ADMIN trocar a senha posteriormente.
- Visual profissional, sem aparência de demo.

## 3. Home pública e logada
- Home **clean**: remove `MetricsBar` da home principal (já feito) e garante que nenhum card de métrica apareça lá.
- Métricas (total, áreas avaliadas, ações planejadas, em risco, conflitos) ficam **apenas em "Minha Área"**.
- **Atalhos rápidos/inteligentes**: visíveis para ADMIN **e** usuário logado; ocultos para visitante sem login.
- Remove o item de menu lateral "Impactos" (sem função real).
- Refino visual: tipografia, espaçamento, hierarquia, mantendo identidade Keevo.

## 4. Detalhe do Item (Referência Visual A)
Redesenho de `ImpactDetailDrawer` priorizando **Ações Planejadas**:
- Cabeçalho com título, tipo, data, recorrência, status compacto.
- Bloco principal: **Ações planejadas por área** (lista agrupada, com badge de status, responsável, datas, ícone "exibir no card").
- Blocos secundários (colapsáveis, reordenáveis via config do ADMIN): Áreas envolvidas, Trilha de status, Conflitos, Histórico, Anexos/observações.
- Botão "Abrir painel da área" em cada área → abre painel de ações.
- Garante que **qualquer clique** em evento ou obrigação no calendário abre o detalhe (corrige bug atual).

## 5. Painel da Área (Referência Visual B)
Novo componente `AreaActionsPanel`:
- Toggle: **"Temos ações"** vs **"Não há ação necessária"** (registra histórico).
- Lista de ações com edição inline; adicionar nova ação.
- Por ação: responsável, status, observação, data início (opcional), data fim (opcional), switch "exibir no card".
- Botões "Salvar ação" e "Salvar e fechar".

## 6. Cadastro de Item (`NewObrigacaoDrawer` / `NewEventoDrawer`)
- Toggle "Item padrão" → carrega checklist padrão por área.
- Permite **remover áreas inteiras** e **desmarcar ações** caso a caso, mesmo no padrão.
- Curadoria disponível como área padrão.
- Recorrência com regra de dia útil (antecipar/postergar).

## 7. Conflitos (`ConflitosDrawer`)
- Já side-by-side; reforça **comparação direta** dos dois itens em conflito com botão "Ajustar" que abre o item para edição imediata.

## 8. Atalhos Inteligentes — Admin (`AdminAtalhosPage`)
- CRUD completo: criar, editar, ativar/desativar, **reordenar (drag)**.
- Editor com: nome, descrição, tipo de item, áreas, ações padrão (puxando do menu Checklist), recorrência, notificações, visibilidade, status.
- Ao clicar no atalho na home → abre `NewObrigacaoDrawer` pré-carregado com a estrutura do atalho.

## 9. Modo Edição do ADMIN (novo `AdminModuloPage`)
Painel único de configuração do módulo onde o ADMIN edita:
- **Áreas** (criar/renomear/ativar/desativar/reordenar/ocultar) — inclui Curadoria já presente.
- **Ações padrão** por área (checklists).
- **Tipos de item / templates**.
- **Seções do detalhe** (ordem + visibilidade dos blocos).
- **Labels e textos** administrativos.
- **Notificações** (canais: e-mail funcional mínimo + Discord preparado; destinatários, regras, gatilhos).
Tudo persistido em `app_state.config` para nada nascer travado.

## 10. Notificações
- Estrutura configurável (`NotificacaoConfig`): canal, evento (ex: nova ação, conflito, prazo), destinatários por área, template.
- E-mail como canal funcional mínimo (server route `/api/public/notify.email` — preparado, sem provider hardcoded; envia via webhook configurável).
- Discord mantido via webhook já existente.

## 11. Curadoria no Fluxo
- Área "Curadoria" adicionada às áreas padrão, no mesmo nível de Conteúdo/Marketing (paralelo, sem bloquear).
- Campo no detalhe: "Previsão de QAS (DEV → Curadoria)" + "Apresentação da implementação".

## 12. Permissões consolidadas
- **Visitante**: vê calendário + detalhe (read-only). Sem atalhos, sem botões de criação.
- **Usuário logado**: tudo do visitante + atalhos rápidos + cadastro + painel da sua área.
- **ADMIN**: tudo + modo edição do módulo + gestão de usuários + atalhos + configurações.

## 13. Auto-teste antes de fechar
Roteiro executado via Playwright headless:
- Abrir home (pública e logada), conferir ausência de métricas na home.
- Métricas visíveis em "Minha Área".
- Clique em evento e obrigação → detalhe abre.
- Detalhe mostra ações planejadas.
- Painel de área: marcar "sem ação", adicionar ação com/sem data, toggle "exibir no card".
- Atalhos visíveis para ADMIN e logado, ocultos sem login.
- ADMIN cria/edita/reordena atalho; cria item via atalho.
- Cadastro padrão permite remover área/ação.
- Recorrência com dia útil.
- Conflitos comparativos.
- Login sem exemplos; ADMIN/ADMIN funciona; troca de senha disponível.
- Modo edição ADMIN: criar/editar/reordenar área e ação.

## Detalhes técnicos
- Alterações em `src/lib/domain.ts` (tipos), `src/lib/store.tsx` (estado/config), `src/components/ImpactDetailDrawer.tsx`, novo `src/components/AreaActionsPanel.tsx`, `src/components/admin/AdminAtalhosPage.tsx`, novo `src/components/admin/AdminModuloPage.tsx`, `AdminUsersPage` (alteração de senha), `NewObrigacaoDrawer`, `ConflitosDrawer`, `AppSidebar` (remove "Impactos"), `AtalhosBar` (regra de visibilidade), `MyAreaCards` (métricas).
- Sem novas tabelas: persistência continua em `app_state` (JSON), o que mantém editabilidade total em runtime.
- Sem novas dependências externas obrigatórias.

Confirma para eu executar tudo em uma única entrega?
