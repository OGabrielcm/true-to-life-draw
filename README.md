# True to Life Draw — Kanban Board

A modern, real-time collaborative kanban board built with React, TypeScript, and Supabase. Designed for task management with visual prioritization, activity tracking, and time-based insights.

## Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router, TanStack Start (Vite)
- **Styling**: Tailwind CSS v4, shadcn/ui components, Radix UI
- **State & Data**: TanStack React Query, Supabase Realtime
- **Backend**: Supabase (PostgreSQL, authentication, RLS)
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

Create a `.env.local` file at the project root:

```env
VITE_SUPABASE_URL=https://your-supabase-instance.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

These are loaded automatically by Vite at build time.

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

## Supabase Schema

### `cards`
Main task/goal entities with full metadata.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `col` | text | Column ID (backlog, todo, inprogress, review, done) |
| `track` | uuid | Track/category reference (FK to `tracks`) |
| `type` | text | "Task" or "Goal" |
| `parent_id` | uuid | Optional parent card for sub-tasks (FK to `cards`) |
| `title` | text | Card title |
| `desc` | text | Card description (markdown) |
| `prio` | text | Priority: "Alta", "Média", or "Baixa" |
| `date` | text | Optional deadline (ISO 8601) |
| `starred` | boolean | User favorite flag |
| `tags` | text[] | Array of track IDs for legacy filtering |
| `order` | float | Position within column (allows insertion without renumbering) |
| `checklist` | jsonb | Array of `{id, text, done}` objects |
| `blocked_by` | text[] | Array of card IDs that block this card |
| `created_at` | timestamp | Record creation |
| `updated_at` | timestamp | Last modification (updated via Supabase trigger) |

**Indexes**: `(col, order)`, `(track)`, `(parent_id)`

### `columns`
Board structure configuration.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text | Fixed IDs: "backlog", "todo", "inprogress", "review", "done" |
| `name` | text | Display name |
| `order` | int | Column position |
| `wip_limit` | int | Optional work-in-progress limit |

### `tracks`
Categories/swimlanes for organizing cards by theme.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `name` | text | Track name |
| `bg` | text | Background color (hex) |
| `border` | text | Border color (hex) |
| `fg` | text | Foreground/text color (hex) |
| `darkBg` | text | Dark mode background |
| `darkFg` | text | Dark mode foreground |
| `order` | int | Track position |

### `comments`
Card discussion threads.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `card_id` | uuid | FK to `cards` (ON DELETE CASCADE) |
| `user_id` | uuid | FK to `auth.users` (ON DELETE CASCADE) |
| `content` | text | Markdown comment text |
| `created_at` | timestamp | Record creation |
| `updated_at` | timestamp | Last edit |

**RLS**: Enabled; users can only view/edit comments on their board's cards.

### `activities`
Activity log for audit trail and card history.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `card_id` | uuid | FK to `cards` (ON DELETE CASCADE) |
| `action` | text | "created", "edited", "moved", "completed", etc. |
| `description` | text | Human-readable log entry |
| `created_at` | timestamp | When action occurred |

### `time_logs`
Time tracking entries per card.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `card_id` | uuid | FK to `cards` (ON DELETE CASCADE) |
| `user_id` | uuid | FK to `auth.users` (ON DELETE CASCADE) |
| `duration_minutes` | int | Time spent (in minutes) |
| `date` | date | Date of entry |
| `created_at` | timestamp | Record creation |

### Authentication

- **Provider**: Supabase Auth (email + password)
- **Session**: JWT token stored in localStorage (HTTP-only cookie preferred in production)
- **Row-Level Security (RLS)**: Enabled on all tables; users see only their own board data

## Project Structure

```
src/
├── components/          # React components (presentation layer)
│   ├── kanban/         # Board, cards, modals
│   ├── shell/          # Layout shell, navigation
│   └── theme-provider.tsx
├── lib/                # Utilities and shared logic
│   ├── kanban-store.tsx    # Zustand store (state + persistence)
│   ├── kanban-types.ts     # TypeScript interfaces (Card, Column, Track)
│   ├── supabase.ts         # Supabase client initialization
│   ├── auth-store.tsx      # Authentication state
│   └── utils.ts            # Helper functions
├── routes/             # TanStack Router pages
│   ├── index.tsx      # Dashboard (main board)
│   ├── calendar.tsx   # Calendar view
│   ├── dashboards.tsx # Statistics & export
│   └── login.tsx      # Authentication
├── hooks/              # Custom React hooks
├── main.tsx            # App entry point
└── start.ts            # TanStack Start server configuration
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

### Real-time Sync

Supabase Realtime subscriptions keep all clients synchronized. When a card is edited, moved, or commented on, all connected users see the change instantly.

### Activity Tracking

Every card action (created, edited, moved, etc.) is logged to the `activities` table for audit trails and historical context.

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

This project is deployed on **Vercel** (https://vercel.com). No additional configuration needed; push to `main` branch for production deployment.

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

1. Verify `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
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
