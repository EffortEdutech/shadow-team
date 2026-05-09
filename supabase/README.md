# Supabase Setup

Supabase project:

```text
mzcdnvtmwyarcefbroja
```

Dashboard:

```text
https://supabase.com/dashboard/project/mzcdnvtmwyarcefbroja
```

## Sprint 1 Files

| File | Purpose |
|---|---|
| `migrations/20260508160000_sprint_1_database_foundation.sql` | Creates tables, indexes, triggers, RLS policies, and helper functions |
| `seed.sql` | Seeds products, product profiles, first draft agents, and agent product access |
| `bootstrap_owner.sql` | Sets the first Supabase Auth user as Shadow Team owner |
| `sprint_10_department_agents.sql` | Adds first non-support department agents and product access |

## Apply Option A - Supabase SQL Editor

1. Open the project dashboard.
2. Go to SQL Editor.
3. Run the migration SQL first.
4. Run `seed.sql` after the migration succeeds.
5. Run `bootstrap_owner.sql` after the first owner Auth user exists.

## Apply Option B - Supabase CLI

The Supabase CLI is not required for Sprint 1. If you install it later, link this repo to the project:

```powershell
supabase link --project-ref mzcdnvtmwyarcefbroja
supabase db push
```

Then run `seed.sql` through the SQL Editor or your preferred database connection.

## Auth Role Requirement

RLS policies check for this custom JWT metadata key:

```text
shadow_team_role
```

Allowed values:

```text
owner
admin
support_manager
support_agent
sales_agent
product_manager
qa_reviewer
viewer
```

For the first owner/admin user, set `app_metadata.shadow_team_role` to `owner` in Supabase Auth.

The first owner bootstrap file currently targets:

```text
kamalabdlatif@gmail.com
```

During backend development, server-side operations may use the service role key, but never expose the service role key to the browser.
