# Plano — Finalização do Calendário de Impactos 2026

Vou implementar tudo o que falta em um único ciclo, dividido em 4 blocos. Antes de começar quero confirmar o escopo abaixo para evitar retrabalho — é um pacote grande (muitas telas, backend novo, permissões), então qualquer desvio agora economiza horas depois.

## Bloco 0 — Ajustes da Fase 1 (sidebar e visão pública)

- Sidebar **só aparece para usuário logado**. Visitante sem login vê apenas o calendário, header e barra sticky reduzida (sem botões de criação/gestão).
- Quando o usuário loga, a sidebar inicia **recolhida** (modo ícone) e ele expande manualmente. A preferência fica salva no `localStorage`.
- Visão pública mostra cards em modo "somente leitura": clique abre o painel de resumo, mas sem editar status/ações.

## Bloco 1 — Configurações e identidade visual (Fase 4)

- Nova rota `/admin/configuracoes` (só admin).
- Bucket público `calendario-assets` no backend + tabela `app_settings` (singleton) com `nome_calendario`, `subtitulo`, `logo_url`, `cor_primaria`.
- Upload real de logo (PNG/JPG/SVG, ≤ 2 MB) com preview ao vivo.
- Header passa a ler `app_settings` em vez de constantes; fallback para Keevo.

## Bloco 2 — Painel Administrativo de Usuários (novo, pedido nesta mensagem)

- Nova rota `/admin/usuarios` (só admin).
- Lista de usuários com filtros por área e papel.
- Ações por linha: **editar dados** (nome, e‑mail, área), **resetar senha** (gera nova senha temporária via Admin API), **revogar acesso** (delete user), **promover/rebaixar** entre `admin` / `area` / `viewer`.
- Convite de novo usuário por e-mail (cria conta + papel + área inicial).
- Backend:
  - Tabela `user_roles` com enum `app_role` (admin, area, viewer) + função `has_role` (security definer).
  - Tabela `profiles` (id ↔ auth.users, nome, area_slug, ativo).
  - Server functions protegidas com `requireSupabaseAuth` + verificação `has_role(uid, 'admin')`, usando `supabaseAdmin` carregado dentro do handler para as chamadas privilegiadas (reset senha, delete user).
  - Trigger `on_auth_user_created` cria profile vazio automaticamente.
- Sidebar ganha seção "Administração" visível só para admin: Configurações, Usuários, Templates.

## Bloco 3 — Templates de Fluxo + Botões personalizados (Fase 2)

- Tabelas novas:
  - `templates_fluxo` (id, nome, descricao, icone, cor, ativo, config jsonb, created_by, created_at).
  - `obrigacoes_template_link` (obrigacao_id, template_id, criada_em).
- `config` jsonb guarda: áreas envolvidas, ações padrão, regras de data (6 tipos: data fixa, dia do mês, dia da semana, X dias antes/depois de outro item, recorrência mensal/semanal), dependências entre ações, permissões por área, configurações de notificação.
- Rota `/admin/templates` (admin):
  - Lista em cards com badge ativo/inativo, contagem de itens criados.
  - Wizard de criação em 7 etapas: 1) Identidade, 2) Áreas, 3) Ações padrão, 4) Dependências, 5) Regras de data, 6) Notificações, 7) Permissões & botão personalizado.
  - Editar template pergunta se aplica alterações em itens existentes (com preview do impacto).
- Botões personalizados aparecem na **barra sticky** apenas para áreas autorizadas no template; clicar cria uma obrigação pré-preenchida.
- Seeds embarcados via migration:
  - "Novidades da Versão" (todas as áreas exceto Marketing, mensal).
  - "Keevo Live" (semanal, deadline dia 20 do mês anterior).
- Cards do calendário ganham badge "via template: X" (já preparado na Fase 1, faltava ligar ao dado real).

## Bloco 4 — Painéis, dependências, conflito e notificações (Fase 3)

- **Painel "Ações da sua área"** (Sheet a partir de `MyAreaCards`): formulário inline compacto por ação, com:
  - Status (Pendente, Em andamento, Concluída, Bloqueada).
  - Campo de observação + anexos (Storage `acoes-anexos`).
  - Botão concluir desabilitado se houver `dependeDe` ainda não concluída, com tooltip explicando.
- **Painel de conflito** redesenhado (Sheet comparativo): mostra os dois itens lado a lado, datas em conflito destacadas, próximas áreas pendentes, sugestão de ação (adiar/encaixar/manter) e botão "marcar como resolvido" que escreve em `conflitos_resolvidos`.
- **Central de notificações** (popover no sino do header):
  - Tabela `notificacoes` (id, area_destino, tipo, titulo, descricao, obrigacao_id, lida, created_at).
  - Eventos que geram notificação: nova obrigação atribuída, próxima etapa minha, dependência liberada, conflito novo, prazo em < 7 dias, comentário do admin.
  - Marca como lida ao clicar; "marcar todas" no rodapé.
- Server route `/api/public/notify.stage-completed` continua, mas passa também a gravar em `notificacoes`.

## Permissões resumidas

| Capacidade | Visitante | Área logada | Admin |
|---|---|---|---|
| Ver calendário | ✅ | ✅ | ✅ |
| Sidebar | ❌ | ✅ | ✅ |
| Atualizar ações da própria área | ❌ | ✅ | ✅ |
| Criar obrigação / evento | ❌ | ❌ | ✅ |
| Gerir templates, botões, config, usuários | ❌ | ❌ | ✅ |

## Ordem de execução

Bloco 0 → 1 → 2 → 3 → 4. Cada bloco entrega rotas e telas funcionais, então mesmo que algo precise de ajuste no fim, o calendário não fica quebrado no meio do caminho.

## Pontos que preciso confirmar antes de codar

1. **Primeiro admin**: como definir? Sugiro promover automaticamente, via migration, o primeiro usuário cujo e-mail bater com uma lista que você me passar agora (ex.: `seu@email.com`). Sem isso, ninguém entra na área admin depois que ligarmos as permissões reais.
2. **Reset de senha**: ok gerar uma senha temporária mostrada uma vez ao admin (ele copia e envia), ou prefere disparar e-mail de "definir nova senha" para o usuário?
3. **Cor primária configurável**: posso deixar o admin trocar a cor de destaque do calendário (roxo Keevo por padrão), ou trava no roxo?
4. **Visão pública dos templates/conflitos**: visitante vê o badge de "via template" e o ícone de conflito, ou esses indicadores aparecem só para usuários logados?

Responda só esses 4 pontos (ou diga "tanto faz, decide você") e eu já parto para a implementação dos 5 blocos de uma vez.
