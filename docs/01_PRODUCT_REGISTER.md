# Product Register

## Purpose

The product register is the source of truth for which products Shadow Team supports, what risk level each product carries, and where AI may help first.

## Current Products

| Priority | Product | Slug | Status | First AI Use Case | Risk | First Connector |
|---:|---|---|---|---|---|---|
| 1 | MyExpensio | `myexpensio` | active product | Support, onboarding, billing FAQ | Medium | Yes |
| 2 | AmanahGP | `amanahgp` | active/productizing | NGO onboarding, donor/admin guidance | High | After MyExpensio |
| 3 | Contract Diary Platform | `contract-diary-platform` | active product | Diary support, document guidance, claim-sensitive routing | High | After AmanahGP |
| 4 | WorkLedger | `workledger` | active product | Work setup and progress reporting support | Medium/High | Later |
| 5 | Narrio | `narrio` | active product | Creator onboarding and story assistance | Medium | Later |
| 6 | Pagecast | `pagecast` | active product | Content/page support and SEO draft help | Medium | Later |
| 7 | Future Products | `future-products` | planned | Must use product profile template | Varies | Later |

## Product Rollout Rule

No product should be connected to production channels until it has:

- product profile
- support categories
- knowledge sources
- allowed AI actions
- restricted AI actions
- escalation rules
- approval owner
- basic analytics metrics

## First Connector

MyExpensio is the first connector because it has clear support and onboarding needs with medium risk. It should validate the central support workflow before higher-risk products are connected.

