# Database Model

## Purpose

This model supports the Sprint 1 database foundation.

## Core Tables

```text
products
--------
id
name
slug
status
owner_user_id
support_email
created_at
updated_at

product_profiles
----------------
id
product_id
target_users
support_categories
restricted_actions
escalation_rules
billing_model
metadata_json
created_at
updated_at

contact_profiles
----------------
id
external_id
name
email
phone
company_name
primary_product_id
created_at
updated_at

conversations
-------------
id
product_id
channel
contact_profile_id
status
priority
assigned_to
ai_status
created_at
updated_at
last_message_at

messages
--------
id
conversation_id
sender_type
sender_id
content
channel_message_id
metadata_json
created_at

tickets
-------
id
conversation_id
product_id
category
status
priority
assigned_to
summary
created_at
updated_at
closed_at
```

## Support Workflow Tables

```text
conversation_tags
-----------------
id
conversation_id
tag
created_at

ticket_events
-------------
id
ticket_id
event_type
actor_type
actor_id
metadata_json
created_at

audit_events
------------
id
product_id
actor_type
actor_id
event_type
entity_type
entity_id
metadata_json
created_at
```

## Agent Tables

```text
agents
------
id
name
department
status
description
system_prompt_version
created_at
updated_at

agent_product_access
--------------------
id
agent_id
product_id
access_level
created_at

agent_runs
----------
id
agent_id
product_id
conversation_id
ticket_id
input_json
output_json
confidence
risk_level
human_required
created_at

agent_tool_calls
----------------
id
agent_run_id
tool_name
input_json
output_json
status
created_at

agent_approvals
---------------
id
agent_run_id
approval_type
status
requested_by
approved_by
approved_at
notes
```

## Knowledge Tables

```text
knowledge_sources
-----------------
id
product_id
source_type
source_title
source_path
status
version
created_at
updated_at

knowledge_chunks
----------------
id
source_id
chunk_text
embedding_ref
metadata_json
created_at

knowledge_citations
-------------------
id
agent_run_id
source_id
chunk_id
used_for
created_at
```

## Analytics Tables

```text
conversation_metrics_daily
--------------------------
id
date
product_id
channel
total_conversations
ai_resolved_count
human_handoff_count
avg_first_response_seconds
avg_resolution_seconds
created_at

agent_metrics_daily
-------------------
id
date
agent_id
product_id
runs_count
success_count
escalation_count
error_count
avg_confidence
created_at

product_health_daily
--------------------
id
date
product_id
active_users
support_tickets
bug_reports
feature_requests
conversion_events
risk_flags
created_at
```

