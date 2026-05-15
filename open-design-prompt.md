# Prompt Open Design → React/Tailwind

Cole este prompt no Open Design quando quiser uma nova iteração de design
que seja diretamente compatível com o projeto React.

> O projeto `true-to-life-draw` já está carregado no Open Design.
> Antes de gerar qualquer coisa, leia os arquivos reais em src/components/.

---

## Prompt principal

Leia os arquivos do projeto true-to-life-draw antes de responder:
- src/components/kanban/CardItem.tsx
- src/components/kanban/CardDetailModal.tsx
- src/components/shell/AppShell.tsx
- src/components/kanban/Board.tsx
- src/styles.css

Com base nesses arquivos reais, redesenha visualmente o componente [NOME DO COMPONENTE].

REGRAS DE SAÍDA — gere JSX compatível com o projeto:

**Cores — use sempre os tokens semânticos (não hex):**
| Token Tailwind          | Significado              |
|-------------------------|--------------------------|
| bg-background           | fundo da página (#000)   |
| bg-card                 | fundo dos cards (#111)   |
| bg-sidebar              | fundo da sidebar (#111)  |
| bg-muted                | hover / inputs (#1a1a1a) |
| text-foreground         | texto principal          |
| text-muted-foreground   | texto secundário (45%)   |
| border-border           | borda padrão (8% white)  |
| bg-primary / text-primary-foreground | botão primário |
| text-destructive        | vermelho (excluir)       |

**Border-radius — use classes Tailwind:**
- rounded-sm  → 4px  (chips, badges, inputs pequenos)
- rounded-lg  → 8px  (cards, inputs)
- rounded-xl  → 10px (painéis)
- rounded-2xl → 12px (modais)

**Tipografia:**
- Oswald (display): `style={{ fontFamily: "var(--font-display)" }}`
- Mono: classe `font-mono`
- Tamanhos: `text-[13px]` body, `text-sm` labels, `text-xs` meta, `text-[10px]` badges

**Layout fixo do projeto:**
- Sidebar: `w-[220px]`
- Header: `h-[52px]`
- Colunas: `w-[280px]` mínimo

**Bordas:**
- Sempre `border` (1px) — nunca `style={{ borderWidth: "0.5px" }}`
- Para borda reforçada no hover: `hover:border-white/14`

**Formato de saída:**
- JSX válido (não HTML puro)
- `style={{}}` apenas para: `fontFamily`, `backgroundColor` de cores dinâmicas (track color, priority color), `transform`
- Nenhuma classe Tailwind inventada
- Preserve toda a lógica existente (drag-drop, onClick, estado) — só altere aparência
- Um componente por bloco de código

---

## Exemplos de uso

### Redesenhar o CardItem
> Leia src/components/kanban/CardItem.tsx e redesenha o componente CardItem
> mantendo toda a lógica de drag-drop e eventos. Aplique as regras acima.
> Foco: hierarquia visual mais clara, deadline no footer separado por border-top.

### Redesenhar o CardDetailModal
> Leia src/components/kanban/CardDetailModal.tsx e redesenha o modal.
> Mantenha o sistema de 5 tabs. Aplique as regras acima.
> Foco: header mais compacto, tabs com shortcut numérico visível.

### Redesenhar a Sidebar
> Leia src/components/shell/AppShell.tsx e redesenha apenas o bloco <aside>.
> Aplique as regras acima.
> Foco: nav-items com hover sutil, track list com dot colorido e badge de count.

### Nova feature
> Leia os arquivos do projeto e cria um componente [NOME] novo.
> Ele deve ser visualmente consistente com o restante do projeto.
> Aplique as regras acima. Retorne JSX pronto para adicionar ao projeto.

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
