# Prompts Open Design → React/Tailwind

Cada prompt abaixo é completo — copie o bloco inteiro e cole no Open Design.
Não precisa substituir nada nem copiar de outro lugar.

---

## Prompt 1 — Redesenhar o CardItem

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

REGRAS DE SAÍDA:
- JSX válido (não HTML puro)
- Cores: use tokens bg-background, bg-card, bg-muted, text-foreground,
  text-muted-foreground, border-border, text-destructive — nunca hex
- Border-radius: rounded-sm (4px), rounded-lg (8px), rounded-2xl (12px)
- Oswald: style={{ fontFamily: "var(--font-display)" }}
- font-mono para números, badges, datas
- Bordas: sempre `border` — nunca style={{ borderWidth: "0.5px" }}
- style={{}} apenas para fontFamily, backgroundColor dinâmico (cor da track/prioridade), transform
- Preserve toda a lógica — só altere aparência
```

---

## Prompt 2 — Redesenhar o CardDetailModal

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

REGRAS DE SAÍDA:
- JSX válido (não HTML puro)
- Cores: use tokens bg-background, bg-card, bg-muted, text-foreground,
  text-muted-foreground, border-border, text-destructive — nunca hex
- Border-radius: rounded-sm (4px), rounded-lg (8px), rounded-2xl (12px)
- Oswald: style={{ fontFamily: "var(--font-display)" }}
- font-mono para números, badges, datas
- Bordas: sempre `border` — nunca style={{ borderWidth: "0.5px" }}
- style={{}} apenas para fontFamily, backgroundColor dinâmico (cor da track/prioridade), transform
- Preserve toda a lógica — só altere aparência
```

---

## Prompt 3 — Redesenhar a Sidebar e o Header

```
Leia o arquivo src/components/shell/AppShell.tsx do projeto true-to-life-draw.

Redesenha o bloco <aside> (sidebar) e o <header> mantendo toda a lógica:
navegação, tracks list, scroll to track, avatar dropdown, busca, tema toggle,
mobile menu, skeleton loader.

Foco do redesign:
- Sidebar w-[220px] com bg-sidebar, border-r sutil
- Brand "Molas" em Oswald uppercase com dot pulsante (animate-pulse)
- Nav items: rounded-sm, hover bg-white/5, ativo bg-white/10
- Seção Tracks com dot colorido + badge de count em font-mono
- Header h-[52px] com search hint ⌘K em font-mono
- Botão Create: Oswald uppercase, bg-primary, texto text-primary-foreground

REGRAS DE SAÍDA:
- JSX válido (não HTML puro)
- Cores: use tokens bg-background, bg-card, bg-sidebar, bg-muted, text-foreground,
  text-muted-foreground, border-border, bg-primary, text-primary-foreground — nunca hex
- Border-radius: rounded-sm (4px), rounded-lg (8px), rounded-2xl (12px)
- Oswald: style={{ fontFamily: "var(--font-display)" }}
- font-mono para badges e atalhos
- Bordas: sempre `border` — nunca style={{ borderWidth: "0.5px" }}
- style={{}} apenas para fontFamily, backgroundColor dinâmico (cor da track), transform
- Preserve toda a lógica — só altere aparência
```

---

## Prompt 4 — Redesenhar o Board (swimlanes e colunas)

```
Leia o arquivo src/components/kanban/Board.tsx do projeto true-to-life-draw.

Redesenha os componentes Swimlane e a área de colunas mantendo toda a lógica:
drag-drop, collapse, WIP limits, filtros, modais de gerenciar tracks/trilhas/colunas.

Foco do redesign:
- Track header: indicador vertical 3px com a cor da track + nome em Oswald uppercase
- Track meta: info em font-mono text-[11px] text-muted-foreground
- Column header: nome em font-mono uppercase letter-spacing 0.08em
- Column badge: rounded-sm bg-white/7 font-mono; text-orange-500 se WIP excedido
- Empty state de coluna: border-dashed rounded-lg com ícone + copy

REGRAS DE SAÍDA:
- JSX válido (não HTML puro)
- Cores: use tokens bg-background, bg-card, bg-muted, text-foreground,
  text-muted-foreground, border-border, text-destructive — nunca hex
- Border-radius: rounded-sm (4px), rounded-lg (8px), rounded-2xl (12px)
- Oswald: style={{ fontFamily: "var(--font-display)" }}
- font-mono para badges e contadores
- Bordas: sempre `border` — nunca style={{ borderWidth: "0.5px" }}
- style={{}} apenas para fontFamily, backgroundColor dinâmico (cor da track), transform
- Preserve toda a lógica — só altere aparência
```
