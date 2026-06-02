# Relatório de Estado — Molas Kanban

> ⚠️ **DOCUMENTO HISTÓRICO — CONGELADO EM 21/05/2026. NÃO É O ESTADO ATUAL.**
> A fonte de verdade do estado do projeto é o [`ROADMAP.md`](./ROADMAP.md).
> Este relatório reflete apenas o snapshot de maio/2026 e **não inclui** os
> Blocos 1–7 nem o Habit Tracker (entregues em junho/2026). Há também
> imprecisões já corrigidas no código (ex.: cita "Zustand", mas o app usa
> stores via React Context). Mantido apenas como registro histórico.

**Data:** 21 de maio de 2026  
**Ambiente:** Produção (`true-to-life-draw.vercel.app`) · Supabase `smdelyasoqtgcjdbldpf`

---

## O que é o Molas

Kanban pessoal com swimlanes (trilhas), cards completos, goals, checklists, dependências, calendário e time tracking. Feito para uso solo, diário, no desktop. Autenticado via Supabase Auth, persistido em Supabase Postgres, hospedado no Vercel.

Stack: React 19 · TypeScript · TanStack Router · Zustand · Tailwind CSS v4 · Supabase · Vite · Playwright (E2E)

---

## Estado atual (maio 2026)

### Fases concluídas

| Fase | Escopo | Status |
|------|--------|--------|
| 1 — Crítico | Edição de cards, colunas customizáveis, reordenação, notificações de prazo | ✅ |
| 2 — Alto impacto | Goals com progresso automático, duplicar card, WIP limits, checklists, dependências | ✅ |
| 3 — Visibilidade | Calendário (mês/semana/lista), estatísticas, export CSV/PDF, filtros avançados, templates | ✅ |
| 4 — Qualidade de vida | Markdown, atalhos de teclado, card aging, cover color, histórico, comentários, time tracking | ✅ |
| 5 — Qualidade técnica | Prettier, README, extração de serviços, separação do CardDetailModal, isolamento E2E | ✅ |
| 6 — Pós-MVP | Onboarding Beta, /settings, filtro de trilha na sidebar, recuperação de senha | ✅ |

### O que está em produção hoje

- Board Kanban completo com drag-and-drop (desktop + mobile)
- Swimlanes por trilha com filtro na sidebar
- Cards com: título, descrição, prioridade, prazo, tags, cover, checklist, dependências, comentários, histórico de atividades, time tracking, markdown
- Goals com progresso automático (% de Tasks filhas concluídas)
- WIP Limits por coluna com alerta visual
- Templates de cards reutilizáveis
- Visão Calendário (mês / semana / lista)
- Dashboard com tabela global e estatísticas (KPIs, gráficos por coluna/prioridade/trilha)
- Export CSV e PDF
- Filtros avançados no board
- Atalhos de teclado (e=editar, d=deletar, n=novo)
- Card aging (opacidade por inatividade)
- Busca global
- Tema claro e escuro com design system OKLCH
- Autenticação completa: login, signup, recuperação de senha
- Onboarding Beta para novas contas (step 1: trilha → step 2: colunas → /settings)
- Página /settings com gerenciamento de trilhas e colunas padrão
- Arquivamento automático de cards Done há mais de 7 dias

---

## Design system

- **Tema escuro:** preto puro (`#000`) como base, branco `#fafafa` no texto — estética luxury
- **Tema claro:** revisado em maio/2026; hierarquia real entre board (`0.97`), sidebar (`0.93`) e cards (`0.995`) via OKLCH
- **Tipografia:** Oswald (display) + JetBrains Mono (mono)
- **Classes theme-aware:** `nav-item-active`, `nav-item-hover`, `avatar-btn`, `header-icon-hover`, `kbd-badge` — adaptam-se automaticamente ao modo claro/escuro sem classes condicionais no JSX

---

## Infraestrutura de testes

### Cobertura E2E atual (Playwright)

| Arquivo | Fase | O que cobre |
|---------|------|-------------|
| `fase4-activities.spec.ts` | 4.5 | Criação, movimentação, favoritar — registros no histórico |
| `fase4-comments.spec.ts` | 4.6 | Adicionar, editar, deletar comentários; persistência |
| `fase4-timetracking.spec.ts` | 4.7 | Registro de horas, acumulação, deleção, persistência |
| `fase4-quality.spec.ts` | 4 | Testes de qualidade geral da fase 4 |
| `fase6-sidebar-track-filter.spec.ts` | 6.1 | Botão Todos, filtro por trilha, toggle, reset |
| `fase6-settings.spec.ts` | 6.2 | Acesso via sidebar e avatar, seções Trilhas e Colunas, modais Gerenciar |
| `fase6-reset-password.spec.ts` | 6.3 | Formulário de recuperação, validações, pré-preenchimento, /reset-password |
| `fase6-onboarding.spec.ts` | 6.4 | Conta existente não vê onboarding, sidebar com TRILHAS e Todos |

**Lacuna crítica:** Fases 1, 2 e 3 (as features principais do produto) não têm cobertura E2E. Uma regressão no board, drag-drop ou filtros passaria despercebida.

---

## Email e autenticação

| Fluxo | Status | Observação |
|-------|--------|-----------|
| Login | ✅ | Supabase Auth |
| Signup | ✅ | Com confirmação de email ativada |
| Confirmação de email | ✅ | SMTP nativo Supabase (2 emails/hora no free plan) |
| Recuperação de senha | ✅ | Testado manualmente — email chega, link funciona |
| Templates HTML customizados | ⚠️ Bloqueado | Requer Gmail SMTP ou domínio próprio + Resend |

---

## Decisões técnicas registradas

| Decisão | Motivo |
|---------|--------|
| Supabase SMTP nativo (não Gmail, não Resend) | Usuário não quis comprar domínio agora; SMTP nativo resolve login/recuperação sem custo |
| Tailwind v4 com CSS custom properties OKLCH | Design system flexível que funciona em light e dark sem duplicação de classes |
| Zustand para estado do board | Estado síncrono do board não precisa de React Query/SWR; Zustand é mais simples |
| TanStack Router (file-based) | Type-safe routing com geração automática de `routeTree.gen.ts` |
| Playwright com `RUN_ID` único | Evita colisão entre testes paralelos — cada execução cria e limpa seus próprios dados |
| Conventional Commits pt-BR via skill `git-commit` | Padronização obrigatória; nunca rodar `git commit` diretamente |

---

## Backlog futuro — resumo executivo

### Alta prioridade (faça primeiro)

**Q1 — Validação manual do Onboarding Beta com conta nova**  
Zero código. Criar uma conta nova em produção e percorrer o fluxo step 1 → step 2 → /settings. Nunca foi feito. Pode ter bugs não capturados pelos E2E.

**Q2 — Testes E2E no CI (Vercel Preview + GitHub Actions)**  
Hoje os testes só rodam localmente. Qualquer merge pode quebrar uma feature sem ninguém perceber. Isso precisa ser automatizado antes de o projeto crescer.

**P3 — Modo foco**  
Esconde tudo exceto a trilha/coluna ativa. Feature leve (Haiku, 1 dia), alto impacto na experiência de uso concentrado.

**P4 — Quick-add via Cmd+K**  
Paleta de comandos para criar card sem ter que navegar até o board. Diferencial de UX; similar ao Linear. Sonnet, ~2 dias.

---

### Médio prazo

**T3 — Error boundary global**  
Hoje o app quebra com tela branca em fluxos de erro. Um error boundary com fallback visual é baixo esforço e alto ganho de confiabilidade.

**T1 — Optimistic updates**  
Toda mutação espera o Supabase responder antes de atualizar a UI. Em conexões normais é imperceptível; em conexões lentas, o board parece travado.

**P2 — Recurring cards**  
Cards que se repetem (semanal, mensal). Elimina trabalho manual de recriar tarefas recorrentes. Feature Opus, ~3 dias.

**P6 — Métricas de fluxo (Lead time, Cycle time)**  
Fecha o loop analítico do produto — hoje as estatísticas mostram snapshot, não fluxo ao longo do tempo.

---

### Longo prazo (quando fizer sentido)

**E1 + E2 — Templates de email com visual Molas**  
Depende de SMTP customizado (Gmail ou Resend). Quando ativado: templates HTML de boas-vindas, confirmação e recuperação com a identidade visual do produto.

**T2 — Realtime Supabase**  
Múltiplas abas não sincronizam. Só vira problema se o uso escalar para múltiplas sessões simultâneas.

**T4 — PWA**  
Manifesto + service worker para uso offline. Faz sentido como ferramenta pessoal de uso diário.

**P5 — Swim lane por prazo**  
View alternativa do board agrupando por hoje/esta semana/atrasado. JIRA-like, alto esforço.

**P7 — Board snapshot semanal**  
Foto automática do estado do board para histórico. Gestão pessoal avançada.

---

## Ordem de ataque recomendada

```
1. Q1  → Validação manual do Onboarding (agora, zero código)
2. Q2  → E2E no CI (antes de crescer mais)
3. P3  → Modo foco (rápido, impacto visual imediato)
4. P4  → Quick-add Cmd+K (diferencial de UX)
5. T3  → Error boundary (confiabilidade)
6. T1  → Optimistic updates (velocidade percebida)
7. P2  → Recurring cards (produtividade)
8. P6  → Métricas de fluxo (loop analítico)
9. E1+E2 → Templates de email (quando SMTP pronto)
10. T2+T4 → Realtime + PWA (polimento final)
```

---

## Referências

- Repositório: `true-to-life-draw` (branch `main`)
- Produção: `https://true-to-life-draw.vercel.app`
- Supabase: projeto `smdelyasoqtgcjdbldpf`
- ROADMAP completo: `ROADMAP.md` na raiz do projeto
- Testes E2E: `tests/e2e/` — rodar com `npm run dev` na porta 5174 + `npx playwright test`
