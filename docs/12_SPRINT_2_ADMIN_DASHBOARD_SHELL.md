# Sprint 2 - Admin Dashboard Shell

Date started: 2026-05-09

## Goal

Build the first internal admin app shell and prove owner login can read Supabase data protected by RLS.

## Scope

Build:

- Next.js admin app under `apps/admin`
- Supabase email/password login
- protected admin layout
- owner role check from `shadow_team_role`
- sidebar navigation
- dashboard overview
- product register page
- placeholder routes for later modules
- active route navigation
- mobile navigation
- product detail/profile route
- live Agents page
- live Settings system status page
- reusable empty/error state card

Do not build yet:

- support inbox workflow
- ticket mutations
- AI drafting
- knowledge manager
- analytics charts
- product connectors

## Created Routes

| Route | Purpose |
|---|---|
| `/login` | Supabase email/password sign in |
| `/dashboard` | Admin overview and Sprint 2 status |
| `/products` | Reads seeded products from Supabase |
| `/products/[slug]` | Reads product profile, categories, restrictions, and escalation rules |
| `/support` | Sprint 3 placeholder |
| `/tickets` | Sprint 3 placeholder |
| `/analytics` | Sprint 6 placeholder |
| `/knowledge` | Sprint 5 placeholder |
| `/agents` | Reads seeded draft agents and product access |
| `/settings` | Shows owner role, project ref, and seed counts |

## Local Environment

Create `apps/admin/.env.local` with:

```text
NEXT_PUBLIC_SUPABASE_URL=https://mzcdnvtmwyarcefbroja.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Never put the service role key in the browser app.

## Verification

Run:

```powershell
npm run admin:lint
npm run admin:build
npm run admin:dev
```

Then open:

```text
http://localhost:3000/login
```

Expected:

- owner can sign in
- dashboard loads
- product register shows six seeded products
- product detail pages show profile boundaries
- agents page shows seeded draft agents
- settings page confirms owner role and seed counts
- unauthenticated users redirect to `/login`

## Completion Checklist

- [x] Admin app scaffolded
- [x] Supabase login works
- [x] Protected admin layout works
- [x] Owner role is read from `shadow_team_role`
- [x] Active sidebar navigation
- [x] Mobile navigation
- [x] Dashboard overview
- [x] Product register
- [x] Product detail/profile page
- [x] Agents read-only page
- [x] Settings system status page
- [x] Placeholder routes for later sprints
- [x] Lint passes
- [x] Production build passes
