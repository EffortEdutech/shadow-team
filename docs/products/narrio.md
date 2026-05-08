# Product Profile - Narrio

## Product Identity

Product Name: Narrio

Product Slug: `narrio`

Priority: 5

Product Status: Active product

Product Type: AI/social storybook and interactive storytelling platform

Primary Users: Writers, creators, readers

Secondary Users: Moderators, community managers, internal product team

## Product Summary

Narrio helps creators write, branch, publish, and manage interactive stories. AI can support onboarding, story planning, branch/timeline assistance, reader support, and moderation triage. It must not publish or delete content without confirmation.

Main workflows:

- create story
- create branch or timeline
- write chapter/version
- review reader interaction
- publish updates
- moderate content

## First AI Use Cases

| Use Case | User Type | AI Role | Human Review Needed |
|---|---|---|---|
| Creator onboarding | Writer | Explain story creation workflow | Human optional |
| Branch planning | Writer | Draft structure ideas | User approves |
| Chapter teaser draft | Writer | Draft promotional text | User approves before publishing |
| Reader support | Reader | Explain navigation/bookmarks/follows | Human optional |
| Moderation triage | Moderator | Flag content for review | Human decides action |

## Support Categories

- account_login
- onboarding
- how_to_use
- bug_report
- feature_request
- content_moderation
- data_import_export
- unknown

Product-specific categories:

- story_creation
- branch_timeline
- chapter_version
- publishing
- reader_navigation
- moderation_flag

## Knowledge Sources Needed

| Source | Type | Status |
|---|---|---|
| Creator onboarding guide | user guide | draft needed |
| Story/branch model guide | user guide | draft needed |
| Publishing guide | user guide | draft needed |
| Content rules | policy | draft needed |
| Moderation SOP | SOP | draft needed |

## Allowed AI Actions

AI may:

- explain how to create stories and branches
- draft story structure suggestions
- draft chapter teasers
- summarize reader feedback
- flag potential moderation issues
- create support tickets

## Restricted AI Actions

AI must not:

- publish content without user confirmation
- delete or hide content without human/moderator approval
- make final moderation decisions
- impersonate a creator
- override content rules

## Escalation Rules

Escalate when:

- content may violate policy
- user reports harassment, abuse, copyright, or safety concerns
- user disputes moderation
- publishing action has public impact
- AI is uncertain about content policy

## Risk Classification

| Risk | Examples | AI Behavior |
|---|---|---|
| Low | How to create a story | Draft answer |
| Medium | Story planning or teaser draft | Draft for user approval |
| High | Moderation dispute or policy concern | Escalate |
| Critical | Safety, legal, copyright, or abuse report | Immediate escalation |

## Metrics

- creator onboarding questions
- publishing questions
- moderation flags
- reader support issues
- story workflow knowledge gaps
- bug reports

## Connector Requirements

Narrio should send:

- product id
- user id
- user role
- current story/chapter context if permitted
- current page/module
- message content

Shadow Team may send back:

- support reply
- draft content
- ticket status
- moderation escalation note

## Approval Contact

Default Escalation Owner: Founder/Product Owner

Backup Owner: Community/Content Lead

