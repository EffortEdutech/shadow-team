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
