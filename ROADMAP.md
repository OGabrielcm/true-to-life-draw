# 🗺️ Roadmap — Molas Kanban

> Baseado em análise comparativa com JIRA, Trello e ferramentas Kanban profissionais.
> Atualizado em: Maio 2026 — Fase 4 completa ✅

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

| # | Feature | Consumo de token | Modelo recomendado | Status |
|---|---------|-----------------|-------------------|--------|
| ~~4.1~~ | Markdown na descrição dos cards | 🟢 Baixo | `claude-haiku-4-5-20251001` | ✅ |
| ~~4.2~~ | Atalhos de teclado (e = editar, d = deletar, n = novo card) | 🟢 Baixo | `claude-haiku-4-5-20251001` | ✅ |
| ~~4.3~~ | Card aging (opacidade em cards parados há muito tempo) | 🟢 Baixo | `claude-haiku-4-5-20251001` | ✅ |
| ~~4.4~~ | Cor de destaque / cover no card | 🟢 Baixo | `claude-haiku-4-5-20251001` | ✅ |
| 4.5 | Histórico de atividades no card | 🔴 Alto | `claude-opus-4-7` | ⏳ |
| 4.6 | Comentários no card | 🔴 Alto | `claude-opus-4-7` | ⏳ |
| 4.7 | Time tracking (log de horas por card) | 🔴 Alto | `claude-opus-4-7` | ⏳ |

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
