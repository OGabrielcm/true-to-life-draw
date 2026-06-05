# True to Life Draw — Kanban Board

A modern kanban board built with React, TypeScript, and Supabase. Designed for task management with visual prioritization, checklists, dependencies, attachments, activity tracking, and time-based insights.

## Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router, TanStack Start (Vite)
- **Styling**: Tailwind CSS v4, shadcn/ui components, Radix UI
- **State & Data**: React Context stores + TanStack React Query + Supabase client (no realtime subscriptions yet — see ROADMAP T2)
- **Backend**: Supabase (PostgreSQL, authentication, RLS, Storage)
- **Deployment**: Vercel
- **Testing**: Playwright (E2E)
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## Quick Start

### Prerequisites

- Node.js 24 LTS or later
- Bun or npm/pnpm (package manager)
- Supabase account with valid credentials

### Setup

1. **Clone and install dependencies**

```bash
git clone <repository-url>
cd true-to-life-draw
bun install  # or npm install / pnpm install
```

2. **Environment variables**

Create a `.env` file at the project root:

```env
VITE_SUPABASE_URL=https://your-supabase-instance.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

These are loaded automatically by Vite at build time. (E2E tests use a separate `.env.test`.)

3. **Start development server**

```bash
bun run dev
# Server runs on http://localhost:5173
```

4. **Build for production**

```bash
bun run build
bun run preview  # Test production build locally
```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `bun run dev` | Start Vite dev server with hot reload |
| `bun run build` | Build for production (SSR + client) |
| `bun run build:dev` | Build in development mode (debugging) |
| `bun run preview` | Preview production build locally |
| `bun run lint` | Run ESLint across src/ |
| `bun run format` | Format code with Prettier |
| `bun run test:e2e` | Run Playwright E2E tests against `.env.test` |
| `bun run test:e2e:ui` | Run tests with Playwright UI inspector |

## Auth e cadastro

- `/signup` coleta nome, email, confirmação de email, senha e confirmação de senha antes de criar a conta.
- A validação local bloqueia nome vazio, emails divergentes e senhas divergentes.
- O cadastro envia o nome para o Supabase Auth em `user_metadata.full_name` para uso futuro em perfil/onboarding.
- `/login` continua com fluxo simples de email/senha e recuperação separada.

## Supabase Schema

> **Nota de nomenclatura:** a tabela principal chama-se **`tasks`** no banco
> (no código TypeScript o tipo é `Card`). As tabelas-filhas referenciam-na por
> **`task_id`**.

### `tasks`
Main task/goal entities with full metadata.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner (FK to `auth.users`) |
| `col` | text | Column ID (backlog, todo, inprogress, review, done) |
| `track` | uuid | Track/category reference (FK to `tracks`) |
| `type` | text | "Task" or "Goal" |
| `parent_id` | uuid | Optional parent card for sub-tasks (FK to `tasks`) |
| `title` | text | Card title |
| `desc` | text | Card description (markdown) |
| `prio` | text | Priority: "Alta", "Média", or "Baixa" |
| `date` | text | Optional deadline (ISO 8601) |
| `starred` | boolean | User favorite flag |
| `tags` | text[] | Array of trilha IDs for legacy filtering |
| `order` | float | Position within column (allows insertion without renumbering) |
| `checklist` | jsonb | Array of `{id, text, done}` objects |
| `blocked_by` | text[] | Array of card IDs that block this card |
| `created_at` | timestamp | Record creation |
| `updated_at` | timestamp | Last modification |

> Há também uma coluna `attachments` (jsonb) legada nesta tabela, **não usada** —
> os anexos vivem na tabela dedicada `attachments` (abaixo).

### `columns`
Board structure configuration.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text | Column ID ("backlog", "todo", "inprogress", "review", "done" or custom) |
| `user_id` | uuid | Owner (FK to `auth.users`) |
| `name` | text | Display name |
| `order` | int | Column position |
| `wip_limit` | int | Optional work-in-progress limit |
| `track_id` | uuid | Owning track; `null` = global/template column |
| `created_at` | timestamp | Record creation |

### `tracks`
Swimlanes — horizontal lanes of the board with their own columns and colors.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner (FK to `auth.users`) |
| `name` | text | Track name |
| `bg` | text | Background color (hex) |
| `border` | text | Border color (hex) |
| `fg` | text | Foreground/text color (hex) |
| `dark_bg` | text | Dark mode background |
| `dark_fg` | text | Dark mode foreground |
| `order` | int | Track position |
| `created_at` | timestamp | Record creation |

### `trilhas`
Tags/labels for filtering (legacy tag system — **distinct** from `tracks`).
A card's `tags` array holds `trilha` IDs. See the Track vs Trilha note in
`kanban-types.ts`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner (FK to `auth.users`) |
| `name` | text | Label name |
| `bg` | text | Background color (hex) |
| `fg` | text | Foreground/text color (hex) |
| `created_at` | timestamp | Record creation |

### `comments`
Card discussion threads.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `task_id` | uuid | FK to `tasks` (ON DELETE CASCADE) |
| `user_id` | uuid | FK to `auth.users` (ON DELETE CASCADE) |
| `text` | text | Comment text |
| `created_at` | timestamp | Record creation |
| `updated_at` | timestamp | Last edit |

**RLS**: Enabled; users can only view/edit their own comments.

### `activities`
Activity log for audit trail and card history.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `task_id` | uuid | FK to `tasks` (ON DELETE CASCADE) |
| `user_id` | uuid | FK to `auth.users` |
| `type` | text | "created", "moved", "edited", "starred", "checklist", etc. |
| `message` | text | Human-readable log entry |
| `created_at` | timestamp | When action occurred |

### `time_logs`
Time tracking entries per card.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `task_id` | uuid | FK to `tasks` (ON DELETE CASCADE) |
| `user_id` | uuid | FK to `auth.users` (ON DELETE CASCADE) |
| `minutes` | int | Time spent (in minutes) |
| `note` | text | Optional note |
| `logged_at` | timestamp | When the work happened |
| `created_at` | timestamp | Record creation |

### `attachments`
File attachments per card. Binaries live in the `attachments` Storage bucket;
this table holds only metadata. (Bloco 4)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `task_id` | uuid | FK to `tasks` (ON DELETE CASCADE) |
| `user_id` | uuid | FK to `auth.users` (ON DELETE CASCADE) |
| `path` | text | Object path in the bucket: `${task_id}/${uuid}-${name}` |
| `name` | text | Original filename |
| `mime` | text | MIME type |
| `size_bytes` | int | File size |
| `created_at` | timestamp | Record creation |

**RLS** (two layers): table — SELECT for authenticated, INSERT/DELETE by owner;
Storage `objects` — INSERT authenticated, SELECT public, DELETE by `owner_id`.
**Bucket**: `attachments` (public, 20 MB limit).
> **Limitação conhecida:** excluir um card faz cascade nas rows, mas **orfana os
> objetos no Storage** (sem trigger de limpeza).

### `user_profile`
Per-user preferences (one row per user).

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | Primary key / FK to `auth.users` |
| `onboarding_completed` | boolean | Gates the mandatory Beta onboarding |
| `theme` | text | UI theme: `dark` (default), `light`, `babyblue`, `sepia` — cross-device |
| `created_at` | timestamp | Record creation |
| `updated_at` | timestamp | Last update |

### `habits`
Habit definitions for the habit tracker (`/habits`). Separate system — does not
reference `tasks`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to `auth.users` (ON DELETE CASCADE) |
| `name` | text | Habit name |
| `color` | text | Swatch color (hex) |
| `frequency` | jsonb | `{type:"daily"}` or `{type:"weekdays", days:[0–6]}` (0=Sunday) |
| `archived` | boolean | Soft-hide flag |
| `created_at` | timestamp | Record creation |

### `habit_logs`
Daily completion log. The **presence** of a row marks the habit as done that day
(toggle inserts/deletes). Streak, heatmap and consistency all derive from this table.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `habit_id` | uuid | FK to `habits` (ON DELETE CASCADE) |
| `user_id` | uuid | FK to `auth.users` (ON DELETE CASCADE) |
| `date` | date | Day completed (local ISO) |
| `created_at` | timestamp | Record creation |

**Constraint**: `unique (habit_id, date)` — one log per habit per day.
**RLS**: per-user (SELECT/INSERT/DELETE where `auth.uid() = user_id`) on both tables.

### Authentication

- **Provider**: Supabase Auth (email + password)
- **Session**: JWT token stored in localStorage (HTTP-only cookie preferred in production)
- **Row-Level Security (RLS)**: Enabled on all tables; users see only their own board data

## Project Structure

```
src/
├── components/              # React components (presentation layer)
│   ├── kanban/             # Board, cards, modals
│   │   └── card-modal-sections/  # Checklist, Comments, Activity, Time, Dependencies, Attachments
│   ├── habits/             # Habit UI shared by /habits, Dashboard & For You
│   │   ├── StreakBadge.tsx / HabitHeatmapStrip.tsx
│   │   ├── DashboardHabits.tsx   # Dashboard habits section (Bloco 7)
│   │   └── ForYouHabits.tsx      # For You contextual block (Bloco 7)
│   ├── shell/              # Layout shell (AppShell), navigation
│   ├── onboarding/         # Mandatory Beta onboarding
│   └── theme-provider.tsx  # 4 themes + cross-device persistence bridge
├── lib/
│   ├── kanban-store/       # Kanban Context store, split into slices (Bloco 1)
│   │   ├── index.tsx          # Public barrel (KanbanProvider, useKanban)
│   │   ├── provider.tsx       # Kernel: entities + filters + actions
│   │   ├── context.ts         # KanbanCtx type + useKanban hook
│   │   ├── kanban-mappers.ts  # row ↔ Card mapping
│   │   ├── use-card-details.ts # activities/comments/time/attachments slice
│   │   ├── use-templates.ts / use-card-colors.ts
│   ├── habits-store/       # Habit tracker Context store (provider/context/index)
│   ├── *-service.ts        # activity / comments / timelog / attachments / habits services
│   ├── kanban-types.ts     # TypeScript types (Card, Column, Track, Attachment, …)
│   ├── habit-types.ts      # Habit / HabitLog / Frequency types
│   ├── habit-logic.ts      # Pure habit logic (streak, record, consistency, heatmap)
│   ├── date-utils.ts       # Shared date helpers (calendar + habit heatmap)
│   ├── auth-store.tsx      # Authentication state
│   ├── user-profile-store.tsx # onboarding + theme preference (Supabase bridge)
│   ├── supabase.ts         # Supabase client initialization
│   ├── i18n.ts / locale-context.tsx / markdown.ts / utils.ts
├── routes/                 # TanStack Router (file-based)
│   ├── __root.tsx          # Root layout + providers
│   ├── index.tsx           # Board (main)
│   ├── calendar.tsx        # Calendar view
│   ├── habits.tsx          # Habit tracker (list, streak, heatmap)
│   ├── dashboards.tsx      # Statistics & export (+ habits summary)
│   ├── for-you.tsx         # Recents + favorites (+ habits block)
│   ├── profile.tsx / settings.tsx
│   └── (auth)/             # Pathless group: login, signup, reset-password (URLs unchanged)
├── hooks/
├── main.tsx                # App entry point
├── router.tsx              # Router setup
└── start.ts                # TanStack Start server configuration
```

## Key Concepts

### Columns & Ordering

The board uses **float-based ordering** to allow inserting cards between existing positions without renumbering the entire column. When moving a card from position 2 to position 2.5, all subsequent positions remain stable.

### Tracks (Swimlanes)

Tracks organize cards by theme or context. Each track has its own color scheme with light/dark variants. Cards can belong to a single track and can be filtered by track.

### Priorities

Three priority levels with semantic colors:
- **Alta** (High): Red tones — urgent work
- **Média** (Medium): Orange tones — standard work
- **Baixa** (Low): Green tones — backlog/nice-to-have

### Themes

Four themes ship: **Dark** (default), **Light**, **Baby Blue**, and **Sépia**.
The choice is persisted per user in `user_profile.theme` (cross-device) and
mirrored to `localStorage` for instant, flash-free paint. The theme never gates
render — a slow/failed DB read can't hang the UI.

### Attachments

Files are uploaded to the `attachments` Storage bucket (public, 20 MB);
metadata lives in the `attachments` table. Deleting an attachment removes the
Storage object **and** the row.

### Habit Tracker

A separate system from the board (`/habits`). A habit has a `frequency`
(`daily` or specific `weekdays`); marking it done on a day inserts a row in
`habit_logs` (the row's **presence** = done). All derived metrics are computed
from the logs by pure, unit-tested functions in `habit-logic.ts`:

- **Streak** — consecutive *scheduled* days with a log (a Mon/Wed/Fri habit
  doesn't break on weekends); today is pending until marked.
- **Record** — the longest streak ever achieved.
- **Monthly consistency** — % of days this month with ≥1 scheduled habit done.
- **Heatmaps** — per-habit month grid (`/habits`) and a 30-day aggregate strip
  (Dashboard).

These metrics surface in three places: the `/habits` tab, a Dashboard summary
section, and a contextual For You block (today's pending + streak-at-risk alert).
Time-of-day is **not** tracked (logs store the date only).

### Activity Tracking

Every card action (created, edited, moved, etc.) is logged to the `activities`
table for audit trails and historical context.

> **Sync:** the app is single-client (refetch on load/navigation); there are no
> realtime subscriptions yet. Multi-tab realtime is a future item (ROADMAP T2).

## Development Workflow

### Creating a Feature

1. Create a feature branch following Conventional Commits:
   ```bash
   git checkout -b feat/card-pinning
   ```

2. Use the `git-commit` skill when committing:
   ```bash
   Skill(git-commit)  # Ensures Conventional Commits in pt-BR
   ```

3. Run linting and format before pushing:
   ```bash
   bun run lint
   bun run format
   ```

### Running E2E Tests

Tests run against a separate Supabase project (configured in `.env.test`):

```bash
bun run test:e2e              # Headless mode
bun run test:e2e:ui           # Interactive UI mode
```

Each test gets a unique execution ID to isolate data and prevent cross-test interference.

### Quality Assurance

The project uses the `project-booster` skill to intelligently assess pull requests:

- **Modo 1**: New features → checklist of architecture decisions
- **Modo 2**: Component reviews → real problems only, no nitpicks
- **Modo 3**: Database queries → RLS, indexes, and performance validation

## Deployment

### Official Deploy Provider: Vercel

This project is deployed on **Vercel** (https://vercel.com). No additional configuration needed; merging a PR to `main` triggers a production deployment. (Commit via feature branches + PRs — never push to `main` directly.)

- Production URL: https://true-to-life-draw.vercel.app
- Preview URLs: Auto-generated per pull request
- Environment variables: Configured in Vercel dashboard

**Why Vercel?**
- Native support for TanStack Start and Vite
- Automatic serverless function deployment
- Built-in analytics and performance monitoring
- No vendor lock-in; can export to any Node.js host if needed

### Local Production Preview

```bash
bun run build
bun run preview
# Open http://localhost:4173
```

## Troubleshooting

### "Cannot find module" errors

Ensure `tsconfig.json` paths are correctly resolved. Check `vite-tsconfig-paths` is installed.

### Supabase connection fails

1. Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check Supabase project is running and RLS policies permit your user
3. Ensure Supabase client is initialized in `src/lib/supabase.ts`

### E2E tests fail with "Auth required"

Ensure `.env.test` exists and contains valid test account credentials. Tests must run with isolated sessions.

## Contributing

1. Read [ROADMAP.md](./ROADMAP.md) for current phase and optimization priorities
2. Follow pt-BR Conventional Commits (feat, fix, chore, docs, etc.)
3. Run `bun run format && bun run lint` before committing
4. Add E2E tests for new user-facing features
5. Request a review using the `project-booster` skill

## License

Private project — contact gabrielcartaxomerces@gmail.com for access inquiries.
