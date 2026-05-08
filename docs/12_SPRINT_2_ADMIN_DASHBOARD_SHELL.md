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
| `/support` | Sprint 3 placeholder |
| `/tickets` | Sprint 3 placeholder |
| `/analytics` | Sprint 6 placeholder |
| `/knowledge` | Sprint 5 placeholder |
| `/agents` | Sprint 4 placeholder |
| `/settings` | Sprint 2 placeholder |

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
- unauthenticated users redirect to `/login`

