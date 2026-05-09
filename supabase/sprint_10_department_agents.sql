-- Sprint 10: Department Agent Profiles
-- Safe to run multiple times in Supabase SQL Editor.

insert into public.agents (name, department, status, description, system_prompt_version)
values
  ('Lead Qualification Agent', 'Sales and Growth', 'draft', 'Classifies leads by product interest, urgency, fit, and next step.', 'v0.1'),
  ('Demo Prep Agent', 'Sales and Growth', 'draft', 'Prepares demo agendas, discovery questions, and product walkthrough notes.', 'v0.1'),
  ('Product Manager Agent', 'Product Operations', 'draft', 'Turns support, analytics, and product signals into backlog suggestions.', 'v0.1'),
  ('QA Checklist Agent', 'QA and Testing', 'draft', 'Generates focused manual test checklists and regression areas.', 'v0.1'),
  ('Release Readiness Agent', 'QA and Testing', 'draft', 'Drafts release readiness reports from QA, approvals, support risk, knowledge, backlog, and agent activity.', 'v0.1'),
  ('Knowledge Curator Agent', 'Documentation and Knowledge Base', 'draft', 'Finds repeated questions and proposes FAQ or SOP knowledge entries.', 'v0.1'),
  ('Management Report Agent', 'Finance, Billing, and Admin', 'draft', 'Prepares owner-reviewed operating summaries across products and support.', 'v0.1'),
  ('Compliance Triage Agent', 'Compliance, Trust, and Audit', 'draft', 'Flags legal, financial, religious, contract, certification, and privacy risk.', 'v0.1'),
  ('Repo Analyst Agent', 'Developer and Technical Operations', 'draft', 'Explains repository structure, dependencies, and implementation impact.', 'v0.1')
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
  'Lead Qualification Agent',
  'Demo Prep Agent',
  'Product Manager Agent',
  'QA Checklist Agent',
  'Release Readiness Agent',
  'Knowledge Curator Agent',
  'Management Report Agent',
  'Compliance Triage Agent',
  'Repo Analyst Agent'
)
on conflict (agent_id, product_id) do update set
  access_level = excluded.access_level;

select
  a.name,
  a.department,
  a.status,
  count(apa.product_id) as product_access_count
from public.agents a
left join public.agent_product_access apa on apa.agent_id = a.id
where a.name in (
  'Lead Qualification Agent',
  'Demo Prep Agent',
  'Product Manager Agent',
  'QA Checklist Agent',
  'Release Readiness Agent',
  'Knowledge Curator Agent',
  'Management Report Agent',
  'Compliance Triage Agent',
  'Repo Analyst Agent'
)
group by a.id, a.name, a.department, a.status
order by a.department, a.name;
