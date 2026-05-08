-- Shadow Team Sprint 1 database foundation
-- Supabase project ref: mzcdnvtmwyarcefbroja

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_shadow_team_member()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'shadow_team_role',
    auth.jwt() -> 'user_metadata' ->> 'shadow_team_role'
  ) in (
    'owner',
    'admin',
    'support_manager',
    'support_agent',
    'sales_agent',
    'product_manager',
    'qa_reviewer',
    'viewer'
  );
$$;

create or replace function public.can_manage_shadow_team()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'shadow_team_role',
    auth.jwt() -> 'user_metadata' ->> 'shadow_team_role'
  ) in ('owner', 'admin', 'support_manager');
$$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active',
  owner_user_id uuid references auth.users(id) on delete set null,
  support_email text,
  priority integer not null default 999,
  risk_level text not null default 'medium' check (risk_level in ('low', 'medium', 'high', 'critical', 'varies')),
  first_ai_use_case text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_profiles (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  target_users text[] not null default '{}',
  support_categories text[] not null default '{}',
  restricted_actions text[] not null default '{}',
  escalation_rules text[] not null default '{}',
  billing_model text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id)
);

create table public.contact_profiles (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  name text,
  email text,
  phone text,
  company_name text,
  primary_product_id uuid references public.products(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  channel text not null default 'manual' check (channel in ('manual', 'web', 'app', 'whatsapp', 'email', 'api', 'other')),
  contact_profile_id uuid references public.contact_profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'pending', 'escalated', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  ai_status text not null default 'not_started' check (ai_status in ('not_started', 'drafted', 'waiting_human', 'sent', 'escalated', 'disabled')),
  subject text,
  last_message_preview text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'ai', 'human', 'system', 'note')),
  sender_id uuid,
  content text not null,
  visibility text not null default 'external' check (visibility in ('external', 'internal')),
  channel_message_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  category text not null default 'unknown',
  status text not null default 'open' check (status in ('open', 'pending', 'escalated', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  summary text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.conversation_tags (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (conversation_id, tag)
);

create table public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'system' check (actor_type in ('user', 'ai', 'human', 'system')),
  actor_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  actor_type text not null default 'system' check (actor_type in ('user', 'ai', 'human', 'system')),
  actor_id uuid,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  department text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'retired')),
  description text,
  system_prompt_version text not null default 'v0.1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_product_access (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  access_level text not null default 'draft_only' check (access_level in ('none', 'read', 'draft_only', 'tool_limited', 'admin')),
  created_at timestamptz not null default now(),
  unique (agent_id, product_id)
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  ticket_id uuid references public.tickets(id) on delete set null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  confidence numeric(5, 4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  risk_level text not null default 'medium' check (risk_level in ('low', 'medium', 'high', 'critical')),
  human_required boolean not null default true,
  status text not null default 'completed' check (status in ('started', 'completed', 'failed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  tool_name text not null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  status text not null default 'completed' check (status in ('started', 'completed', 'failed', 'blocked')),
  created_at timestamptz not null default now()
);

create table public.agent_approvals (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  approval_type text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  source_type text not null,
  source_title text not null,
  source_path text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  version text not null default 'v0.1',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  chunk_text text not null,
  embedding_ref text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.knowledge_citations (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  source_id uuid references public.knowledge_sources(id) on delete set null,
  chunk_id uuid references public.knowledge_chunks(id) on delete set null,
  used_for text not null,
  created_at timestamptz not null default now()
);

create table public.conversation_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  product_id uuid references public.products(id) on delete cascade,
  channel text not null,
  total_conversations integer not null default 0,
  ai_resolved_count integer not null default 0,
  human_handoff_count integer not null default 0,
  avg_first_response_seconds integer,
  avg_resolution_seconds integer,
  created_at timestamptz not null default now(),
  unique (date, product_id, channel)
);

create table public.agent_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  agent_id uuid references public.agents(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  runs_count integer not null default 0,
  success_count integer not null default 0,
  escalation_count integer not null default 0,
  error_count integer not null default 0,
  avg_confidence numeric(5, 4),
  created_at timestamptz not null default now(),
  unique (date, agent_id, product_id)
);

create table public.product_health_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  product_id uuid references public.products(id) on delete cascade,
  active_users integer not null default 0,
  support_tickets integer not null default 0,
  bug_reports integer not null default 0,
  feature_requests integer not null default 0,
  conversion_events integer not null default 0,
  risk_flags integer not null default 0,
  created_at timestamptz not null default now(),
  unique (date, product_id)
);

create index products_slug_idx on public.products(slug);
create index product_profiles_product_id_idx on public.product_profiles(product_id);
create index contact_profiles_email_idx on public.contact_profiles(email);
create index contact_profiles_phone_idx on public.contact_profiles(phone);
create index conversations_product_status_idx on public.conversations(product_id, status);
create index conversations_assigned_to_idx on public.conversations(assigned_to);
create index conversations_last_message_at_idx on public.conversations(last_message_at desc);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index tickets_product_status_idx on public.tickets(product_id, status);
create index tickets_assigned_to_idx on public.tickets(assigned_to);
create index audit_events_entity_idx on public.audit_events(entity_type, entity_id);
create index audit_events_created_at_idx on public.audit_events(created_at desc);
create index agent_runs_product_created_idx on public.agent_runs(product_id, created_at desc);
create index knowledge_sources_product_status_idx on public.knowledge_sources(product_id, status);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger product_profiles_set_updated_at
before update on public.product_profiles
for each row execute function public.set_updated_at();

create trigger contact_profiles_set_updated_at
before update on public.contact_profiles
for each row execute function public.set_updated_at();

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger tickets_set_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();

create trigger agents_set_updated_at
before update on public.agents
for each row execute function public.set_updated_at();

create trigger knowledge_sources_set_updated_at
before update on public.knowledge_sources
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.product_profiles enable row level security;
alter table public.contact_profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.tickets enable row level security;
alter table public.conversation_tags enable row level security;
alter table public.ticket_events enable row level security;
alter table public.audit_events enable row level security;
alter table public.agents enable row level security;
alter table public.agent_product_access enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_tool_calls enable row level security;
alter table public.agent_approvals enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.knowledge_citations enable row level security;
alter table public.conversation_metrics_daily enable row level security;
alter table public.agent_metrics_daily enable row level security;
alter table public.product_health_daily enable row level security;

create policy "shadow team members can read products"
on public.products for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team managers can manage products"
on public.products for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

create policy "shadow team members can read product profiles"
on public.product_profiles for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team managers can manage product profiles"
on public.product_profiles for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

create policy "shadow team members can read contacts"
on public.contact_profiles for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can manage contacts"
on public.contact_profiles for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

create policy "shadow team members can read conversations"
on public.conversations for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can manage conversations"
on public.conversations for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

create policy "shadow team members can read messages"
on public.messages for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can manage messages"
on public.messages for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

create policy "shadow team members can read tickets"
on public.tickets for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can manage tickets"
on public.tickets for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

create policy "shadow team members can manage conversation tags"
on public.conversation_tags for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

create policy "shadow team members can read ticket events"
on public.ticket_events for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can create ticket events"
on public.ticket_events for insert to authenticated
with check (public.is_shadow_team_member());

create policy "shadow team members can read audit events"
on public.audit_events for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can create audit events"
on public.audit_events for insert to authenticated
with check (public.is_shadow_team_member());

create policy "shadow team members can read agents"
on public.agents for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team managers can manage agents"
on public.agents for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

create policy "shadow team members can read agent product access"
on public.agent_product_access for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team managers can manage agent product access"
on public.agent_product_access for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

create policy "shadow team members can read agent runs"
on public.agent_runs for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can create agent runs"
on public.agent_runs for insert to authenticated
with check (public.is_shadow_team_member());

create policy "shadow team members can read agent tool calls"
on public.agent_tool_calls for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can create agent tool calls"
on public.agent_tool_calls for insert to authenticated
with check (public.is_shadow_team_member());

create policy "shadow team members can read agent approvals"
on public.agent_approvals for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can manage agent approvals"
on public.agent_approvals for all to authenticated
using (public.is_shadow_team_member())
with check (public.is_shadow_team_member());

create policy "shadow team members can read knowledge sources"
on public.knowledge_sources for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team managers can manage knowledge sources"
on public.knowledge_sources for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

create policy "shadow team members can read knowledge chunks"
on public.knowledge_chunks for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team managers can manage knowledge chunks"
on public.knowledge_chunks for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

create policy "shadow team members can read knowledge citations"
on public.knowledge_citations for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team members can create knowledge citations"
on public.knowledge_citations for insert to authenticated
with check (public.is_shadow_team_member());

create policy "shadow team members can read conversation metrics"
on public.conversation_metrics_daily for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team managers can manage conversation metrics"
on public.conversation_metrics_daily for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

create policy "shadow team members can read agent metrics"
on public.agent_metrics_daily for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team managers can manage agent metrics"
on public.agent_metrics_daily for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

create policy "shadow team members can read product health"
on public.product_health_daily for select to authenticated
using (public.is_shadow_team_member());

create policy "shadow team managers can manage product health"
on public.product_health_daily for all to authenticated
using (public.can_manage_shadow_team())
with check (public.can_manage_shadow_team());

