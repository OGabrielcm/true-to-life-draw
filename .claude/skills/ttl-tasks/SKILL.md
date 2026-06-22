# ttl-tasks — Skill para criar e listar tasks no Molas Kanban

Use esta skill quando Gabriel pedir para criar, listar ou consultar tasks/cards no board dele em **true-to-life-draw.vercel.app**.

## Configuração

A skill requer a variável de ambiente `TTL_API_KEY` disponível no ambiente do agente.  
Endpoint base: `https://true-to-life-draw.vercel.app`

Verifique antes de usar:

```bash
echo $TTL_API_KEY | head -c 8  # deve mostrar os primeiros 8 chars da key
```

---

## Operações disponíveis

### 1. Listar tracks e colunas

Sempre chame isso primeiro para obter os IDs corretos de track antes de criar uma task.

```bash
curl -s "https://true-to-life-draw.vercel.app/api/tracks" \
  -H "Authorization: Bearer $TTL_API_KEY"
```

Retorna:

```json
{
  "tracks": [{ "id": "uuid", "name": "Trabalho", "order": 0 }, ...],
  "columns": [{ "id": "backlog", "name": "Backlog", "order": 0, "track_id": "uuid" }, ...]
}
```

**IDs de coluna padrão:** `backlog`, `todo`, `inprogress`, `review`, `done`

---

### 2. Criar task

```bash
curl -s -X POST "https://true-to-life-draw.vercel.app/api/tasks" \
  -H "Authorization: Bearer $TTL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Título da task",
    "col": "backlog",
    "track": "UUID_DO_TRACK",
    "prio": "Média",
    "type": "Task",
    "desc": "Descrição opcional",
    "date": "2026-06-15"
  }'
```

**Campos obrigatórios:** `title`

**Valores válidos:**

- `col`: `backlog` | `todo` | `inprogress` | `review` | `done`
- `prio`: `Alta` | `Média` | `Baixa`
- `type`: `Task` | `Goal`
- `date`: formato `YYYY-MM-DD` (opcional)
- `track`: UUID do track (use `/api/tracks` para listar) — deixar vazio (`""`) se não souber

Retorna a task criada com `id` e todos os campos.

---

### 3. Listar tasks

```bash
# Todas as tasks
curl -s "https://true-to-life-draw.vercel.app/api/tasks" \
  -H "Authorization: Bearer $TTL_API_KEY"

# Filtrar por coluna
curl -s "https://true-to-life-draw.vercel.app/api/tasks?col=backlog" \
  -H "Authorization: Bearer $TTL_API_KEY"

# Filtrar por prioridade
curl -s "https://true-to-life-draw.vercel.app/api/tasks?prio=Alta" \
  -H "Authorization: Bearer $TTL_API_KEY"

# Tasks estreladas
curl -s "https://true-to-life-draw.vercel.app/api/tasks?starred=true" \
  -H "Authorization: Bearer $TTL_API_KEY"
```

---

## Comportamento padrão ao criar tasks

Se Gabriel não especificar:

- **col** → usar `backlog`
- **prio** → usar `Média`
- **type** → usar `Task`
- **track** → chamar `/api/tracks` primeiro e perguntar em qual track colocar, OU usar o primeiro track da lista se o contexto for claro

---

## Exemplos de uso em conversa

**Gabriel:** "Cria uma task para revisar o relatório mensal, prioridade alta"

```bash
# 1. Buscar tracks
curl -s ".../api/tracks" -H "Authorization: Bearer $TTL_API_KEY"
# 2. Criar no backlog com prio Alta
curl -s -X POST ".../api/tasks" \
  -H "Authorization: Bearer $TTL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Revisar relatório mensal","col":"backlog","prio":"Alta","track":"<uuid-trabalho>"}'
```

**Gabriel:** "Quais tasks estão in progress?"

```bash
curl -s ".../api/tasks?col=inprogress" -H "Authorization: Bearer $TTL_API_KEY"
```

---

## Instalação na VPS (Hermes)

Adicione ao `~/.bashrc` ou `~/.zshrc` do agente na VPS:

```bash
export TTL_API_KEY="<valor_da_key>"
```

Ou configure no `claude.json` / variáveis de ambiente do processo do agente.

A skill em si não precisa de dependências — usa apenas `curl` que já está disponível em qualquer Linux.
