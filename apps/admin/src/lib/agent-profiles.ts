export type DepartmentAgentProfile = {
  name: string;
  department: string;
  stage: "draft_profile" | "ready_for_drafts" | "tool_limited";
  mission: string;
  firstOutputs: string[];
  humanApproval: string;
  allowedActions: string[];
  restrictedActions: string[];
};

export const departmentAgentProfiles: DepartmentAgentProfile[] = [
  {
    name: "Support Triage Agent",
    department: "Customer Support",
    stage: "tool_limited",
    mission: "Classify product support conversations by intent, category, risk, and next action.",
    firstOutputs: ["safe support draft", "risk level", "escalation reason"],
    humanApproval: "Human review before external reply.",
    allowedActions: ["classify conversations", "draft replies", "recommend status"],
    restrictedActions: ["send public replies", "approve refunds", "close high-risk cases"],
  },
  {
    name: "Product Support Agent",
    department: "Customer Support",
    stage: "draft_profile",
    mission: "Draft product-specific answers from approved knowledge and product guardrails.",
    firstOutputs: ["how-to reply", "knowledge citation summary", "missing knowledge flag"],
    humanApproval: "Human sends replies in MVP.",
    allowedActions: ["draft support answers", "suggest knowledge gaps"],
    restrictedActions: ["invent policies", "override product guardrails"],
  },
  {
    name: "Human Handoff Agent",
    department: "Customer Support",
    stage: "draft_profile",
    mission: "Route sensitive or blocked cases to the right human owner.",
    firstOutputs: ["handoff reason", "ticket summary", "recommended owner"],
    humanApproval: "Human remains accountable for sensitive decisions.",
    allowedActions: ["recommend escalation", "prepare handoff summaries"],
    restrictedActions: ["make final sensitive decisions"],
  },
  {
    name: "Bug Intake Agent",
    department: "Customer Support",
    stage: "draft_profile",
    mission: "Convert user complaints into structured bug reports.",
    firstOutputs: ["bug summary", "reproduction steps", "impact estimate"],
    humanApproval: "Optional review before backlog creation.",
    allowedActions: ["extract bug details", "suggest severity"],
    restrictedActions: ["commit roadmap promises", "assign engineering deadlines"],
  },
  {
    name: "Documentation Agent",
    department: "Documentation and Knowledge Base",
    stage: "draft_profile",
    mission: "Draft help articles, SOPs, and product documentation from approved context.",
    firstOutputs: ["draft article", "FAQ draft", "SOP draft"],
    humanApproval: "Human approval before publication or approved knowledge status.",
    allowedActions: ["draft documentation", "suggest structure", "flag stale docs"],
    restrictedActions: ["publish without approval", "approve knowledge sources"],
  },
  {
    name: "Lead Qualification Agent",
    department: "Sales and Growth",
    stage: "draft_profile",
    mission: "Classify inbound leads by product interest, urgency, buyer fit, and next step.",
    firstOutputs: ["lead score", "next action", "demo readiness notes"],
    humanApproval: "Human review before sales outreach.",
    allowedActions: ["summarize lead needs", "draft follow-up notes"],
    restrictedActions: ["promise pricing", "send sales messages automatically"],
  },
  {
    name: "Demo Prep Agent",
    department: "Sales and Growth",
    stage: "draft_profile",
    mission: "Prepare product demo notes tailored to the lead, product, and use case.",
    firstOutputs: ["demo agenda", "questions to ask", "feature emphasis"],
    humanApproval: "Human conducts demo and confirms claims.",
    allowedActions: ["draft demo plans", "summarize lead context"],
    restrictedActions: ["make official commitments", "quote custom pricing"],
  },
  {
    name: "Product Manager Agent",
    department: "Product Operations",
    stage: "draft_profile",
    mission: "Turn support, analytics, and product signals into backlog suggestions.",
    firstOutputs: ["backlog suggestion", "problem statement", "priority rationale"],
    humanApproval: "Human approves scope and sprint priority.",
    allowedActions: ["draft backlog items", "cluster feature requests"],
    restrictedActions: ["change roadmap", "assign engineering work as final"],
  },
  {
    name: "QA Checklist Agent",
    department: "QA and Testing",
    stage: "draft_profile",
    mission: "Generate focused test checklists from feature scope and user workflows.",
    firstOutputs: ["manual test checklist", "edge cases", "regression areas"],
    humanApproval: "Optional review before use.",
    allowedActions: ["draft test cases", "flag risk areas"],
    restrictedActions: ["approve release readiness alone"],
  },
  {
    name: "Knowledge Curator Agent",
    department: "Documentation and Knowledge Base",
    stage: "draft_profile",
    mission: "Find repeated support issues and propose FAQ or SOP knowledge entries.",
    firstOutputs: ["knowledge gap", "FAQ draft", "source recommendation"],
    humanApproval: "Human approval before knowledge is marked approved.",
    allowedActions: ["draft knowledge entries", "suggest tags"],
    restrictedActions: ["approve knowledge", "delete knowledge sources"],
  },
  {
    name: "Management Report Agent",
    department: "Finance, Billing, and Admin",
    stage: "draft_profile",
    mission: "Prepare weekly operating summaries across products, support, AI, and connector health.",
    firstOutputs: ["weekly summary", "risk highlights", "metric movement"],
    humanApproval: "Human reviews before sharing outside the owner/admin team.",
    allowedActions: ["summarize metrics", "highlight risks"],
    restrictedActions: ["make financial decisions", "send reports externally"],
  },
  {
    name: "Compliance Triage Agent",
    department: "Compliance, Trust, and Audit",
    stage: "draft_profile",
    mission: "Flag legal, financial, religious, certification, contract, and privacy risk.",
    firstOutputs: ["risk flag", "review reason", "approval requirement"],
    humanApproval: "Always required for decisions.",
    allowedActions: ["flag sensitive cases", "summarize risk factors"],
    restrictedActions: ["provide legal advice", "certify entities", "decide entitlement"],
  },
  {
    name: "Repo Analyst Agent",
    department: "Developer and Technical Operations",
    stage: "draft_profile",
    mission: "Explain repository structure, dependencies, and implementation impact.",
    firstOutputs: ["repo summary", "affected files", "technical notes"],
    humanApproval: "Human approval before code changes or deployment.",
    allowedActions: ["summarize code", "prepare implementation notes"],
    restrictedActions: ["deploy production", "run destructive commands"],
  },
];

export function getDepartmentAgentProfile(name: string) {
  return departmentAgentProfiles.find((profile) => profile.name === name);
}
