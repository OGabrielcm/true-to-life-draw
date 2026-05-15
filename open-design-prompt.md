# Prompt Open Design → React/Tailwind

Cole este prompt no Open Design quando quiser uma nova iteração de design
que seja diretamente compatível com o projeto React.

> **Como usar este arquivo:**
> 1. Escolha um exemplo na seção "Exemplos de uso" abaixo
> 2. Copie o bloco "Prompt principal" + o exemplo escolhido
> 3. Cole no chat do Open Design (projeto true-to-life-draw)
> 4. Substitua [NOME DO COMPONENTE] pelo componente alvo

---

## Regras de saída (incluídas em todos os prompts abaixo)

```
REGRAS DE SAÍDA — gere JSX compatível com o projeto:

Cores — use sempre os tokens semânticos (não hex):
  bg-background           → fundo da página (#000)
  bg-card                 → fundo dos cards (#111)
  bg-sidebar              → fundo da sidebar (#111)
  bg-muted                → hover / inputs (#1a1a1a)
  text-foreground         → texto principal
  text-muted-foreground   → texto secundário (45%)
  border-border           → borda padrão (8% white)
  bg-primary / text-primary-foreground → botão primário
  text-destructive        → vermelho (excluir)

Border-radius — use classes Tailwind:
  rounded-sm  → 4px  (chips, badges)
  rounded-lg  → 8px  (cards, inputs)
  rounded-xl  → 10px (painéis)
  rounded-2xl → 12px (modais)

Tipografia:
  Oswald: style={{ fontFamily: "var(--font-display)" }}
  Mono: classe font-mono
  Tamanhos: text-[13px] body, text-sm labels, text-xs meta, text-[10px] badges

Layout fixo:
  Sidebar: w-[220px] | Header: h-[52px] | Colunas: w-[280px] mínimo

Bordas:
  Sempre `border` (1px) — nunca style={{ borderWidth: "0.5px" }}
  Hover reforçado: hover:border-white/14

Formato:
  - JSX válido (não HTML puro)
  - style={{}} apenas para: fontFamily, backgroundColor dinâmico, transform
  - Nenhuma classe Tailwind inexistente
  - Preserve toda a lógica existente — só altere aparência
  - Um componente por bloco de código
```

---

## Prompts prontos — copie e cole direto no Open Design

---

### 1 — Redesenhar o CardItem

```
Leia o arquivo src/components/kanban/CardItem.tsx do projeto true-to-life-draw.

Redesenha o componente CardItem mantendo toda a lógica de drag-drop, touch events,
onClick, aging e cardColor. Altere apenas a aparência visual.

Foco do redesign:
- Cover bar de 3px no topo com a cor do card
- Título em Oswald, font-medium, line-clamp-2
- Chips de prioridade e tags com border colorida (rounded-sm)
- Footer separado por border-top com deadline em font-mono
- Hover: translateY(-1px) + box-shadow

REGRAS DE SAÍDA — gere JSX compatível com o projeto:
[cole o bloco de regras acima]
```

---

### 2 — Redesenhar o CardDetailModal

```
Leia o arquivo src/components/kanban/CardDetailModal.tsx do projeto true-to-life-draw.

Redesenha o CardDetailModal mantendo toda a lógica: tabs, checklist, comentários,
time tracking, atividades, dependências, salvar template, excluir.

Foco do redesign:
- Modal max-w-2xl com animação de entrada (translateY 10px → 0)
- Backdrop com blur(4px) e bg-black/60
- Header compacto: eyebrow com metadados + título em Oswald
- 5 tabs (Detalhes·1, Checklist·2, Comentários·3, Atividade·4, Tempo·5)
- Tabs com shortcut numérico visível e border-bottom ativo
- Corpo com scroll independente

REGRAS DE SAÍDA — gere JSX compatível com o projeto:
[cole o bloco de regras acima]
```

---

### 3 — Redesenhar a Sidebar e o Header

```
Leia o arquivo src/components/shell/AppShell.tsx do projeto true-to-life-draw.

Redesenha o bloco <aside> (sidebar) e o <header> mantendo toda a lógica:
navegação, tracks list, scroll to track, avatar dropdown, busca, tema toggle,
mobile menu, skeleton loader.

Foco do redesign:
- Sidebar w-[220px] com bg-sidebar, border-r sutil
- Brand "Molas" em Oswald uppercase com dot pulsante (animate-pulse)
- Nav items: padding 7px 10px, rounded-sm, hover bg-white/5
- Seção Tracks com dot colorido + badge de count em font-mono
- Header h-[52px] com search hint ⌘K em font-mono
- Botão Create em Oswald uppercase, bg-primary

REGRAS DE SAÍDA — gere JSX compatível com o projeto:
[cole o bloco de regras acima]
```

---

### 4 — Redesenhar o Board (swimlanes e colunas)

```
Leia o arquivo src/components/kanban/Board.tsx do projeto true-to-life-draw.

Redesenha os componentes Swimlane e a área de colunas mantendo toda a lógica:
drag-drop, collapse, WIP limits, filtros, modais de gerenciar tracks/trilhas/colunas.

Foco do redesign:
- Track header: indicador vertical 3px com a cor da track + nome em Oswald uppercase 18px
- Track meta: sprint info em font-mono text-[11px] text-muted-foreground
- Column header: nome em font-mono uppercase letter-spacing 0.08em
- Column badge: rounded-sm bg-white/7 font-mono; laranja se WIP excedido
- Empty state de coluna: border-dashed rounded-lg com ícone + copy

REGRAS DE SAÍDA — gere JSX compatível com o projeto:
[cole o bloco de regras acima]
```

---

## Por que esse prompt funciona melhor

O Open Design **sem** esse prompt:
- Gera CSS inline com valores hex hardcoded
- Usa border-radius em px que não batem com os tokens do Tailwind
- Produz HTML estático que precisa ser reescrito para React
- Não conhece o estado, props e lógica dos componentes reais

O Open Design **com** esse prompt:
- Lê os componentes reais antes de gerar
- Usa os mesmos tokens que o Tailwind resolve (bg-card = #111 no dark)
- Preserva toda a lógica de interação
- Saída é JSX que pode ser colado diretamente nos arquivos
