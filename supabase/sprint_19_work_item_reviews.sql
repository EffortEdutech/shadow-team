-- Shadow Team Sprint 19: Operator Ownership / Reviewed Today
-- Safe to run multiple times in Supabase SQL Editor.

create table if not exists public.work_item_reviews (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (
    item_type in (
      'conversation',
      'approval',
      'release_readiness',
      'delivery',
      'agent_run',
      'ticket'
    )
  ),
  item_id uuid not null,
  product_id uuid references public.products(id) on delete set null,
  item_label text not null,
  source_path text not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_date date not null default current_date,
  note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, item_id, review_date)
);

create index if not exists work_item_reviews_item_idx
on public.work_item_reviews(item_type, item_id);

create index if not exists work_item_reviews_review_date_idx
on public.work_item_reviews(review_date desc);

create index if not exists work_item_reviews_owner_idx
on public.work_item_reviews(owner_user_id);

drop trigger if exists work_item_reviews_set_updated_at on public.work_item_reviews;
create trigger work_item_reviews_set_updated_at
before update on public.work_item_reviews
for each row execute function public.set_updated_at();

alter table public.work_item_reviews enable row level security;

drop policy if exists "shadow team members can read work item reviews"
on public.work_item_reviews;

create policy "shadow team members can read work item reviews"
on public.work_item_reviews for select to authenticated
using (public.is_shadow_team_member());

drop policy if exists "shadow team members can manage work item reviews"
on public.work_item_reviews;

create policy "shadow team members can manage work item reviews"
on public.work_item_reviews for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

notify pgrst, 'reload schema';
