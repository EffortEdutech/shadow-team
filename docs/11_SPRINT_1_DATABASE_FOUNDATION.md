# Sprint 1 - Database Foundation

Date started: 2026-05-08

Supabase project ref:

```text
mzcdnvtmwyarcefbroja
```

Dashboard:

```text
https://supabase.com/dashboard/project/mzcdnvtmwyarcefbroja
```

## Scope

Sprint 1 creates the database foundation only.

Build:

- core product tables
- support inbox tables
- ticket tables
- audit event table
- agent tables
- knowledge source tables
- analytics tables
- seed products
- seed draft agents
- RLS policies

Do not build yet:

- admin UI
- product connectors
- WhatsApp
- autonomous AI replies
- advanced RAG
- department automation

## Created Files

| File | Purpose |
|---|---|
| `supabase/migrations/20260508160000_sprint_1_database_foundation.sql` | Creates schema, indexes, triggers, helper functions, and RLS policies |
| `supabase/seed.sql` | Seeds products, product profiles, draft agents, and agent access |
| `supabase/bootstrap_owner.sql` | Sets the first Supabase Auth user as Shadow Team owner |
| `supabase/README.md` | Supabase apply instructions |
| `.env.example` | Documents required Supabase environment variables without secrets |
| `.gitignore` | Prevents local secrets and generated files from being committed |

## First Apply Method

Use Supabase SQL Editor first:

1. Run the migration SQL.
2. Run `supabase/seed.sql`.
3. Run `supabase/bootstrap_owner.sql` after the first Auth user exists.
4. Confirm products were inserted.
5. Confirm the first admin user's `app_metadata.shadow_team_role` is `owner`.

## RLS Role Metadata

RLS checks this key:

```text
shadow_team_role
```

Allowed values:

- owner
- admin
- support_manager
- support_agent
- sales_agent
- product_manager
- qa_reviewer
- viewer

## Verification Queries

After applying the migration and seed, run:

```sql
select slug, name, priority, risk_level
from public.products
order by priority;
```

```sql
select p.slug, pp.support_categories, pp.restricted_actions
from public.product_profiles pp
join public.products p on p.id = pp.product_id
order by p.priority;
```

```sql
select name, department, status
from public.agents
order by name;
```

## Sprint 1 Exit Criteria

- migration applies successfully
- seed applies successfully
- product register exists in database
- product profiles exist in database
- draft agents exist in database
- RLS is enabled on all new tables
- no secrets are committed
