-- Shadow Team Sprint 20: Marketing Foundation
-- Safe to run multiple times in Supabase SQL Editor.

create table if not exists public.marketing_profiles (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  target_audiences text[] not null default '{}',
  positioning_statement text,
  value_propositions text[] not null default '{}',
  brand_voice text,
  restricted_claims text[] not null default '{}',
  approval_owner text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id)
);

create table if not exists public.marketing_channels (
  id uuid primary key default gen_random_uuid(),
  channel_key text not null unique,
  channel_name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'retired')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  objective text not null,
  audience text,
  status text not null default 'draft' check (status in ('draft', 'planned', 'active', 'completed', 'paused', 'archived')),
  starts_on date,
  ends_on date,
  owner_user_id uuid references auth.users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_content_drafts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  channel_id uuid references public.marketing_channels(id) on delete set null,
  title text not null,
  content_body text not null,
  content_type text not null default 'social_post' check (content_type in ('social_post', 'email', 'blog_outline', 'short_video_script', 'ad_copy', 'community_update')),
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'published', 'archived')),
  planned_for timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_profiles_product_idx
on public.marketing_profiles(product_id);

create index if not exists marketing_campaigns_product_status_idx
on public.marketing_campaigns(product_id, status);

create index if not exists marketing_content_drafts_product_status_idx
on public.marketing_content_drafts(product_id, status);

create index if not exists marketing_content_drafts_campaign_idx
on public.marketing_content_drafts(campaign_id);

drop trigger if exists marketing_profiles_set_updated_at on public.marketing_profiles;
create trigger marketing_profiles_set_updated_at
before update on public.marketing_profiles
for each row execute function public.set_updated_at();

drop trigger if exists marketing_channels_set_updated_at on public.marketing_channels;
create trigger marketing_channels_set_updated_at
before update on public.marketing_channels
for each row execute function public.set_updated_at();

drop trigger if exists marketing_campaigns_set_updated_at on public.marketing_campaigns;
create trigger marketing_campaigns_set_updated_at
before update on public.marketing_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists marketing_content_drafts_set_updated_at on public.marketing_content_drafts;
create trigger marketing_content_drafts_set_updated_at
before update on public.marketing_content_drafts
for each row execute function public.set_updated_at();

alter table public.marketing_profiles enable row level security;
alter table public.marketing_channels enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.marketing_content_drafts enable row level security;

drop policy if exists "shadow team members can read marketing profiles"
on public.marketing_profiles;
create policy "shadow team members can read marketing profiles"
on public.marketing_profiles for select to authenticated
using (public.is_shadow_team_member());

drop policy if exists "shadow team members can manage marketing profiles"
on public.marketing_profiles;
create policy "shadow team members can manage marketing profiles"
on public.marketing_profiles for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

drop policy if exists "shadow team members can read marketing channels"
on public.marketing_channels;
create policy "shadow team members can read marketing channels"
on public.marketing_channels for select to authenticated
using (public.is_shadow_team_member());

drop policy if exists "shadow team managers can manage marketing channels"
on public.marketing_channels;
create policy "shadow team managers can manage marketing channels"
on public.marketing_channels for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

drop policy if exists "shadow team members can read marketing campaigns"
on public.marketing_campaigns;
create policy "shadow team members can read marketing campaigns"
on public.marketing_campaigns for select to authenticated
using (public.is_shadow_team_member());

drop policy if exists "shadow team members can manage marketing campaigns"
on public.marketing_campaigns;
create policy "shadow team members can manage marketing campaigns"
on public.marketing_campaigns for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

drop policy if exists "shadow team members can read marketing content drafts"
on public.marketing_content_drafts;
create policy "shadow team members can read marketing content drafts"
on public.marketing_content_drafts for select to authenticated
using (public.is_shadow_team_member());

drop policy if exists "shadow team members can manage marketing content drafts"
on public.marketing_content_drafts;
create policy "shadow team members can manage marketing content drafts"
on public.marketing_content_drafts for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

insert into public.marketing_channels (channel_key, channel_name, status)
values
  ('linkedin', 'LinkedIn', 'draft'),
  ('facebook', 'Facebook', 'draft'),
  ('x', 'X', 'draft'),
  ('instagram', 'Instagram', 'draft'),
  ('tiktok', 'TikTok', 'draft'),
  ('email', 'Email', 'draft'),
  ('community', 'Community', 'draft')
on conflict (channel_key) do update set
  channel_name = excluded.channel_name,
  status = public.marketing_channels.status,
  updated_at = now();

notify pgrst, 'reload schema';
