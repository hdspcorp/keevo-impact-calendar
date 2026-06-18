
## Visão geral

Você escolheu "tudo de uma vez", mas a especificação tem 23 seções e introduz um módulo completamente novo (Templates de Fluxo). Para não quebrar nada e manter qualidade visual, vou entregar em **4 fases dentro deste mesmo build**, cada uma terminando em um estado utilizável. Se algo der errado numa fase, podemos rebobinar sem perder as anteriores.

Backend já confirmado: tudo compartilhado via Lovable Cloud + upload real de logo via Storage.

## Fase 1 — Layout estrutural alinhado ao mockup (seções 1, 2, 15, 16, 17, 22)

- **Sidebar navegação** (Calendário, Minha área, Conflitos com badge, Impactos, Relatórios, Configurações, Ajuda) usando shadcn Sidebar, colapsível.
- **Barra sticky no topo do conteúdo** com busca + filtros + botões `Gerenciar obrigações`, `Novo evento`, `Nova obrigação` e slot para botões personalizados do admin. Fundo branco translúcido com leve sombra.
- **Cards do calendário mais limpos**: chip de status do plano em cores (Em preparação amarelo, Em execução azul, Concluído verde, Atenção laranja), badge de template, ícone de conflito, "Próx. área", contagem "Ações (X/Y)", até 3 chips de ações visíveis + "+N".
- **Header redesenhado**: logo + nome + subtítulo + sino notificações + chip "Área logada" com avatar.
- **Todo card clicável** abre painel lateral de resumo (já parcialmente existe — padronizo eventos também).
- **Cores Keevo**: roxo primário consistente, laranja para alerta/atenção, sem excessos.

## Fase 2 — Módulo Templates de Fluxo + Botões personalizados (seções 3–14, 21 parcial)

- **Nova tabela** `templates_fluxo` (compartilhada) com schema completo: identidade do botão, áreas envolvidas, ações padrão, regras de data, dependências, notificações, permissões.
- **Tabela** `obrigacoes_template_link` para rastrear quais itens vieram de qual template.
- **Rota `/admin/templates`** (só admin): lista em cards (nome, botão vinculado, áreas, contagem de ações/notificações, status, ações editar/duplicar/desativar).
- **Wizard de criação** em 7 etapas (accordion):
  1. Identidade (nome, descrição, ícone Lucide, cor, ordem, ativo)
  2. Dados padrão (tipo de item, nome sugerido, área principal, periodicidade, data base, criticidade)
  3. Áreas envolvidas (matriz checkbox: participa / valida / confirma / preenche data / executa / aparece no card / recebe notificação / obrigatória / depende-de)
  4. Ações padrão (lista editável com nome, área, tipo, data, regra, dependência, notificação, exibir no card)
  5. Regras de data (6 tipos: fixa, relativa ao evento, mês anterior, dependente de ação, preenchida pela área, recorrente)
  6. Notificações (antecedência, frequência, atraso, mensagem)
  7. Prévia + Publicar
- **Botões personalizados** aparecem na barra sticky (admin cria → vira atalho com ícone e cor). Templates pré-configurados de seed: "Novidades da Versão" (sem Marketing por padrão, dependência Dev→Conteúdos) e "Keevo Live" (semanal, deadline dia 20 do mês anterior, lembretes 10/5/1/dia).
- **Ao clicar num botão personalizado**: abre criação do item com fluxo pré-preenchido. Usuário área só preenche campos básicos.
- **Edição de template**: pergunta se aplica em itens existentes (nenhum / em aberto / todos).
- **Indicador visual** "Criado por template X" no card.

## Fase 3 — Painéis, Dependências, Conflito e Notificações (seções 10, 11, 18, 19)

- **Painel "Ações da sua área"** (redesign do `ImpactDetailDrawer` na aba ações): pergunta "Sua área terá ação para este impacto? Sim/Não", se Sim mostra catálogo de ações pré-preenchidas (12 sugestões) com formulário compacto inline (data, responsável, observação, exibir no card).
- **Lógica de dependências entre ações**: campo `dependeDe` nas ações; chip "Aguardando: <ação> (<área>)" e bloqueio do botão de concluir até a dependência ser resolvida.
- **Painel de conflito detalhado**: ao clicar no chip conflito, abre Sheet com Item 1 e Item 2 lado a lado, período, área, próxima área, motivo, e ações: Abrir Item 1, Abrir Item 2, Comparar (split), Marcar como analisado, Reprogramar (atalho para editar data).
- **Central interna de notificações**: popover no sino do header com lista por área (próximas, atrasadas, bloqueadas, aguardando confirmação). Computada em tempo real do estado (sem nova tabela).

## Fase 4 — Configurações, Storage e Permissões (seções 20, 21)

- **Bucket de Storage** `calendario-assets` (público) para logos.
- **Rota `/admin/configuracoes`** (só admin): formulário com nome do calendário, subtítulo, upload de logo (PNG/JPG/SVG, preview), salvar/restaurar padrão. Persistido em `app_state` (junto com o estado atual).
- **Header dinâmico**: lê nome/subtítulo/logo das configurações.
- **Sistema de permissões** aplicado em UI: admin vê tudo (criar/editar/excluir botões, templates, configurações); área vê só o que pode editar (próprias ações, observações, status da área). Botões e itens de menu condicionados por `session.kind`.

## Riscos e mitigação

- **Mudanças no modelo de domínio são profundas** (novas estruturas de template, dependências, regras de data). Vou manter compatibilidade: campos novos são opcionais, seed legado continua funcionando via migração no `migrate()`.
- **Wizard de templates é grande**; vou priorizar entregar funcional com UI guiada — refinamentos de UX virão em iteração se necessário.
- **Realtime já funciona**, só preciso garantir que as novas tabelas sigam o mesmo padrão.

## Ordem de execução neste turno

Vou começar pela **Fase 1 inteira** (mais visível, menor risco), depois Fase 4 (Storage + Configurações — independente), depois Fase 2 (Templates — maior peça), por fim Fase 3 (Painéis e notificações). Vou pausar entre fases para você poder checar.

## Detalhes técnicos

- Cards: tokens semânticos novos em `src/styles.css` para status de plano (`--plano-preparacao`, `--plano-execucao`, `--plano-concluido`, `--plano-risco`).
- Sidebar: `SidebarProvider` no `__root.tsx`, `AppSidebar` em `src/components/AppSidebar.tsx`.
- Sticky bar: `position: sticky; top: 0; z-index: 30; backdrop-blur` dentro do main.
- Templates: tabela `templates_fluxo` com JSONB `config` para flexibilidade + colunas indexáveis (nome, ativo, ordem, criado_em). GRANT para authenticated; RLS aberto para read/write inicialmente (admin-only enforced em UI até evoluir auth real).
- Storage: bucket público `calendario-assets`, política RLS para insert/update apenas via signed upload do admin.
- Domínio: novos tipos `TemplateFluxo`, `AcaoTemplate`, `RegraData`, `RegraNotificacao`, `DependenciaAcao`. Campo `templateOrigemId?: string` em `Obrigacao` e `Evento`.
