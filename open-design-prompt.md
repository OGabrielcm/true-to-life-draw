Leia os seguintes arquivos do projeto true-to-life-draw antes de responder:
- src/components/kanban/CardItem.tsx
- src/components/kanban/CardDetailModal.tsx
- src/components/shell/AppShell.tsx
- src/components/kanban/Board.tsx
- src/styles.css

Redesenha visualmente os 4 componentes abaixo mantendo toda a lógica existente
(drag-drop, eventos, estado, props). Altere apenas a aparência visual.

---

REGRAS DE SAÍDA — obrigatórias em todos os componentes:

Cores: use tokens semânticos, nunca hex
  bg-background, bg-card, bg-sidebar, bg-muted
  text-foreground, text-muted-foreground
  border-border, bg-primary, text-primary-foreground, text-destructive

Border-radius:
  rounded-sm → 4px (chips, badges)
  rounded-lg → 8px (cards, inputs)
  rounded-xl → 10px (painéis)
  rounded-2xl → 12px (modais)

Tipografia:
  Oswald: style={{ fontFamily: "var(--font-display)" }}
  Mono: classe font-mono
  Tamanhos: text-[13px] body, text-sm labels, text-xs meta, text-[10px] badges

Layout:
  Sidebar: w-[220px] | Header: h-[52px] | Colunas: w-[280px] mínimo

Bordas:
  Sempre `border` (1px) — nunca style={{ borderWidth: "0.5px" }}
  Hover reforçado: hover:border-white/14

Formato de saída:
  JSX válido (não HTML puro)
  style={{}} apenas para: fontFamily, backgroundColor dinâmico, transform
  Nenhuma classe Tailwind inexistente
  Preserve toda lógica — só altere aparência
  Um componente por bloco de código

---

COMPONENTE 1 — CardItem

Foco:
- Cover bar h-[3px] no topo com a cor do card
- Título em Oswald font-medium line-clamp-2 letter-spacing 0.02em
- Chips de prioridade com border colorida rounded-sm font-mono
- Tags coloridas rounded-full
- Footer separado por border-t com deadline em font-mono
- Hover: translateY(-1px) + box-shadow 0 4px 16px rgba(0,0,0,0.4)

---

COMPONENTE 2 — CardDetailModal

Foco:
- max-w-2xl com animação de entrada translateY(10px → 0) opacity(0 → 1)
- Backdrop bg-black/60 backdrop-blur-sm
- Header: eyebrow com prioridade + tipo + deadline em font-mono text-[10px]
- Título em Oswald text-xl font-semibold
- 5 tabs: Detalhes·1, Checklist·2, Comentários·3, Atividade·4, Tempo·5
- Tab ativa: border-b-2 border-foreground, shortcut numérico em opacity-40
- Corpo com overflow-y-auto independente do header

---

COMPONENTE 3 — AppShell (sidebar + header)

Foco:
- Sidebar w-[220px] bg-sidebar border-r
- Brand "Molas" em Oswald uppercase text-lg com dot animate-pulse
- Nav items rounded-sm hover:bg-white/5 active:bg-white/10 text-[13px]
- Seção Tracks: dot colorido + badge count em font-mono rounded-sm bg-white/10
- Header h-[52px] bg-background border-b
- Search: hint ⌘K em font-mono bg-white/6 rounded-sm
- Botão Create: Oswald uppercase bg-primary text-primary-foreground rounded-sm h-8

---

COMPONENTE 4 — Board (Swimlane + colunas)

Foco:
- Track header: barra vertical 3px com cor da track + nome em Oswald uppercase text-lg tracking-wider
- Track meta: contadores em font-mono text-[11px] text-muted-foreground
- Column header: nome em font-mono uppercase text-xs letter-spacing 0.08em
- Column badge: rounded-sm bg-white/7 font-mono; laranja se WIP excedido
- Empty state: border-dashed rounded-lg p-6 com ícone + texto em font-mono
- Botão "+ Adicionar": text-muted-foreground hover:text-foreground text-xs
