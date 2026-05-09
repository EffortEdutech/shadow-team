-- Shadow Team seed data
-- Safe to run multiple times.

insert into public.products (name, slug, status, priority, risk_level, first_ai_use_case)
values
  ('MyExpensio', 'myexpensio', 'active', 1, 'medium', 'Support, onboarding, billing FAQ'),
  ('AmanahGP', 'amanahgp', 'active', 2, 'high', 'NGO onboarding, donor/admin guidance'),
  ('Contract Diary Platform', 'contract-diary-platform', 'active', 3, 'high', 'Diary support, document guidance, claim-sensitive routing'),
  ('WorkLedger', 'workledger', 'active', 4, 'high', 'Work setup and progress reporting support'),
  ('Narrio', 'narrio', 'active', 5, 'medium', 'Creator onboarding and story assistance'),
  ('Pagecast', 'pagecast', 'active', 6, 'medium', 'Content/page support and SEO draft help')
on conflict (slug) do update set
  name = excluded.name,
  status = excluded.status,
  priority = excluded.priority,
  risk_level = excluded.risk_level,
  first_ai_use_case = excluded.first_ai_use_case,
  updated_at = now();

insert into public.product_profiles (
  product_id,
  target_users,
  support_categories,
  restricted_actions,
  escalation_rules,
  billing_model,
  metadata_json
)
select
  p.id,
  array['individual claimants', 'employees', 'company admins', 'finance teams'],
  array['account_login', 'billing_subscription', 'onboarding', 'how_to_use', 'bug_report', 'feature_request', 'data_import_export', 'integration', 'claim_or_payment', 'sales_lead', 'demo_request', 'unknown'],
  array['approve claims', 'reject claims', 'decide tax treatment', 'issue refunds', 'change billing records', 'delete claim data'],
  array['claim approval request', 'refund or payment dispute', 'incorrect amount', 'sensitive personal data', 'missing approved knowledge'],
  'to be confirmed',
  jsonb_build_object(
    'product_slug', p.slug,
    'product_specific_categories', array['mileage_claim', 'receipt_upload', 'tng_linking', 'company_enrolment', 'claim_export']
  )
from public.products p
where p.slug = 'myexpensio'
on conflict (product_id) do update set
  target_users = excluded.target_users,
  support_categories = excluded.support_categories,
  restricted_actions = excluded.restricted_actions,
  escalation_rules = excluded.escalation_rules,
  billing_model = excluded.billing_model,
  metadata_json = excluded.metadata_json,
  updated_at = now();

insert into public.product_profiles (
  product_id,
  target_users,
  support_categories,
  restricted_actions,
  escalation_rules,
  billing_model,
  metadata_json
)
select
  p.id,
  array['NGOs', 'charities', 'donors', 'reviewers', 'admins'],
  array['account_login', 'onboarding', 'how_to_use', 'bug_report', 'feature_request', 'data_import_export', 'certification_or_review_sensitive', 'partnership', 'unknown'],
  array['certify NGO', 'assign trust rating', 'make governance conclusion', 'make religious or legal conclusion', 'approve evidence', 'publish sensitive review results'],
  array['certification decision', 'trust rating dispute', 'governance or legal risk', 'public complaint', 'sensitive evidence'],
  'to be confirmed',
  jsonb_build_object(
    'product_slug', p.slug,
    'product_specific_categories', array['ngo_onboarding', 'evidence_submission', 'trust_index_question', 'donor_visibility', 'reviewer_workflow', 'governance_document']
  )
from public.products p
where p.slug = 'amanahgp'
on conflict (product_id) do update set
  target_users = excluded.target_users,
  support_categories = excluded.support_categories,
  restricted_actions = excluded.restricted_actions,
  escalation_rules = excluded.escalation_rules,
  billing_model = excluded.billing_model,
  metadata_json = excluded.metadata_json,
  updated_at = now();

insert into public.product_profiles (
  product_id,
  target_users,
  support_categories,
  restricted_actions,
  escalation_rules,
  billing_model,
  metadata_json
)
select
  p.id,
  array['main contractors', 'subcontractors', 'project teams', 'contract administrators'],
  array['account_login', 'onboarding', 'how_to_use', 'bug_report', 'feature_request', 'data_import_export', 'contract_or_legal_sensitive', 'integration', 'unknown'],
  array['determine contract entitlement', 'provide legal advice', 'decide claim validity', 'interpret contract clauses as final advice', 'submit official claim documents'],
  array['claim entitlement question', 'legal or contract interpretation', 'delay claim', 'payment dispute', 'formal notice', 'official external report'],
  'to be confirmed',
  jsonb_build_object(
    'product_slug', p.slug,
    'product_specific_categories', array['daily_diary', 'site_event', 'delay_record', 'photo_attachment', 'report_export', 'claim_sensitive', 'contract_admin']
  )
from public.products p
where p.slug = 'contract-diary-platform'
on conflict (product_id) do update set
  target_users = excluded.target_users,
  support_categories = excluded.support_categories,
  restricted_actions = excluded.restricted_actions,
  escalation_rules = excluded.escalation_rules,
  billing_model = excluded.billing_model,
  metadata_json = excluded.metadata_json,
  updated_at = now();

insert into public.product_profiles (
  product_id,
  target_users,
  support_categories,
  restricted_actions,
  escalation_rules,
  billing_model,
  metadata_json
)
select
  p.id,
  array['SMEs', 'contractors', 'service teams', 'field workers', 'supervisors'],
  array['account_login', 'onboarding', 'how_to_use', 'bug_report', 'feature_request', 'data_import_export', 'contract_or_legal_sensitive', 'integration', 'unknown'],
  array['accept completed work officially', 'approve payment', 'decide contract entitlement', 'provide legal advice', 'submit official client reports', 'delete work records'],
  array['payment entitlement', 'work acceptance dispute', 'legal or contract issue', 'formal client submission', 'data loss'],
  'to be confirmed',
  jsonb_build_object(
    'product_slug', p.slug,
    'product_specific_categories', array['work_report', 'progress_summary', 'evidence_attachment', 'template_setup', 'client_report', 'offline_sync']
  )
from public.products p
where p.slug = 'workledger'
on conflict (product_id) do update set
  target_users = excluded.target_users,
  support_categories = excluded.support_categories,
  restricted_actions = excluded.restricted_actions,
  escalation_rules = excluded.escalation_rules,
  billing_model = excluded.billing_model,
  metadata_json = excluded.metadata_json,
  updated_at = now();

insert into public.product_profiles (
  product_id,
  target_users,
  support_categories,
  restricted_actions,
  escalation_rules,
  billing_model,
  metadata_json
)
select
  p.id,
  array['writers', 'creators', 'readers', 'moderators'],
  array['account_login', 'onboarding', 'how_to_use', 'bug_report', 'feature_request', 'content_moderation', 'data_import_export', 'unknown'],
  array['publish content without confirmation', 'delete or hide content without approval', 'make final moderation decisions', 'impersonate creator'],
  array['policy violation', 'harassment or abuse', 'copyright concern', 'moderation dispute', 'public publishing action'],
  'to be confirmed',
  jsonb_build_object(
    'product_slug', p.slug,
    'product_specific_categories', array['story_creation', 'branch_timeline', 'chapter_version', 'publishing', 'reader_navigation', 'moderation_flag']
  )
from public.products p
where p.slug = 'narrio'
on conflict (product_id) do update set
  target_users = excluded.target_users,
  support_categories = excluded.support_categories,
  restricted_actions = excluded.restricted_actions,
  escalation_rules = excluded.escalation_rules,
  billing_model = excluded.billing_model,
  metadata_json = excluded.metadata_json,
  updated_at = now();

insert into public.product_profiles (
  product_id,
  target_users,
  support_categories,
  restricted_actions,
  escalation_rules,
  billing_model,
  metadata_json
)
select
  p.id,
  array['creators', 'businesses', 'internal team', 'marketers'],
  array['account_login', 'onboarding', 'how_to_use', 'bug_report', 'feature_request', 'data_import_export', 'integration', 'sales_lead', 'demo_request', 'unknown'],
  array['publish public pages without confirmation', 'make official sensitive claims', 'change pricing commitments', 'delete pages without approval', 'send public campaign messages'],
  array['sensitive public claims', 'official business commitment', 'public page outage', 'reputational risk', 'uncertain factual claims'],
  'to be confirmed',
  jsonb_build_object(
    'product_slug', p.slug,
    'product_specific_categories', array['page_creation', 'publishing', 'seo_content', 'lead_capture', 'campaign_page', 'product_page']
  )
from public.products p
where p.slug = 'pagecast'
on conflict (product_id) do update set
  target_users = excluded.target_users,
  support_categories = excluded.support_categories,
  restricted_actions = excluded.restricted_actions,
  escalation_rules = excluded.escalation_rules,
  billing_model = excluded.billing_model,
  metadata_json = excluded.metadata_json,
  updated_at = now();

insert into public.agents (name, department, status, description, system_prompt_version)
values
  ('Support Triage Agent', 'Customer Support', 'draft', 'Classifies product, intent, urgency, and risk.', 'v0.1'),
  ('Product Support Agent', 'Customer Support', 'draft', 'Drafts product-specific support replies from approved knowledge.', 'v0.1'),
  ('Human Handoff Agent', 'Customer Support', 'draft', 'Creates tickets and routes sensitive conversations to humans.', 'v0.1'),
  ('Bug Intake Agent', 'Customer Support', 'draft', 'Converts complaints into structured bug reports.', 'v0.1'),
  ('Documentation Agent', 'Documentation and Knowledge Base', 'draft', 'Drafts and maintains support docs, FAQs, and SOPs.', 'v0.1'),
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
  'Support Triage Agent',
  'Product Support Agent',
  'Human Handoff Agent',
  'Bug Intake Agent',
  'Documentation Agent',
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
