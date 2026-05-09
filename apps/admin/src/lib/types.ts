export type Product = {
  id: string;
  name: string;
  slug: string;
  status: string;
  priority: number;
  risk_level: "low" | "medium" | "high" | "critical" | "varies";
  first_ai_use_case: string | null;
};

export type ProductProfile = {
  product_id: string;
  target_users: string[];
  support_categories: string[];
  restricted_actions: string[];
  escalation_rules: string[];
  billing_model: string | null;
  metadata_json: Record<string, unknown>;
};

export type Agent = {
  id: string;
  name: string;
  department: string;
  status: string;
  description: string | null;
  system_prompt_version: string;
};

export type AgentProductAccess = {
  id: string;
  access_level: string;
  products: Pick<Product, "name" | "slug" | "risk_level"> | null;
};

export type ContactProfile = {
  id: string;
  external_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
};

export type Conversation = {
  id: string;
  product_id: string | null;
  channel: "manual" | "web" | "app" | "whatsapp" | "email" | "api" | "other";
  contact_profile_id: string | null;
  status: "open" | "pending" | "escalated" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assigned_to: string | null;
  ai_status: string;
  subject: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_type: "user" | "ai" | "human" | "system" | "note";
  sender_id: string | null;
  content: string;
  visibility: "external" | "internal";
  channel_message_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type Ticket = {
  id: string;
  conversation_id: string | null;
  product_id: string | null;
  category: string;
  status: "open" | "pending" | "escalated" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assigned_to: string | null;
  summary: string;
  created_at: string;
};

export type AgentRun = {
  id: string;
  product_id: string | null;
  conversation_id: string | null;
  confidence: number | null;
  risk_level: "low" | "medium" | "high" | "critical";
  human_required: boolean;
  status: "started" | "completed" | "failed" | "cancelled";
  output_json: Record<string, unknown>;
  created_at: string;
};

export type KnowledgeSource = {
  id: string;
  product_id: string | null;
  source_type: string;
  source_title: string;
  source_path: string | null;
  status: "draft" | "approved" | "archived";
  version: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type KnowledgeChunk = {
  id: string;
  source_id: string;
  chunk_text: string;
  embedding_ref: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type WorkItemReview = {
  id: string;
  item_type:
    | "conversation"
    | "approval"
    | "release_readiness"
    | "delivery"
    | "agent_run"
    | "ticket";
  item_id: string;
  product_id: string | null;
  item_label: string;
  source_path: string;
  owner_user_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_date: string;
  note: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MarketingProfile = {
  id: string;
  product_id: string;
  target_audiences: string[];
  positioning_statement: string | null;
  value_propositions: string[];
  brand_voice: string | null;
  restricted_claims: string[];
  approval_owner: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MarketingChannel = {
  id: string;
  channel_key: string;
  channel_name: string;
  status: "draft" | "active" | "paused" | "retired";
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MarketingCampaign = {
  id: string;
  product_id: string | null;
  name: string;
  objective: string;
  audience: string | null;
  status: "draft" | "planned" | "active" | "completed" | "paused" | "archived";
  starts_on: string | null;
  ends_on: string | null;
  owner_user_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MarketingContentDraft = {
  id: string;
  product_id: string | null;
  campaign_id: string | null;
  channel_id: string | null;
  title: string;
  content_body: string;
  content_type:
    | "social_post"
    | "email"
    | "blog_outline"
    | "short_video_script"
    | "ad_copy"
    | "community_update";
  status: "draft" | "review" | "approved" | "published" | "archived";
  planned_for: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
