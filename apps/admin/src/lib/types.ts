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
};

export type Agent = {
  id: string;
  name: string;
  department: string;
  status: string;
};

