# 🗺️ Roadmap — Molas Kanban

> ⚠️ **Este arquivo deve ser atualizado a cada implementação concluída.**
> Ao finalizar qualquer bloco de implementação, marcar os itens como concluídos e adicionar a data.
> Itens novos identificados durante o desenvolvimento devem ser adicionados na seção correspondente.
> **Claude Code:** atualizar ROADMAP.md e README.md a cada entrega relevante, antes do commit. Não acumular.

---

> Baseado em análise comparativa com JIRA, Trello e ferramentas Kanban profissionais.
> Atualizado em: 2026-06-07 — Fases 1–5 completas ✅ · Blocos 1–7 + UX fixes concluídos · MVP em produção (Vercel)
>
> **2026-06-07 — UX: Modal two-column + confirmação de exclusão:**
> CardDetailModal redesenhado no layout two-column estilo Jira (max-w-4xl). Coluna esquerda
> (flexível): descrição com inline editing por clique, goal progress bar, tabs Checklist /
> Comentários / Atividade / Tempo / Anexos (atalhos 1–5). Sidebar direita (264px): prioridade
> clicável para ciclar, prazo com date picker inline, trilhas como toggle-pills, mover coluna/track,
> template, excluir. Mobile: sidebar empilha abaixo (flex-col < md). Inline editing por campo
> (sem modo edição global — atalho `e` removido). Exclusão no modal e no hover do card usam
> AlertDialog para confirmação — sem risco de perda acidental. Botões de ação rápida (favoritar
> e excluir) adicionados no hover do card diretamente no board.
>
> **2026-06-02 — Bloco 7 (habits no Dashboard e For You) concluído:** integra os
> dados do habit tracker em duas telas existentes, sem tocar no board nem na aba
> `/habits`. **Dashboard:** seção de hábitos com consistência do mês (% que respeita
> o `created_at`, inclui hoje), heatmap agregado de 30 dias (intensidade = nº de
> hábitos feitos no dia) e lista com streak atual + recorde. **For You:** bloco
> contextual com contagem do dia (X feitos · Y faltam), pendentes com toggle e
> alerta de streak em risco (streak ≥2 + pendente hoje). Lógica nova pura e testada
> (`getRecordStreak`, `getMonthlyConsistency`, `aggregateLogCountsByDate` —
> `probe-streak.ts`, RED→GREEN; o RED pegou um off-by-one de timezone no mock).
> Componentes compartilhados em `components/habits/`. Ambas as seções somem sem
> hábitos. **7.2 "sugestão por horário" CORTADA** — `habit_logs` só guarda `date`
> (sem hora); exigiria migration.
> **Achado (fora de escopo):** `/for-you` já tem overflow horizontal em 375px **no
> grid de cards existente** (não na seção nova de hábitos) — bug de responsividade
> pré-existente, registrado para um fix futuro.
>
> **2026-06-02 — Busca oculta trilhas vazias (2.3) + verificações:** durante a
> busca, trilhas sem nenhum card correspondente agora são ocultadas — só aparecem
> as que têm resultado (validado por probe, RED→GREEN; limpar a busca restaura
> todas). **2.4** (resetar cor do card para "Nenhuma") foi **investigado e já
> funciona** — a hipótese do prompt (dado legado/constraint no banco) estava
> errada: cor de card é localStorage, não tem coluna no banco, e o reset deleta a
> chave corretamente (probe GREEN). Nenhuma mudança feita no 2.4.
>
> **2026-06-02 — Habit Tracker (feature nova) concluído:** aba separada do board
> (`/habits`). Pesquisa de referências (Streaks/Loop/Way of Life) destilou o núcleo
> ao mínimo: marcar feito + streak, frequência flexível (diário / dias-da-semana —
> `Nx/semana` adiado, jsonb já comporta sem migration), heatmap mensal. Duas tabelas
> (`habits` + `habit_logs`, presença da row = feito) com RLS per-user. Lógica de
> streak pura e testada (`probe-streak.ts`, RED→GREEN); data-layer e UI validados
> por probes interativos. Sistema isolado — não toca no board. Reusou o grid do
> calendário via `date-utils.ts` (extração com regressão verde).
>
> **2026-06-01 — Bloco 6 (revisão do roadmap) concluído:** roadmap reconciliado
> com o estado real do código (cada feature marcada ✅ foi verificada por grep,
> não por confiança na lista de prompts — que já afirmou falsamente que anexos e
> "rich text Tiptap" existiam). Regra de manutenção adicionada no topo. Anexos
> (Bloco 4) e os 4 temas (Bloco 3.3) refletidos na seção "Já implementado".
>
> **2026-05-31 — Bloco 1 (refatoração estrutural) concluído:** migrations movidas
> para `supabase/migrations/`, rotas de auth agrupadas em pathless group `(auth)/`
> (URLs preservadas), distinção Track/Trilha documentada e `kanban-store` dividido
> em slices. A revisão completa do roadmap (itens implementados, datas) está
> planejada para o Bloco 6.
>
> **2026-06-01 — Bloco 3 (melhorias visuais) concluído:** 3.1 contadores reais
> nas abas do card (o número ao lado do nome é atalho de teclado, não contagem);
> 3.2 polish do checklist + fix do botão excluir invisível no mobile; 3.3 quatro
> temas (Dark padrão, Light, Baby Blue, Sépia/Gruvbox) com seletor dropdown e
> persistência por usuário no Supabase (`user_profile.theme`), cross-device.
>
> **2026-06-01 — Bloco 4 (anexos no card) concluído:** o prompt assumia que o
> código de upload já existia (só faltaria o bucket), mas **não havia nada de
> anexos no projeto** — feature construída do zero. Nova tabela `attachments`
> (metadados, RLS própria), bucket Storage `attachments` (público, 20MB) e
> políticas das duas camadas (tabela + `storage.objects`). Seção de anexos no
> card (upload múltiplo, listagem com preview de imagem, download, excluir).
> Delete remove o arquivo do Storage **e** a row (validado por probe ao vivo —
> download retorna 400 após excluir). Delete restrito ao dono via
> `storage.objects.owner_id` (owner-pode-excluir validado; não-dono bloqueado
> pela policy, não testado com 2ª conta).
> **Limitação consciente (não implementada agora):** excluir um *card* faz
> cascade nas rows de `attachments`, mas **orfana os objetos no Storage** — não
> há trigger/edge-function de limpeza do bucket. Fora do escopo do critério;
> registrado para decisão futura.
>
> **2026-06-01 — Bloco 5 (responsividade mobile do dashboard) concluído:** o
> dashboard já era responsivo (trabalho anterior); o mapeamento foi feito por
> RENDERIZAÇÃO real em 390px e 375px (probe visual `probe-dashboard-mobile.mjs`),
> não por leitura de classes. Resultado: KPIs, os três gráficos de barras e os
> filtros já se comportam bem; a única quebra real era a **tabela** — rola na
> horizontal (não cabe em 390px) mas **sem indicação visual** de que há mais
> colunas (inclusive as ações). Fix: degradê na borda direita (só mobile, `md:`
> esconde) sinalizando o scroll. Sem overflow de página, sem texto truncado.
> **Nota de breakpoint:** "768px (não alterar)" é guardrail, não diretiva — o
> divisor mobile do app é `md:` (768px, AppShell). Converter os `sm:` (640px) do
> dashboard para `md:` seria **no-op em 390/375** (ambos caem no base) e fora do
> escopo; mantido como está.
>
> **2026-06-01 — Bloco 2 (bugs) parcial:** 2.1 corrigido (board travava no
> skeleton ao restaurar sessão — gatilho de load reativo a `user?.id`); 2.3
> corrigido (busca agora casa também nome de etiqueta, além de título/descrição).
> **2.2** (drag&drop mobile no modo claro) — retomado ao fim do Bloco 6. O
> sintoma relatado não é "quebrado" e sim "mais travado / menos fluido que no
> dark ao passar o card entre colunas". Causa provável isolada: **só o modo
> claro tem `box-shadow` base nos `.kb-card`** (o dark usa borda, sem shadow) —
> e shadow é caro de repintar a cada frame ao rolar o board na horizontal. Fix
> tentado: classe `kb-dragging` no board zera shadow+transition dos cards
> enquanto há arraste ativo. **Hipótese a confirmar no dispositivo** (não é
> mensurável localmente — touch + subjetivo). Se não melhorar, reapontar a
> investigação com o novo dado, não insistir no mesmo palpite.

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
| **Opus 4.8** | `claude-opus-4-8` | Tarefas complexas, 6+ arquivos, nova tabela Supabase |

> ⚠️ **Regra:** Antes de iniciar qualquer feature, verificar se o modelo ativo coincide com o modelo recomendado abaixo. Se não coincidir, pausar e avisar o usuário.

---

## ✅ Já implementado

| Feature | Status |
|---------|--------|
| Board Kanban com swimlanes (tracks) | ✅ |
| Cards com título, descrição, prioridade, prazo | ✅ |
| Tipos de card: Task / Goal (relação pai-filho) | ✅ |
| Tags / Trilhas (filtros visuais) | ✅ |
| Drag & Drop (desktop ✅ · mobile modo claro pendente de validação — ver 2.2) | ✅ |
| Busca global | ✅ |
| Tracks dinâmicas (criar, editar, excluir swimlanes) | ✅ |
| Trilhas dinâmicas (criar, editar, excluir tags) | ✅ |
| Arquivamento automático (Done > 7 dias) | ✅ |
| For You (recentes + favoritos) | ✅ |
| Dashboards (tabela com todas as tarefas) | ✅ |
| 4 temas (Dark padrão, Light, Baby Blue, Sépia) com persistência por usuário no Supabase, cross-device | ✅ |
| Autenticação (login, signup, perfil) | ✅ |
| Responsividade mobile (board, modal, dashboard com scroll horizontal na tabela) | ✅ |
| Onboarding Beta obrigatório (`onboarding_completed`, sem trilhas/colunas padrão) | ✅ |
| Filtro de trilhas na sidebar (mostra todas quando nenhuma selecionada) | ✅ |
| Edição de cards (título, descrição, prazo, prioridade, tags) | ✅ |
| Colunas customizáveis (criar, renomear, excluir colunas do board) | ✅ |
| Reordenação de cards dentro da coluna (desktop ✅ · mobile modo claro — ver 2.2) | ✅ |
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
| Atalhos de teclado (1–5=trocar aba, n=novo, d=deletar no modal) | ✅ |
| Card aging (opacidade por inatividade) | ✅ |
| Cor de destaque / cover no card | ✅ |
| Modal two-column estilo Jira (descrição + tabs à esq., metadados à dir.) | ✅ |
| Inline editing por campo no modal (título e descrição — sem modo global) | ✅ |
| Ações rápidas no hover do card (favoritar, excluir com confirmação) | ✅ |
| Confirmação AlertDialog antes de excluir card (modal e hover) | ✅ |
| Histórico de atividades no card | ✅ |
| Comentários no card | ✅ |
| Time tracking (log de horas por card) | ✅ |
| Anexos no card (upload p/ Storage, preview, download, excluir — Bloco 4) | ✅ |
| Habit Tracker (aba `/habits`: marcar feito, streak, frequência, heatmap) | ✅ |
| Hábitos no Dashboard e For You (consistência, heatmap 30d, streak+recorde, pendentes, alerta de risco) | ✅ |
| README.md com setup, stack e schema Supabase | ✅ |
| Código formatado com Prettier (zero lint errors) | ✅ |
| Arquitetura em camadas (services, card-rules, dashboard-export) | ✅ |
| Testes E2E isolados com RUN_ID único por execução | ✅ |

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

## ~~🔧 Fase 5 — Qualidade Técnica~~ ✅ Completa

> Baseado em auditoria técnica do projeto. Todas as etapas concluídas e em produção (Vercel).
> Merge: `chore/git-commit-hook-e-scrollbar` → `main` em 18/05/2026.

| # | Etapa | Arquivo principal | Complexidade | Modelo | Status |
|---|-------|------------------|-------------|--------|--------|
| ~~5.1~~ | Formatar código com Prettier | `src/` inteiro | 🟢 Mínima | `claude-haiku-4-5-20251001` | ✅ |
| ~~5.2~~ | Criar README.md operacional | raiz do projeto | 🟢 Baixa | `claude-haiku-4-5-20251001` | ✅ |
| ~~5.3~~ | Extrair exportação do dashboard | `dashboards.tsx` → `dashboard-export.ts` | 🟡 Baixa-média | `claude-sonnet-4-6[1m]` | ✅ |
| ~~5.4~~ | Extrair regras puras de card | `card-rules.ts` (re-export semântico) | 🟡 Média | `claude-sonnet-4-6[1m]` | ✅ |
| ~~5.5~~ | Melhorar isolamento dos testes E2E | `helpers.ts` — `RUN_ID` único por execução | 🟡 Média | `claude-sonnet-4-6[1m]` | ✅ |
| ~~5.6~~ | Separar serviços do kanban-store | `activity-service.ts`, `comments-service.ts`, `timelog-service.ts` | 🔴 Alta | `claude-opus-4-7` | ✅ |
| ~~5.7~~ | Separar CardDetailModal | 5 sub-componentes em `card-modal-sections/` | 🔴 Alta | `claude-opus-4-7` | ✅ |

### Resultado

- `kanban-store.tsx`: 881 → 806 linhas
- `CardDetailModal.tsx`: 1195 → 643 linhas (5 sections extraídas)
- `dashboards.tsx`: funções de export movidas para módulo dedicado
- E2E: títulos de cards com `RUN_ID` único — sem colisão entre runs paralelos
- TypeScript: 0 erros · ESLint: 0 erros (11 warnings herdados de shadcn/ui)
- Deploy validado: `READY` em produção no Vercel

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

---

## 📬 Grupo E — Email e Comunicação
> Bloqueado pelo Supabase free plan. Requer Gmail SMTP ou domínio próprio + Resend.

| # | Feature | Por que importa | Pré-requisito | Consumo | Modelo |
|---|---------|----------------|--------------|---------|--------|
| E1 | **Templates HTML de email** (boas-vindas, recuperação, confirmação) com visual Molas | Profissionaliza o onboarding — hoje os emails saem com layout padrão do Supabase | Gmail SMTP ou domínio + Resend | 🟡 Médio | `claude-sonnet-4-6` |
| E2 | **Email de boas-vindas automático** no signup | Primeira impressão da ferramenta; reforça identidade visual | E1 (SMTP customizado) ativo | 🟢 Baixo | `claude-haiku-4-5-20251001` |

---

## 🧪 Grupo Q — Qualidade e Cobertura
> Garantia de que o que foi construído continua funcionando à medida que o projeto cresce.

| # | Feature | Por que importa | Consumo | Modelo |
|---|---------|----------------|---------|--------|
| Q1 | **Onboarding Beta — validação com conta nova** | O fluxo step 1 → step 2 → /settings nunca foi validado end-to-end com uma conta recém-criada; os E2E cobrem apenas contas existentes | 🟢 Baixo (testes manuais) | — |
| Q2 | **Testes E2E no CI** (Vercel Preview + GitHub Actions) | Os testes existem mas rodam apenas localmente; qualquer deploy pode quebrar sem alerta | 🟡 Médio | `claude-sonnet-4-6` |
| Q3 | **Cobertura E2E das Fases 1–3** (board básico, drag-drop, filtros, coluna) | Só as Fases 4 e 6 têm testes; as features principais do produto não têm garantia automatizada | 🔴 Alto | `claude-opus-4-7` |

---

## 🚀 Grupo P — Features de Produto
> Funcionalidades que diferenciam o Molas de um Kanban genérico e aumentam o valor diário.

| # | Feature | Referência | Consumo | Modelo |
|---|---------|-----------|---------|--------|
| P1 | **Notificações push / browser** para prazos vencendo | Trello, Linear | 🟡 Médio | `claude-sonnet-4-6` |
| P2 | **Recurring cards** — cards que se repetem automaticamente (semanal, mensal) | Notion, TickTick | 🔴 Alto | `claude-opus-4-7` |
| P3 | **Modo foco** — esconde tudo exceto a trilha/coluna selecionada | Linear | 🟢 Baixo | `claude-haiku-4-5-20251001` |
| P4 | **Quick-add via `Cmd+K`** — paleta de comandos para criar card sem abrir o board | Linear, Raycast | 🟡 Médio | `claude-sonnet-4-6` |
| P5 | **Swim lane por prazo** (hoje / esta semana / atrasado) como view alternativa do board | JIRA | 🔴 Alto | `claude-opus-4-7` |
| P6 | **Métricas de fluxo** — Lead time, Cycle time, Throughput por coluna | Kanban profissional | 🔴 Alto | `claude-opus-4-7` |
| P7 | **Board snapshot semanal** — foto automática do estado do board para histórico | Gestão pessoal | 🔴 Alto | `claude-opus-4-7` |

---

## 🔧 Grupo T — Qualidade Técnica (dívida futura)
> Melhorias de arquitetura que não adicionam features visíveis, mas aumentam confiabilidade e percepção de velocidade.

| # | Feature | Por que importa | Consumo | Modelo |
|---|---------|----------------|---------|--------|
| T1 | **Optimistic updates** em todas as mutações do board | Hoje toda ação espera o Supabase responder antes de atualizar a UI — perceptível em conexões lentas | 🔴 Alto | `claude-opus-4-7` |
| T2 | **Realtime Supabase** — múltiplas abas sincronizadas sem reload | Abrindo o app em duas abas, mudanças em uma não aparecem na outra | 🔴 Alto | `claude-opus-4-7` |
| T3 | **Error boundary global** + fallback UI de erro | O app quebra silenciosamente em alguns fluxos; o usuário vê tela branca sem mensagem | 🟡 Médio | `claude-sonnet-4-6` |
| T4 | **PWA / installable** — manifesto + service worker para uso offline | Ferramenta pessoal de uso diário — funcionar offline faz sentido | 🟡 Médio | `claude-sonnet-4-6` |
| T5 | **Limpar `routeTree.gen.ts`** do versionamento | Arquivo auto-gerado pelo TanStack Router não deve ser commitado manualmente | 🟢 Mínimo | — |

---

## Ordem sugerida para os grupos futuros

```
Q1 (validação manual — zero custo, feito pelo usuário)
  ↓
Q2 (E2E no CI — proteção antes de crescer)
  ↓
P3 (Modo foco — Haiku, rápido, alto impacto visual)
P4 (Quick-add Cmd+K — Sonnet, diferencial de UX imediato)
  ↓
T3 (Error boundary — Sonnet, confiabilidade)
T1 (Optimistic updates — Opus, sensação de velocidade)
  ↓
P2 (Recurring cards — Opus, elimina trabalho repetitivo)
P6 (Métricas de fluxo — Opus, fecha o loop analítico)
  ↓
E1 + E2 (Email templates — quando SMTP customizado estiver ativo)
T2 + T4 (Realtime + PWA — última camada de polimento)
```
