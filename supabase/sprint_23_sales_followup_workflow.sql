-- Shadow Team Sprint 23: Sales Follow-up Workflow
-- Safe to run multiple times in Supabase SQL Editor.

create table if not exists public.sales_followups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  contact_name text not null,
  contact_email text,
  company_name text,
  lead_source text,
  product_interest text not null,
  status text not null default 'new' check (status in ('new', 'drafted', 'review', 'approved', 'sent', 'closed', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  next_follow_up_on date,
  owner_user_id uuid references auth.users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_followup_drafts (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null references public.sales_followups(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'sent', 'archived')),
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_followups_product_status_idx
on public.sales_followups(product_id, status);

create index if not exists sales_followups_campaign_idx
on public.sales_followups(campaign_id);

create index if not exists sales_followup_drafts_followup_idx
on public.sales_followup_drafts(followup_id);

drop trigger if exists sales_followups_set_updated_at on public.sales_followups;
create trigger sales_followups_set_updated_at
before update on public.sales_followups
for each row execute function public.set_updated_at();

drop trigger if exists sales_followup_drafts_set_updated_at on public.sales_followup_drafts;
create trigger sales_followup_drafts_set_updated_at
before update on public.sales_followup_drafts
for each row execute function public.set_updated_at();

alter table public.sales_followups enable row level security;
alter table public.sales_followup_drafts enable row level security;

drop policy if exists "shadow team members can read sales followups"
on public.sales_followups;
create policy "shadow team members can read sales followups"
on public.sales_followups for select to authenticated
using (public.is_shadow_team_member());

drop policy if exists "shadow team members can manage sales followups"
on public.sales_followups;
create policy "shadow team members can manage sales followups"
on public.sales_followups for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

drop policy if exists "shadow team members can read sales followup drafts"
on public.sales_followup_drafts;
create policy "shadow team members can read sales followup drafts"
on public.sales_followup_drafts for select to authenticated
using (public.is_shadow_team_member());

drop policy if exists "shadow team members can manage sales followup drafts"
on public.sales_followup_drafts;
create policy "shadow team members can manage sales followup drafts"
on public.sales_followup_drafts for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

insert into public.agents (name, department, status, description, system_prompt_version)
values
  (
    'Sales Follow-up Agent',
    'Product Marketing, Social Media, and Growth',
    'draft',
    'Drafts campaign-aware sales follow-up messages for human review before sending.',
    'v0.1'
  )
on conflict (name) do update set
  department = excluded.department,
  status = excluded.status,
  description = excluded.description,
  system_prompt_version = excluded.system_prompt_version,
  updated_at = now();

insert into public.agent_product_access (agent_id, product_id, access_level)
select a.id, p.id, 'draft_only'
from public.agents a
cross join public.products p
where a.name = 'Sales Follow-up Agent'
on conflict (agent_id, product_id) do update set
  access_level = excluded.access_level;

notify pgrst, 'reload schema';
