# 🗺️ Roadmap — Molas Kanban

> Baseado em análise comparativa com JIRA, Trello e ferramentas Kanban profissionais.
> Atualizado em: Maio 2026 — Fases 1–4 completas ✅ · Fase 5 (Qualidade Técnica) em andamento

---

## Infraestrutura de desenvolvimento

| Ferramenta | Status | Uso |
|-----------|--------|-----|
| **Supabase MCP** | ✅ Conectado | Queries, migrations e logs direto no Claude Code |
| **Vercel MCP** | ✅ Conectado | Deployments, logs de runtime e projetos |
| **Playwright E2E** | ✅ Configurado | Testes de interface em `tests/e2e/` — porta 5174 |

---

## Modelos disponíveis

| Modelo | ID | Uso indicado |
|--------|----|-------------|
| **Haiku 4.5** | `claude-haiku-4-5-20251001` | Tarefas simples, 1–2 arquivos, sem migration |
| **Sonnet 4.6** | `claude-sonnet-4-6[1m]` | Tarefas médias, 3–5 arquivos, novo modal/componente |
| **Opus 4.7** | `claude-opus-4-7` | Tarefas complexas, 6+ arquivos, nova tabela Supabase |

> ⚠️ **Regra:** Antes de iniciar qualquer feature, verificar se o modelo ativo coincide com o modelo recomendado abaixo. Se não coincidir, pausar e avisar o usuário.

---

## ✅ Já implementado

| Feature | Status |
|---------|--------|
| Board Kanban com swimlanes (tracks) | ✅ |
| Cards com título, descrição, prioridade, prazo | ✅ |
| Tipos de card: Task / Goal (relação pai-filho) | ✅ |
| Tags / Trilhas (filtros visuais) | ✅ |
| Drag & Drop (desktop + mobile) | ✅ |
| Busca global | ✅ |
| Tracks dinâmicas (criar, editar, excluir swimlanes) | ✅ |
| Trilhas dinâmicas (criar, editar, excluir tags) | ✅ |
| Arquivamento automático (Done > 7 dias) | ✅ |
| For You (recentes + favoritos) | ✅ |
| Dashboards (tabela com todas as tarefas) | ✅ |
| Tema claro / escuro | ✅ |
| Autenticação (login, signup, perfil) | ✅ |
| Responsividade mobile | ✅ |
| Edição de cards (título, descrição, prazo, prioridade, tags) | ✅ |
| Colunas customizáveis (criar, renomear, excluir colunas do board) | ✅ |
| Reordenação de cards dentro da coluna (desktop + mobile) | ✅ |
| Notificações de prazo (badge no header, indicador visual nos cards) | ✅ |
| Progresso automático em Goals (% baseado em Tasks filhas) | ✅ |
| Duplicar card | ✅ |
| WIP Limits por coluna (alerta visual ao ultrapassar) | ✅ |
| Checklists dentro do card (subtarefas com progresso) | ✅ |
| Dependências entre cards (bloqueado por) | ✅ |
| Visão Calendário (mês / semana / lista) | ✅ |
| Estatísticas do board (KPIs + barras por coluna/prioridade/track) | ✅ |
| Export CSV / PDF | ✅ |
| Filtros avançados no board | ✅ |
| Templates de cards | ✅ |
| Markdown na descrição dos cards | ✅ |
| Atalhos de teclado (e=editar, d=deletar, n=novo) | ✅ |
| Card aging (opacidade por inatividade) | ✅ |
| Cor de destaque / cover no card | ✅ |
| Histórico de atividades no card | ✅ |
| Comentários no card | ✅ |
| Time tracking (log de horas por card) | ✅ |

---

## 🚨 Fase 1 — Crítico (Impacto imediato no uso diário)

> Lacunas que afetam o fluxo básico de trabalho.

### ~~1.1 Edição de cards~~ ✅ Implementado

### ~~1.2 Colunas customizáveis~~ ✅ Implementado

### ~~1.3 Reordenação dentro da coluna~~ ✅ Implementado

### ~~1.4 Notificações de prazo~~ ✅ Implementado

---

## ⚠️ Fase 2 — Alto impacto (Produtividade e organização)

> Features que diferenciam um Kanban básico de uma ferramenta profissional.

### ~~2.1 Progresso automático nos Goals~~ ✅ Implementado
- **O que é:** % de conclusão calculada a partir das Tasks filhas (tasks done / total tasks)
- **Referência:** JIRA (Epic progress), Linear
- **Consumo de token:** 🟢 Baixo (lógica client-side, sem schema change)
- **Modelo recomendado:** `claude-haiku-4-5-20251001`

### ~~2.2 Duplicar card~~ ✅ Implementado
- **O que é:** Botão para copiar um card existente como ponto de partida
- **Referência:** Trello, Notion
- **Consumo de token:** 🟢 Baixo (1–2 arquivos)
- **Modelo recomendado:** `claude-haiku-4-5-20251001`

### ~~2.3 WIP Limits (limite de cards por coluna)~~ ✅ Implementado
- **O que é:** Definir máximo de cards por coluna; alerta visual ao ultrapassar
- **Por que importa:** Pilar do Kanban clássico — força o fluxo e evita gargalos
- **Referência:** Kanban clássico, Jira Software
- **Consumo de token:** 🟢 Baixo (config local + indicador visual)
- **Modelo recomendado:** `claude-haiku-4-5-20251001`

### ~~2.4 Checklists dentro do card~~ ✅ Implementado
- **O que é:** Lista de itens com checkbox dentro de um card (subtarefas leves)
- **Referência:** Trello (checklist), Notion
- **Consumo de token:** 🔴 Alto (novo campo JSONB no Supabase + UI)
- **Modelo recomendado:** `claude-opus-4-7`

### ~~2.5 Dependências entre cards~~ ✅ Implementado
- **O que é:** Marcar um card como "bloqueado por" outro card
- **Referência:** JIRA (issue links), Linear
- **Consumo de token:** 🔴 Alto (campo array no Supabase + UI)
- **Modelo recomendado:** `claude-opus-4-7`

---

## 📊 Fase 3 — Médio impacto (Visibilidade e análise)

> Features de visão macro e gestão estratégica.

### ~~3.1 Visão Calendário~~ ✅ Implementado
- **O que é:** Cards com prazo exibidos em um calendário mensal/semanal/lista
- **Referência:** Trello (Calendar Power-Up), Notion Calendar
- **Consumo de token:** 🔴 Alto (nova rota custom, 3 views — sem lib externa)
- **Modelo recomendado:** `claude-opus-4-7`

### ~~3.2 Estatísticas do board~~ ✅ Implementado
- **O que é:** Gráficos de cards por status, taxa de conclusão, cards vencidos
- **Referência:** JIRA (dashboards), Trello (Butler)
- **Consumo de token:** 🟡 Médio (nova seção no Dashboards, cálculos client-side)
- **Modelo recomendado:** `claude-sonnet-4-6[1m]`

### ~~3.3 Export CSV / PDF~~ ✅ Implementado
- **O que é:** Exportar a tabela do Dashboards em CSV ou PDF
- **Referência:** JIRA, Asana
- **Consumo de token:** 🟢 Baixo (1 arquivo, biblioteca de export)
- **Modelo recomendado:** `claude-haiku-4-5-20251001`

### ~~3.4 Filtros avançados no board~~ ✅ Implementado
- **O que é:** Filtrar por prazo (vencido, esta semana), prioridade, tipo de card
- **Referência:** JIRA (JQL), Trello (filtros)
- **Consumo de token:** 🟢 Baixo (lógica client-side, sem schema change)
- **Modelo recomendado:** `claude-haiku-4-5-20251001`

### ~~3.5 Templates de cards~~ ✅ Implementado
- **O que é:** Salvar um card como template e reutilizá-lo para tarefas recorrentes
- **Referência:** Trello, Notion
- **Consumo de token:** 🟡 Médio (nova tabela + modal)
- **Modelo recomendado:** `claude-sonnet-4-6[1m]`

---

## 🔵 Fase 4 — Qualidade de vida (Refinamentos) ✅ Completa

> Pequenos detalhes que elevam a experiência.

| # | Feature | Consumo de token | Modelo recomendado | Impl. | Teste E2E |
|---|---------|-----------------|-------------------|-------|-----------|
| ~~4.1~~ | Markdown na descrição dos cards | 🟢 Baixo | `claude-haiku-4-5-20251001` | ✅ | — |
| ~~4.2~~ | Atalhos de teclado (e = editar, d = deletar, n = novo card) | 🟢 Baixo | `claude-haiku-4-5-20251001` | ✅ | — |
| ~~4.3~~ | Card aging (opacidade em cards parados há muito tempo) | 🟢 Baixo | `claude-haiku-4-5-20251001` | ✅ | — |
| ~~4.4~~ | Cor de destaque / cover no card | 🟢 Baixo | `claude-haiku-4-5-20251001` | ✅ | — |
| ~~4.5~~ | Histórico de atividades no card | 🔴 Alto | `claude-opus-4-7` | ✅ | ✅ `fase4-activities.spec.ts` |
| ~~4.6~~ | Comentários no card | 🔴 Alto | `claude-opus-4-7` | ✅ | ✅ `fase4-comments.spec.ts` |
| ~~4.7~~ | Time tracking (log de horas por card) | 🔴 Alto | `claude-opus-4-7` | ✅ | ✅ `fase4-timetracking.spec.ts` |

> ⚠️ **Migration:** `supabase_activities_comments_time_migration.sql` — já aplicada no Supabase (projeto `smdelyasoqtgcjdbldpf`).

### Cobertura dos testes E2E (Fase 4)

**`4.5 — Histórico de atividades`** · `fase4-activities.spec.ts`
- Registra atividade `criado` ao abrir card pela primeira vez
- Registra atividade ao mover card de coluna
- Registra atividade ao favoritar card
- Setup / teardown automatizados

**`4.6 — Comentários no card`** · `fase4-comments.spec.ts`
- Adiciona comentário via Ctrl+Enter
- Persiste após fechar e reabrir o modal
- Edita comentário existente inline
- Deleta comentário e confirma remoção

**`4.7 — Time tracking`** · `fase4-timetracking.spec.ts`
- Registra 1h 30m com nota e exibe na lista
- Total acumula corretamente com segundo registro (45m → 2h 15m)
- Deleta entrada e total volta ao valor anterior (1h 30m)
- Persiste após reload da página (confirmação no Supabase)

> Para rodar: `npm run dev` em segundo plano → `npx playwright test` (porta 5174)

---

---

## 🔧 Fase 5 — Qualidade Técnica (Auditoria + Dívida Técnica)

> Baseado em auditoria técnica do projeto (`RELATORIO_AUDITORIA_MENTORIA.md`).
> Objetivo: fechar dívida técnica acumulada antes de iniciar novas features.

| # | Etapa | Arquivo principal | Complexidade | Modelo | Status |
|---|-------|------------------|-------------|--------|--------|
| 5.1 | Formatar código com Prettier | `src/` inteiro | 🟢 Mínima | `claude-haiku-4-5-20251001` | ⏳ Pendente |
| 5.2 | Criar README.md operacional | raiz do projeto | 🟢 Baixa | `claude-haiku-4-5-20251001` | ⏳ Pendente |
| 5.3 | Extrair exportação do dashboard | `dashboards.tsx` | 🟡 Baixa-média | `claude-sonnet-4-6[1m]` | ⏳ Pendente |
| 5.4 | Extrair regras puras de card | `kanban-store.tsx` | 🟡 Média | `claude-sonnet-4-6[1m]` | ⏳ Pendente |
| 5.5 | Melhorar isolamento dos testes E2E | `global-setup.ts` | 🟡 Média | `claude-sonnet-4-6[1m]` | ⏳ Pendente |
| 5.6 | Separar serviços do kanban-store | `kanban-store.tsx` | 🔴 Alta | `claude-opus-4-7` | ⏳ Pendente |
| 5.7 | Separar CardDetailModal | `CardDetailModal.tsx` | 🔴 Alta | `claude-opus-4-7` | ⏳ Pendente |

### Detalhamento das etapas

**5.1 — Prettier** · `Haiku`
- Resolve 110 erros de lint em 1 comando: `npx prettier --write src`
- Arquivos mais afetados: `kanban-store.tsx`, `dashboards.tsx`

**5.2 — README.md** · `Haiku`
- Stack do projeto, setup local, variáveis de ambiente
- Scripts de execução e validação, tabelas principais do Supabase
- Declarar qual provedor é o oficial (Vercel vs Cloudflare — ambos têm config no repo)

**5.3 — Extrair exportação do dashboard** · `Sonnet`
- Mover `exportToCSV` e `exportToPDF` de `src/routes/dashboards.tsx` para `src/lib/dashboard-export.ts`
- Sem reescrever lógica, apenas separar responsabilidade

**5.4 — Extrair regras puras de card** · `Sonnet`
- Criar `src/lib/domain/card-rules.ts` com helpers como `isGoalCard` e regras de hierarquia
- Remover regras de domínio do store, que deve coordenar estado — não definir regras

**5.5 — Isolamento dos testes E2E** · `Sonnet`
- Substituir cleanup por prefixo genérico `[E2E-%` por IDs únicos por execução
- Garantir que cada teste rode de forma independente, sem depender de estado de outro

**5.6 — Separar serviços do kanban-store** · `Opus`
- `kanban-store.tsx` tem 29KB e mistura 6+ responsabilidades
- Extrair para: `activity-service.ts`, `comments-service.ts`, `timelog-service.ts`
- Fazer em etapas pequenas — um serviço por vez

**5.7 — Separar CardDetailModal** · `Opus`
- `CardDetailModal.tsx` tem 990 linhas misturando UI, estado e comportamento
- Extrair hook `use-card-details.ts` e sub-componentes por aba (Checklist, Comentários, Time)
- Maior risco de regressão visual — fazer com testes rodando

### Ordem recomendada

```
5.1 (Prettier) → 5.2 (README) → 5.3 (Export) → 5.4 (Card Rules) → 5.5 (E2E) → 5.6 (Store) → 5.7 (Modal)
```

> ⚠️ **Regra:** Etapas 5.1 e 5.2 podem ser feitas a qualquer momento.
> Etapas 5.6 e 5.7 só devem ser iniciadas quando uma nova feature for cair nesses arquivos — o custo de refatorar antes compensa nesse momento.

---

## Legenda

| Símbolo | Significado |
|---------|------------|
| ✅ | Implementado |
| 🟢 Baixo | 1–2 arquivos, sem migration, lógica simples → Haiku |
| 🟡 Médio | 3–5 arquivos, possível migration Supabase, novo modal → Sonnet |
| 🔴 Alto | 6+ arquivos, nova tabela Supabase, estado complexo → Opus |

---

## Ordem sugerida de implementação

```
Fase 1 → Fase 2 (2.1 e 2.2 primeiro, por serem baratos) → Fase 3 → Fase 4
```

Dentro da Fase 1, a ordem recomendada é:

```
1.1 Edição de cards       → Sonnet 4.6  (mais urgente + custo médio)
1.4 Notificações de prazo → Sonnet 4.6  (alto valor + baixo custo)
1.2 Colunas customizáveis → Sonnet 4.6  (alto impacto + médio custo)
1.3 Reordenação na coluna → Opus 4.7    (necessário antes das fases seguintes)
```
