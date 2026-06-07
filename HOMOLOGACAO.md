# Homologação Manual — Molas Kanban

> Criado em: 2026-06-07
> Deploy em produção: https://true-to-life-draw.vercel.app
> Atualizar status de cada item após testar. Marcar ✅ quando OK, ❌ quando falhou (descrever o bug abaixo do item).

---

## Como usar este arquivo

1. Abrir o app em produção no dispositivo de teste
2. Executar cada caso na ordem listada
3. Marcar ✅ / ❌ ao lado do item
4. Se ❌, descrever o comportamento observado logo abaixo
5. Reportar os ❌ para implementação de fix

---

## Bloco A — Onboarding com conta nova (Q1)

> Nunca foi validado E2E com uma conta recém-criada. Testar com email que nunca acessou o app.

| # | Caso | Status |
|---|------|--------|
| A1 | Acessar `/signup` — formulário aparece com campos: nome, email, confirmar email, senha, confirmar senha | — |
| A2 | Tentar cadastrar com emails divergentes → erro de validação local (sem chamada ao Supabase) | — |
| A3 | Tentar cadastrar com senhas divergentes → erro de validação local | — |
| A4 | Cadastrar com dados válidos → redireciona para onboarding (não para o board) | — |
| A5 | Onboarding Step 1 aparece corretamente (nome da conta, seleção de cor) | — |
| A6 | Avançar para Step 2 — campos de configuração inicial aparecem | — |
| A7 | Concluir onboarding → redireciona para `/settings` ou board | — |
| A8 | Board carrega vazio (sem cards, sem trilhas pré-criadas) | — |
| A9 | Fechar e reabrir o app → não volta para o onboarding | — |

---

## Bloco B — Modal two-column (desktop)

> Testar em tela ≥ 1024px (desktop / janela larga).

| # | Caso | Status |
|---|------|--------|
| B1 | Abrir qualquer card → modal abre com layout two-column (coluna esq + sidebar dir) | — |
| B2 | Sidebar direita visível com: prioridade, prazo, trilhas, mover coluna, mover track, excluir | — |
| B3 | Clicar no título → input inline aparece, foco automático | — |
| B4 | Editar título e pressionar Enter → título salvo, campo some | — |
| B5 | Editar título e pressionar Escape → título original restaurado | — |
| B6 | Clicar na descrição (se existir) → textarea inline aparece | — |
| B7 | Clicar em "clique para adicionar" (descrição vazia) → textarea aparece | — |
| B8 | Salvar descrição → markdown renderizado aparece no lugar | — |
| B9 | Clicar no badge de prioridade na sidebar → cicla entre Alta / Média / Baixa | — |
| B10 | Alterar prazo pelo date picker na sidebar → data salva imediatamente | — |
| B11 | Limpar prazo (botão X ao lado da data) → data removida | — |
| B12 | Clicar em trilha na sidebar → toggle (ativa/desativa) sem recarregar | — |
| B13 | Clicar em coluna em "Mover para coluna" → card movido, modal fecha | — |
| B14 | Atalho `1` → aba Checklist ativa | — |
| B15 | Atalho `2` → aba Comentários ativa | — |
| B16 | Atalho `3` → aba Atividade ativa | — |
| B17 | Atalho `4` → aba Tempo ativa | — |
| B18 | Atalho `5` → aba Anexos ativa | — |
| B19 | Escape fecha o modal (quando nenhum campo está em edição) | — |
| B20 | Escape cancela edição inline (quando campo está aberto) sem fechar o modal | — |
| B21 | Card do tipo Goal → barra de progresso aparece acima da descrição | — |
| B22 | Card com parent → link "↳ NomeParent" aparece no eyebrow | — |

---

## Bloco C — Modal two-column (mobile)

> Testar em tela ≤ 768px (celular ou DevTools 390px).

| # | Caso | Status |
|---|------|--------|
| C1 | Abrir card → modal abre em coluna única (descrição + tabs empilhados) | — |
| C2 | Rolar para baixo → sidebar aparece abaixo do conteúdo principal | — |
| C3 | Sidebar com todos os campos visíveis (prioridade, prazo, trilhas, mover, excluir) | — |
| C4 | Inline editing no título funciona no mobile (toque para editar) | — |
| C5 | Modal não ultrapassa a altura da tela (scroll interno, sem overflow de página) | — |

---

## Bloco D — Confirmação de exclusão

| # | Caso | Status |
|---|------|--------|
| D1 | No modal: clicar em "Excluir" → AlertDialog abre com nome do card | — |
| D2 | No AlertDialog: clicar "Cancelar" → dialog fecha, card intacto | — |
| D3 | No AlertDialog: clicar "Excluir" → card removido do board, modal fecha | — |
| D4 | No hover do card (board): passar mouse → botão de lixeira aparece | — |
| D5 | Clicar na lixeira do hover → AlertDialog abre com nome do card | — |
| D6 | Confirmar exclusão no hover → card removido do board | — |
| D7 | Cancelar exclusão no hover → card intacto, dialog fecha | — |
| D8 | Atalho `d` no modal → **não deve mais funcionar** (foi removido com o modo edição global) | — |

---

## Bloco E — Ações rápidas no hover do card

| # | Caso | Status |
|---|------|--------|
| E1 | Passar mouse no card → botões de favoritar (⭐) e excluir (🗑) aparecem | — |
| E2 | Clicar favoritar → estrela ativa (amarela), estado persiste após reload | — |
| E3 | Clicar favoritar novamente → estrela desativa | — |
| E4 | Botões somem quando mouse sai do card | — |

---

## Bloco F — Regressões (features anteriores que não devem ter quebrado)

| # | Caso | Status |
|---|------|--------|
| F1 | Criar card novo (botão + na coluna) → card aparece no board | — |
| F2 | Drag & drop desktop → card move entre colunas | — |
| F3 | Abrir card → checklist funciona (adicionar, marcar, excluir item) | — |
| F4 | Abrir card → comentários funcionam (adicionar, editar, excluir) | — |
| F5 | Abrir card → time tracking funciona (logar tempo, ver total) | — |
| F6 | Abrir card → anexos funcionam (upload, download, excluir) | — |
| F7 | Duplicar card (botão no header do modal) → novo card aparece | — |
| F8 | Salvar como template (sidebar) → template disponível no create card | — |
| F9 | Cor de destaque (picker no header do modal) → cor aplicada no card do board | — |
| F10 | Favoritar pelo header do modal (⭐) → persiste no board e em For You | — |
| F11 | Filtros do board (prioridade, tipo, prazo) → funcionam normalmente | — |
| F12 | Busca global → encontra cards por título e descrição | — |
| F13 | Visão Calendário → cards com prazo aparecem nas datas corretas | — |
| F14 | Dashboard → KPIs e gráficos carregam | — |
| F15 | Habit Tracker → marcar hábito, ver streak | — |
| F16 | Troca de tema (Dark/Light/Baby Blue/Sépia) → persiste após reload | — |

---

## Resultado da homologação

| Bloco | Total | ✅ OK | ❌ Falhou |
|-------|-------|-------|----------|
| A — Onboarding nova conta | 9 | — | — |
| B — Modal desktop | 22 | — | — |
| C — Modal mobile | 5 | — | — |
| D — Confirmação exclusão | 8 | — | — |
| E — Hover actions | 4 | — | — |
| F — Regressões | 16 | — | — |
| **Total** | **64** | — | — |

---

## Bugs encontrados

> Preencher conforme testar.

<!-- Exemplo:
### B9 — Ciclar prioridade
Comportamento: clicou na prioridade, não mudou nada.
Dispositivo: Safari iOS 17.4 / iPhone 14
-->
