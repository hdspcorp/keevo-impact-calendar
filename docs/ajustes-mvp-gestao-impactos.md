# Ajustes MVP — Calendário de Gestão de Impactos

## Contexto

A plataforma centraliza impactos conhecidos que exigem planejamento antecipado entre NEXUS, Desenvolvimento, Conteúdos, Curadoria, Marketing/Comercial e Operações.

Exemplo: obrigatoriedade de CBS/IBS em notas fiscais, com possível aumento de ligações, tickets, necessidade de conteúdo, Keevo Live, suporte ao vivo, treinamento interno e ajustes de sistema.

## Alterações já iniciadas na branch `ajustes-mvp-impactos`

### 1. Próxima área visível apenas para usuários logados

Implementado nos arquivos:

- `src/components/CalendarGrid.tsx`
- `src/components/ObrigacaoCard.tsx`

O card agora recebe a prop `showNextArea={!!session}`. Visitantes sem login não visualizam a informação "Próx. área".

### 2. Confirmação e auditoria local para exclusão de eventos

Implementado parcialmente em `src/components/CalendarGrid.tsx`.

Ao excluir evento, o sistema pede confirmação com `window.confirm` e grava auditoria local em `localStorage` por aproximadamente 92 dias na chave:

`keevo-impactos-exclusoes-v1`

Campos gravados:

- tipo
- id
- título
- usuário
- e-mail
- data/hora da exclusão

> Observação: para auditoria corporativa real por 3 meses, o ideal é persistir essa informação no Supabase, não apenas em `localStorage`.

## Alterações pendentes para conclusão do MVP

### 1. Excluir cards de impacto/obrigação

Hoje o store possui `removeEvento`, mas não possui uma função equivalente clara para remover obrigações/impactos.

Implementar no `src/lib/store.tsx`:

```ts
removeObrigacao: (id: string) => void;
```

Regras:

- Usuário logado pode excluir cards que tenha permissão para editar.
- Admin pode excluir qualquer card.
- Antes de excluir, exibir confirmação.
- Registrar auditoria por pelo menos 3 meses.
- Auditoria deve conter: tipo, id, nome/título, usuário, e-mail, data/hora e motivo opcional.

Recomendação técnica:

- Criar tabela Supabase `audit_logs` ou incluir `auditLogs` no `app_state`.
- Preferível tabela separada para não perder histórico quando o `app_state` for sobrescrito.

### 2. Corrigir edição dos detalhes das ações

Arquivo afetado:

- `src/components/ImpactDetailDrawer.tsx`

Problema atual:

Os campos de ação — responsável, status, data início, data fim, observação e "exibir no card principal" — tentam descobrir a obrigação pai usando uma função que chama `useStore()` fora do fluxo correto do React:

```ts
findObrigacaoIdForAcao(a)
```

Isso torna a edição instável e explica por que os campos não gravam corretamente.

Correção recomendada:

- Remover `findObrigacaoIdForAcao` e `useStoreSafe`.
- Passar `obrigacao.id` do componente `AreaRow` para cada `ActionItem`.
- Ou passar diretamente um callback `onUpdate={(patch) => updateAcao(obrigacao.id, a.id, patch)}`.
- Deixar os campos visíveis por padrão, sem depender do clique no lápis.

Campos que devem ficar visíveis na linha da ação:

- Responsável
- Status
- Data início
- Data fim
- Observação
- Checkbox: Exibir esta ação no card principal do calendário

### 3. Melhorar detalhamento do card

Ao clicar no card, a visão deve ser mais objetiva, bonita e organizada.

Estrutura sugerida:

1. Cabeçalho com nome do impacto, módulo, criticidade, data e status geral.
2. Resumo objetivo do impacto.
3. Bloco "Leitura rápida": data do impacto, status do plano, ação necessária, próxima área responsável.
4. Bloco "Ações planejadas" agrupado por área, com responsável, status e datas.
5. Bloco "Situação por área" com edição direta.
6. Histórico recente.

### 4. Renomear botão "Gerenciar Obrigações"

Arquivo afetado:

- `src/routes/index.tsx`

Nome atual não é intuitivo.

Sugestões:

- Configurar ações padrão
- Padrões por área
- Checklist padrão das áreas

Recomendação: usar **Configurar ações padrão**.

### 5. Ampliar templates/padrões por área

Arquivo provável:

- `src/components/ManageTemplatesDrawer.tsx`

O gerenciamento atual deve permitir configurar não só o nome da ação padrão, mas também:

- responsável padrão;
- status padrão;
- prazo relativo padrão, quando aplicável;
- se a ação deve aparecer no card principal por padrão;
- se a ação só aparece quando o impacto for marcado como ação necessária.

Isso exige ampliar o tipo `ChecklistTemplate` em `src/lib/domain.ts`:

```ts
responsavelPadrao?: string;
statusPadrao?: AcaoStatus;
exibirNoCardPadrao?: boolean;
diasInicioPadrao?: number;
diasFimPadrao?: number;
```

E ajustar `acoesFromTemplates` para criar ações já com esses padrões.

### 6. Atalhos para criação rápida de cards/eventos

Hoje o atalho cria evento com uma área principal.

Necessidade:

- Ao usar atalho, permitir definir áreas envolvidas no evento.
- O atalho deve acelerar a criação, mas não limitar a configuração.

Opções técnicas:

1. Manter `area` como área responsável e adicionar `areasEnvolvidas?: AreaSlug[]` ao tipo `Evento`.
2. Atualizar `NewEventoDrawer.tsx` para exibir checkboxes de áreas envolvidas.
3. Atualizar `EventoCard.tsx` e `EventoDetailDrawer.tsx` para mostrar áreas envolvidas.

### 7. Usuários padrão

Adicionar como usuários mock ou via seed persistido:

| Nome | Perfil | Área | E-mail |
|---|---|---|---|
| Humberto | Admin Master | Todas | humberto.pereira@keevo.com.br |
| Aline | Área | Conteúdos | aline.passos@keevo.com.br |
| Michelle | Área | Curadoria | michelle.ramos@keevo.com.br |
| Kenia | Área | Desenvolvimento | kenias@keevo.com.br |
| Luan | Área | Marketing/Comercial | luan.oliveira@keevo.com.br |
| Lorena | Área | Operações | Lorena.fontoura@keevo.com.br |
| Susany | Área | NEXUS | susany.silva@keevo.com.br |

Recomendação temporária para MVP:

- Definir senha inicial padrão por usuário e obrigar alteração futura.
- Evitar expor senhas em tela pública.

### 8. Notificações por e-mail configuráveis

A aplicação já possui Supabase e uma camada de notificações (`src/lib/notifications/client`).

Necessidade funcional:

- Notificar áreas quando novo impacto for criado.
- Permitir configurar se notifica por área envolvida.
- Permitir notificar com antecedência: no momento da criação, 1 semana antes, X dias antes.
- Permitir notificar quando uma área concluir sua etapa e a próxima área precisar agir.

Recomendação técnica:

- Criar configuração em `AppSettings`:

```ts
emailNotifications?: {
  enabled: boolean;
  notifyOnNewImpact: boolean;
  notifyInvolvedAreasOnly: boolean;
  daysBeforeDue: number[];
  notifyOnStageCompleted: boolean;
}
```

- Criar Edge Function no Supabase para envio real de e-mail.
- Usar Resend, SendGrid, Amazon SES ou SMTP corporativo.
- Frontend apenas dispara solicitação; o envio real deve ficar no backend.

## Observação importante

O envio real de e-mail não deve ser implementado somente no frontend, porque exporia chaves e credenciais. Para produção, precisa de backend/Edge Function.
