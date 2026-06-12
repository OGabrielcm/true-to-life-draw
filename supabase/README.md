# Supabase — Banco de dados

## Fonte da verdade

O histórico de migrations **vive no banco remoto** (projeto Supabase), gerenciado via
MCP (`apply_migration`). Para ver o histórico: `list_migrations` no MCP ou
Dashboard → Database → Migrations.

Migrations aplicadas até jun/2026:

| Versão | Nome |
|---|---|
| 20260514185321 | add_order_to_tasks |
| 20260514234358 | clean_invalid_trilha_tags |
| 20260514235456 | fix_emmanuel_invalid_columns |
| 20260519124446 | add_track_id_to_columns |
| 20260521024316 | user_profile_onboarding |
| 20260601154508 | user_theme_preference |
| 20260601211656 | supabase_attachments_migration |
| 20260602094431 | supabase_habits_migration |
| 20260612194823 | security_fix_advisors_jun2026 |

## Regras

1. **Toda alteração de schema** deve ser feita via `apply_migration` (MCP), nunca
   por SQL avulso no editor — assim ela entra no histórico versionado.
2. Após qualquer mudança de schema, rodar `get_advisors (security)` e corrigir
   o que aparecer.
3. O schema completo das tabelas está documentado no `README.md` da raiz.

## `legacy/`

SQLs antigos que eram mantidos soltos na raiz do repo, **anteriores** à adoção do
histórico de migrations. Já foram aplicados manualmente no banco — não reaplicar.
Mantidos apenas como referência histórica.

## Pendência manual (Dashboard)

- **Leaked Password Protection** está desativado. Ativar em:
  Dashboard → Authentication → Policies/Password Security
  (checa senhas contra HaveIBeenPwned).
