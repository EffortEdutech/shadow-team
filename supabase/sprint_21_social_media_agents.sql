-- Shadow Team Sprint 21: Social Media Draft Workflow agents
-- Safe to run multiple times in Supabase SQL Editor.

insert into public.agents (name, department, status, description, system_prompt_version)
values
  (
    'Product Marketing Agent',
    'Product Marketing, Social Media, and Growth',
    'draft',
    'Turns product profiles, marketing profiles, support signals, and campaigns into positioning-aware marketing draft ideas.',
    'v0.1'
  ),
  (
    'Social Media Content Agent',
    'Product Marketing, Social Media, and Growth',
    'draft',
    'Drafts channel-specific social media content for human approval before publishing.',
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
where a.name in (
  'Product Marketing Agent',
  'Social Media Content Agent'
)
on conflict (agent_id, product_id) do update set
  access_level = excluded.access_level;

notify pgrst, 'reload schema';
