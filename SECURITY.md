# Security Notes — Molas Kanban

## Supabase Auth

- Supabase Auth is configured with email/password authentication.
- Row-Level Security (RLS) is enabled for the app data tables so users only access their own board data.
- The app performs local signup validation for required name, matching email confirmation, and matching password confirmation.

## Known accepted risk — leaked password protection

As of 2026-06-22, the Supabase Security Advisor still reports:

- `auth_leaked_password_protection`
- **Leaked Password Protection Disabled**
- Level: `WARN`

The setting exists in the Supabase Dashboard under:

```txt
Authentication → Attack Protection → Prevent use of leaked passwords
```

However, Supabase blocks this feature on the current Free plan and shows that leaked password protection via HaveIBeenPwned.org is only available on Pro plans and above.

Decision for now:

- Do **not** upgrade the Supabase plan only to clear this advisor.
- Accept the warning temporarily as a Free-plan limitation.
- Revisit before opening the app to external/public users or turning it into a commercial product.

Compensating controls while this remains disabled:

- Keep RLS enabled and reviewed for all user-owned data.
- Keep secrets/server keys out of the frontend.
- Maintain signup validation in the app.
- Restrict MVP usage to known/private users until a broader security review is done.
