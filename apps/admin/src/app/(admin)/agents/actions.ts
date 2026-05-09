"use server";

import { revalidatePath } from "next/cache";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getSignedInUserId() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in.");
  }

  return { supabase, userId: user.id };
}

const QaChecklistDraft = z.object({
  title: z.string().min(1).max(180),
  scopeSummary: z.string().min(1),
  assumptions: z.array(z.string()).min(1),
  testChecklist: z
    .array(
      z.object({
        area: z.string().min(1),
        testCase: z.string().min(1),
        expectedResult: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]),
      }),
    )
    .min(5),
  regressionAreas: z.array(z.string()).min(1),
  dataSetup: z.array(z.string()).min(1),
  releaseRisks: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  humanApprovalRequired: z.boolean(),
});

const ProductManagerDraft = z.object({
  title: z.string().min(1).max(180),
  planningSummary: z.string().min(1),
  backlogItems: z
    .array(
      z.object({
        title: z.string().min(1),
        problem: z.string().min(1),
        suggestedScope: z.string().min(1),
        userValue: z.string().min(1),
        evidence: z.array(z.string()).min(1),
        priority: z.enum(["low", "medium", "high"]),
        effort: z.enum(["small", "medium", "large", "unknown"]),
        humanDecisionNeeded: z.string().min(1),
      }),
    )
    .min(3),
  notInScope: z.array(z.string()).min(1),
  risks: z.array(z.string()).min(1),
  nextQuestions: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  humanApprovalRequired: z.boolean(),
});

const ManagementReportDraft = z.object({
  title: z.string().min(1).max(180),
  executiveSummary: z.string().min(1),
  supportSummary: z.array(z.string()).min(1),
  connectorSummary: z.array(z.string()).min(1),
  aiOperationsSummary: z.array(z.string()).min(1),
  knowledgeSummary: z.array(z.string()).min(1),
  qaAndPlanningSummary: z.array(z.string()).min(1),
  risks: z.array(z.string()).min(1),
  recommendedActions: z
    .array(
      z.object({
        action: z.string().min(1),
        owner: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]),
        reason: z.string().min(1),
      }),
    )
    .min(1),
  openQuestions: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  humanApprovalRequired: z.boolean(),
});

const ReleaseReadinessDraft = z.object({
  title: z.string().min(1).max(180),
  releaseSummary: z.string().min(1),
  readinessDecision: z.enum(["ready_for_human_review", "not_ready", "blocked"]),
  evidenceReviewed: z.array(z.string()).min(1),
  qaStatus: z.array(z.string()).min(1),
  approvalStatus: z.array(z.string()).min(1),
  supportRisk: z.array(z.string()).min(1),
  knowledgeReadiness: z.array(z.string()).min(1),
  blockers: z.array(z.string()).min(1),
  requiredActions: z
    .array(
      z.object({
        action: z.string().min(1),
        owner: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]),
        reason: z.string().min(1),
      }),
    )
    .min(1),
  goNoGoQuestions: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  humanApprovalRequired: z.boolean(),
});

function formatChecklist(parsed: z.infer<typeof QaChecklistDraft>) {
  const checklist = parsed.testChecklist
    .map(
      (item, index) =>
        `${index + 1}. [${item.priority}] ${item.area}\n   Test: ${item.testCase}\n   Expected: ${item.expectedResult}`,
    )
    .join("\n\n");

  return [
    `Scope summary: ${parsed.scopeSummary}`,
    "",
    "Assumptions:",
    ...parsed.assumptions.map((item) => `- ${item}`),
    "",
    "Manual test checklist:",
    checklist,
    "",
    "Regression areas:",
    ...parsed.regressionAreas.map((item) => `- ${item}`),
    "",
    "Data setup:",
    ...parsed.dataSetup.map((item) => `- ${item}`),
    "",
    "Release risks:",
    ...parsed.releaseRisks.map((item) => `- ${item}`),
    "",
    "Status: draft only. Human QA review required before using as release evidence.",
  ].join("\n");
}

function formatBacklogPlan(parsed: z.infer<typeof ProductManagerDraft>) {
  const items = parsed.backlogItems
    .map(
      (item, index) =>
        [
          `${index + 1}. [${item.priority}/${item.effort}] ${item.title}`,
          `   Problem: ${item.problem}`,
          `   Suggested scope: ${item.suggestedScope}`,
          `   User value: ${item.userValue}`,
          "   Evidence:",
          ...item.evidence.map((evidence) => `   - ${evidence}`),
          `   Human decision needed: ${item.humanDecisionNeeded}`,
        ].join("\n"),
    )
    .join("\n\n");

  return [
    `Planning summary: ${parsed.planningSummary}`,
    "",
    "Draft backlog suggestions:",
    items,
    "",
    "Not in scope:",
    ...parsed.notInScope.map((item) => `- ${item}`),
    "",
    "Risks:",
    ...parsed.risks.map((item) => `- ${item}`),
    "",
    "Next questions:",
    ...parsed.nextQuestions.map((item) => `- ${item}`),
    "",
    "Status: draft only. Human product owner approval required before roadmap or sprint commitment.",
  ].join("\n");
}

function formatManagementReport(parsed: z.infer<typeof ManagementReportDraft>) {
  return [
    `Executive summary: ${parsed.executiveSummary}`,
    "",
    "Support summary:",
    ...parsed.supportSummary.map((item) => `- ${item}`),
    "",
    "Connector summary:",
    ...parsed.connectorSummary.map((item) => `- ${item}`),
    "",
    "AI operations summary:",
    ...parsed.aiOperationsSummary.map((item) => `- ${item}`),
    "",
    "Knowledge summary:",
    ...parsed.knowledgeSummary.map((item) => `- ${item}`),
    "",
    "QA and planning summary:",
    ...parsed.qaAndPlanningSummary.map((item) => `- ${item}`),
    "",
    "Risks:",
    ...parsed.risks.map((item) => `- ${item}`),
    "",
    "Recommended actions:",
    ...parsed.recommendedActions.map(
      (item) =>
        `- [${item.priority}] ${item.action} (Owner: ${item.owner}) - ${item.reason}`,
    ),
    "",
    "Open questions:",
    ...parsed.openQuestions.map((item) => `- ${item}`),
    "",
    "Status: draft only. Human owner/admin review required before sharing outside the owner/admin team.",
  ].join("\n");
}

function formatReleaseReadiness(parsed: z.infer<typeof ReleaseReadinessDraft>) {
  return [
    `Release summary: ${parsed.releaseSummary}`,
    `Readiness decision: ${parsed.readinessDecision}`,
    "",
    "Evidence reviewed:",
    ...parsed.evidenceReviewed.map((item) => `- ${item}`),
    "",
    "QA status:",
    ...parsed.qaStatus.map((item) => `- ${item}`),
    "",
    "Approval status:",
    ...parsed.approvalStatus.map((item) => `- ${item}`),
    "",
    "Support risk:",
    ...parsed.supportRisk.map((item) => `- ${item}`),
    "",
    "Knowledge readiness:",
    ...parsed.knowledgeReadiness.map((item) => `- ${item}`),
    "",
    "Blockers:",
    ...parsed.blockers.map((item) => `- ${item}`),
    "",
    "Required actions:",
    ...parsed.requiredActions.map(
      (item) =>
        `- [${item.priority}] ${item.action} (Owner: ${item.owner}) - ${item.reason}`,
    ),
    "",
    "Go/no-go questions:",
    ...parsed.goNoGoQuestions.map((item) => `- ${item}`),
    "",
    "Status: draft only. Human release owner approval is required before any release decision.",
  ].join("\n");
}

export async function generateQaChecklistDraft(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();
  const openai = getOpenAIClient();

  const productId = readString(formData, "productId");
  const featureScope = readString(formData, "featureScope");
  const notes = readString(formData, "notes");

  if (!productId || !featureScope) {
    throw new Error("Product and feature scope are required.");
  }

  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const [
    productResult,
    profileResult,
    recentTicketsResult,
    recentConversationsResult,
    agentResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, risk_level, first_ai_use_case")
      .eq("id", productId)
      .single<{
        id: string;
        name: string;
        slug: string;
        risk_level: string;
        first_ai_use_case: string | null;
      }>(),
    supabase
      .from("product_profiles")
      .select("support_categories, restricted_actions, escalation_rules, metadata_json")
      .eq("product_id", productId)
      .maybeSingle<{
        support_categories: string[];
        restricted_actions: string[];
        escalation_rules: string[];
        metadata_json: Record<string, unknown>;
      }>(),
    supabase
      .from("tickets")
      .select("category, status, priority, summary, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<
        Array<{
          category: string;
          status: string;
          priority: string;
          summary: string;
          created_at: string;
        }>
      >(),
    supabase
      .from("conversations")
      .select("subject, status, priority, last_message_preview, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<
        Array<{
          subject: string | null;
          status: string;
          priority: string;
          last_message_preview: string | null;
          created_at: string;
        }>
      >(),
    supabase
      .from("agents")
      .select("id")
      .eq("name", "QA Checklist Agent")
      .maybeSingle<{ id: string }>(),
  ]);

  if (productResult.error || !productResult.data) {
    throw new Error(productResult.error?.message ?? "Product not found.");
  }

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (recentTicketsResult.error) {
    throw new Error(recentTicketsResult.error.message);
  }

  if (recentConversationsResult.error) {
    throw new Error(recentConversationsResult.error.message);
  }

  const model = getOpenAIModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content:
          "You are Shadow Team's QA Checklist Agent. Generate draft manual QA checklists for human review. Do not approve releases, deploy software, change production data, or make final go/no-go decisions. Focus on practical manual test cases, regression areas, data setup, and release risks.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            product: productResult.data,
            productProfile: profileResult.data,
            featureScope,
            notes,
            recentTickets: recentTicketsResult.data ?? [],
            recentConversations: recentConversationsResult.data ?? [],
            outputRules: {
              title: "Short checklist title.",
              testChecklist:
                "Create concrete manual test cases with expected results and priorities.",
              humanApprovalRequired:
                "Always true. Human QA review is required before release evidence.",
            },
          },
          null,
          2,
        ),
      },
    ],
    text: {
      format: zodTextFormat(QaChecklistDraft, "qa_checklist_draft"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("QA Checklist Agent did not return a parsed checklist.");
  }

  const { data: agentRun, error: agentRunError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agentResult.data?.id ?? null,
      product_id: productId,
      input_json: {
        model,
        product_slug: productResult.data.slug,
        feature_scope: featureScope,
        notes,
        recent_ticket_count: recentTicketsResult.data?.length ?? 0,
        recent_conversation_count: recentConversationsResult.data?.length ?? 0,
      },
      output_json: parsed,
      confidence: parsed.confidence,
      risk_level: parsed.riskLevel,
      human_required: true,
      status: "completed",
    })
    .select("id")
    .single<{ id: string }>();

  if (agentRunError) {
    throw new Error(agentRunError.message);
  }

  const { data: source, error: sourceError } = await supabase
    .from("knowledge_sources")
    .insert({
      product_id: productId,
      source_type: "qa_checklist",
      source_title: parsed.title,
      source_path: null,
      status: "draft",
      version: "v0.1",
      metadata_json: {
        created_from: "qa_checklist_agent",
        agent_run_id: agentRun.id,
        feature_scope: featureScope,
        human_approval_required: parsed.humanApprovalRequired,
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const { error: chunkError } = await supabase.from("knowledge_chunks").insert({
    source_id: source.id,
    chunk_text: formatChecklist(parsed),
    metadata_json: {
      chunk_type: "qa_checklist_agent_draft",
      agent_run_id: agentRun.id,
    },
  });

  if (chunkError) {
    throw new Error(chunkError.message);
  }

  await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRun.id,
    tool_name: "create_draft_qa_checklist",
    input_json: {
      product_id: productId,
      feature_scope: featureScope,
    },
    output_json: {
      knowledge_source_id: source.id,
      title: parsed.title,
      test_case_count: parsed.testChecklist.length,
      status: "draft",
    },
    status: "completed",
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "ai",
    event_type: "qa_checklist_draft_created",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      risk_level: parsed.riskLevel,
      confidence: parsed.confidence,
      test_case_count: parsed.testChecklist.length,
    },
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "qa_checklist_requested",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      feature_scope: featureScope,
    },
  });

  revalidatePath("/agents");
  revalidatePath("/knowledge");
}

export async function generateProductManagerDraft(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();
  const openai = getOpenAIClient();

  const productId = readString(formData, "productId");
  const planningFocus = readString(formData, "planningFocus");
  const notes = readString(formData, "notes");

  if (!productId || !planningFocus) {
    throw new Error("Product and planning focus are required.");
  }

  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const [
    productResult,
    profileResult,
    recentTicketsResult,
    recentConversationsResult,
    recentKnowledgeResult,
    recentRunsResult,
    agentResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, risk_level, first_ai_use_case")
      .eq("id", productId)
      .single<{
        id: string;
        name: string;
        slug: string;
        risk_level: string;
        first_ai_use_case: string | null;
      }>(),
    supabase
      .from("product_profiles")
      .select(
        "target_users, support_categories, restricted_actions, escalation_rules, metadata_json",
      )
      .eq("product_id", productId)
      .maybeSingle<{
        target_users: string[];
        support_categories: string[];
        restricted_actions: string[];
        escalation_rules: string[];
        metadata_json: Record<string, unknown>;
      }>(),
    supabase
      .from("tickets")
      .select("category, status, priority, summary, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(12)
      .returns<
        Array<{
          category: string;
          status: string;
          priority: string;
          summary: string;
          created_at: string;
        }>
      >(),
    supabase
      .from("conversations")
      .select("subject, status, priority, last_message_preview, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(12)
      .returns<
        Array<{
          subject: string | null;
          status: string;
          priority: string;
          last_message_preview: string | null;
          created_at: string;
        }>
      >(),
    supabase
      .from("knowledge_sources")
      .select("source_type, source_title, status, metadata_json, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(12)
      .returns<
        Array<{
          source_type: string;
          source_title: string;
          status: string;
          metadata_json: Record<string, unknown>;
          created_at: string;
        }>
      >(),
    supabase
      .from("agent_runs")
      .select("risk_level, confidence, human_required, output_json, created_at, agents(name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<
        Array<{
          risk_level: string;
          confidence: number | null;
          human_required: boolean;
          output_json: Record<string, unknown>;
          created_at: string;
          agents: { name: string } | null;
        }>
      >(),
    supabase
      .from("agents")
      .select("id")
      .eq("name", "Product Manager Agent")
      .maybeSingle<{ id: string }>(),
  ]);

  if (productResult.error || !productResult.data) {
    throw new Error(productResult.error?.message ?? "Product not found.");
  }

  for (const result of [
    profileResult,
    recentTicketsResult,
    recentConversationsResult,
    recentKnowledgeResult,
    recentRunsResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const model = getOpenAIModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content:
          "You are Shadow Team's Product Manager Agent. Create draft backlog suggestions from support, QA, knowledge, and agent-run signals. Do not commit roadmap, assign deadlines, promise features, or make final scope decisions. Every output is a draft for human product-owner review.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            product: productResult.data,
            productProfile: profileResult.data,
            planningFocus,
            notes,
            recentTickets: recentTicketsResult.data ?? [],
            recentConversations: recentConversationsResult.data ?? [],
            recentKnowledge: recentKnowledgeResult.data ?? [],
            recentAgentRuns: recentRunsResult.data ?? [],
            outputRules: {
              backlogItems:
                "Create practical backlog suggestions with problem, scope, user value, evidence, priority, effort, and human decision needed.",
              notInScope:
                "Include work that should not be included yet to avoid premature scope creep.",
              humanApprovalRequired: "Always true.",
            },
          },
          null,
          2,
        ),
      },
    ],
    text: {
      format: zodTextFormat(ProductManagerDraft, "product_manager_draft"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("Product Manager Agent did not return a parsed plan.");
  }

  const { data: agentRun, error: agentRunError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agentResult.data?.id ?? null,
      product_id: productId,
      input_json: {
        model,
        product_slug: productResult.data.slug,
        planning_focus: planningFocus,
        notes,
        recent_ticket_count: recentTicketsResult.data?.length ?? 0,
        recent_conversation_count: recentConversationsResult.data?.length ?? 0,
        recent_knowledge_count: recentKnowledgeResult.data?.length ?? 0,
        recent_agent_run_count: recentRunsResult.data?.length ?? 0,
      },
      output_json: parsed,
      confidence: parsed.confidence,
      risk_level: parsed.riskLevel,
      human_required: true,
      status: "completed",
    })
    .select("id")
    .single<{ id: string }>();

  if (agentRunError) {
    throw new Error(agentRunError.message);
  }

  const { data: source, error: sourceError } = await supabase
    .from("knowledge_sources")
    .insert({
      product_id: productId,
      source_type: "backlog_suggestion",
      source_title: parsed.title,
      source_path: null,
      status: "draft",
      version: "v0.1",
      metadata_json: {
        created_from: "product_manager_agent",
        agent_run_id: agentRun.id,
        planning_focus: planningFocus,
        human_approval_required: parsed.humanApprovalRequired,
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const { error: chunkError } = await supabase.from("knowledge_chunks").insert({
    source_id: source.id,
    chunk_text: formatBacklogPlan(parsed),
    metadata_json: {
      chunk_type: "product_manager_agent_draft",
      agent_run_id: agentRun.id,
    },
  });

  if (chunkError) {
    throw new Error(chunkError.message);
  }

  await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRun.id,
    tool_name: "create_draft_backlog_suggestions",
    input_json: {
      product_id: productId,
      planning_focus: planningFocus,
    },
    output_json: {
      knowledge_source_id: source.id,
      title: parsed.title,
      backlog_item_count: parsed.backlogItems.length,
      status: "draft",
    },
    status: "completed",
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "ai",
    event_type: "product_manager_draft_created",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      risk_level: parsed.riskLevel,
      confidence: parsed.confidence,
      backlog_item_count: parsed.backlogItems.length,
    },
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "product_manager_requested",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      planning_focus: planningFocus,
    },
  });

  revalidatePath("/agents");
  revalidatePath("/knowledge");
}

export async function generateManagementReportDraft(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();
  const openai = getOpenAIClient();

  const productId = readString(formData, "productId") || null;
  const reportFocus = readString(formData, "reportFocus") || "weekly owner brief";
  const period = readString(formData, "period") || "last 7 days";
  const notes = readString(formData, "notes");

  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const [
    productResult,
    productsResult,
    conversationsResult,
    ticketsResult,
    messagesResult,
    knowledgeResult,
    agentRunsResult,
    agentResult,
  ] = await Promise.all([
    productId
      ? supabase
          .from("products")
          .select("id, name, slug, risk_level, first_ai_use_case")
          .eq("id", productId)
          .single<{
            id: string;
            name: string;
            slug: string;
            risk_level: string;
            first_ai_use_case: string | null;
          }>()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("products")
      .select("id, name, slug, risk_level, first_ai_use_case")
      .order("priority", { ascending: true })
      .returns<
        Array<{
          id: string;
          name: string;
          slug: string;
          risk_level: string;
          first_ai_use_case: string | null;
        }>
      >(),
    supabase
      .from("conversations")
      .select("product_id, status, priority, ai_status, subject, last_message_preview, created_at, products(slug)")
      .match(productId ? { product_id: productId } : {})
      .order("created_at", { ascending: false })
      .limit(40)
      .returns<
        Array<{
          product_id: string | null;
          status: string;
          priority: string;
          ai_status: string;
          subject: string | null;
          last_message_preview: string | null;
          created_at: string;
          products: { slug: string } | null;
        }>
      >(),
    supabase
      .from("tickets")
      .select("product_id, category, status, priority, summary, created_at, products(slug)")
      .match(productId ? { product_id: productId } : {})
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<
        Array<{
          product_id: string | null;
          category: string;
          status: string;
          priority: string;
          summary: string;
          created_at: string;
          products: { slug: string } | null;
        }>
      >(),
    supabase
      .from("messages")
      .select("sender_type, visibility, metadata_json, created_at")
      .order("created_at", { ascending: false })
      .limit(80)
      .returns<
        Array<{
          sender_type: string;
          visibility: string;
          metadata_json: Record<string, unknown>;
          created_at: string;
        }>
      >(),
    supabase
      .from("knowledge_sources")
      .select("product_id, source_type, source_title, status, metadata_json, created_at, products(slug)")
      .match(productId ? { product_id: productId } : {})
      .order("created_at", { ascending: false })
      .limit(40)
      .returns<
        Array<{
          product_id: string | null;
          source_type: string;
          source_title: string;
          status: string;
          metadata_json: Record<string, unknown>;
          created_at: string;
          products: { slug: string } | null;
        }>
      >(),
    supabase
      .from("agent_runs")
      .select("product_id, confidence, risk_level, human_required, status, output_json, created_at, agents(name), products(slug)")
      .match(productId ? { product_id: productId } : {})
      .order("created_at", { ascending: false })
      .limit(40)
      .returns<
        Array<{
          product_id: string | null;
          confidence: number | null;
          risk_level: string;
          human_required: boolean;
          status: string;
          output_json: Record<string, unknown>;
          created_at: string;
          agents: { name: string } | null;
          products: { slug: string } | null;
        }>
      >(),
    supabase
      .from("agents")
      .select("id")
      .eq("name", "Management Report Agent")
      .maybeSingle<{ id: string }>(),
  ]);

  for (const result of [
    productResult,
    productsResult,
    conversationsResult,
    ticketsResult,
    messagesResult,
    knowledgeResult,
    agentRunsResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const messages = messagesResult.data ?? [];
  const knowledge = knowledgeResult.data ?? [];
  const agentRuns = agentRunsResult.data ?? [];
  const deliveryCounts = {
    pending: messages.filter(
      (message) => message.metadata_json?.delivery_status === "pending",
    ).length,
    delivered: messages.filter(
      (message) => message.metadata_json?.delivery_status === "delivered",
    ).length,
    failed: messages.filter(
      (message) => message.metadata_json?.delivery_status === "failed",
    ).length,
  };
  const knowledgeTypeCounts = knowledge.reduce<Record<string, number>>(
    (acc, source) => {
      acc[source.source_type] = (acc[source.source_type] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const agentRunCounts = agentRuns.reduce<Record<string, number>>((acc, run) => {
    const name = run.agents?.name ?? "Unknown agent";
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const model = getOpenAIModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content:
          "You are Shadow Team's Management Report Agent. Create concise owner/admin operating briefs from system signals. Do not make financial, legal, product, release, hiring, pricing, refund, certification, or roadmap decisions. Recommend actions for human review only.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            reportFocus,
            period,
            notes,
            selectedProduct: productResult.data,
            products: productsResult.data ?? [],
            conversations: conversationsResult.data ?? [],
            tickets: ticketsResult.data ?? [],
            deliveryCounts,
            knowledgeSources: knowledge,
            knowledgeTypeCounts,
            agentRuns,
            agentRunCounts,
            outputRules: {
              executiveSummary:
                "Write a short, practical owner/admin summary.",
              recommendedActions:
                "Every action must have owner, priority, and reason. No final decisions.",
              humanApprovalRequired: "Always true.",
            },
          },
          null,
          2,
        ),
      },
    ],
    text: {
      format: zodTextFormat(ManagementReportDraft, "management_report_draft"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("Management Report Agent did not return a parsed report.");
  }

  const { data: agentRun, error: agentRunError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agentResult.data?.id ?? null,
      product_id: productId,
      input_json: {
        model,
        report_focus: reportFocus,
        period,
        selected_product_slug: productResult.data?.slug ?? null,
        conversation_count: conversationsResult.data?.length ?? 0,
        ticket_count: ticketsResult.data?.length ?? 0,
        knowledge_count: knowledge.length,
        agent_run_count: agentRuns.length,
      },
      output_json: parsed,
      confidence: parsed.confidence,
      risk_level: parsed.riskLevel,
      human_required: true,
      status: "completed",
    })
    .select("id")
    .single<{ id: string }>();

  if (agentRunError) {
    throw new Error(agentRunError.message);
  }

  const { data: source, error: sourceError } = await supabase
    .from("knowledge_sources")
    .insert({
      product_id: productId,
      source_type: "management_report",
      source_title: parsed.title,
      source_path: null,
      status: "draft",
      version: "v0.1",
      metadata_json: {
        created_from: "management_report_agent",
        agent_run_id: agentRun.id,
        report_focus: reportFocus,
        period,
        human_approval_required: parsed.humanApprovalRequired,
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const { error: chunkError } = await supabase.from("knowledge_chunks").insert({
    source_id: source.id,
    chunk_text: formatManagementReport(parsed),
    metadata_json: {
      chunk_type: "management_report_agent_draft",
      agent_run_id: agentRun.id,
    },
  });

  if (chunkError) {
    throw new Error(chunkError.message);
  }

  await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRun.id,
    tool_name: "create_draft_management_report",
    input_json: {
      product_id: productId,
      report_focus: reportFocus,
      period,
    },
    output_json: {
      knowledge_source_id: source.id,
      title: parsed.title,
      recommended_action_count: parsed.recommendedActions.length,
      status: "draft",
    },
    status: "completed",
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "ai",
    event_type: "management_report_draft_created",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      risk_level: parsed.riskLevel,
      confidence: parsed.confidence,
      recommended_action_count: parsed.recommendedActions.length,
    },
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "management_report_requested",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      report_focus: reportFocus,
      period,
    },
  });

  revalidatePath("/agents");
  revalidatePath("/analytics");
  revalidatePath("/knowledge");
}

export async function generateReleaseReadinessDraft(formData: FormData) {
  const { supabase, userId } = await getSignedInUserId();
  const openai = getOpenAIClient();

  const productId = readString(formData, "productId");
  const releaseScope = readString(formData, "releaseScope");
  const notes = readString(formData, "notes");

  if (!productId || !releaseScope) {
    throw new Error("Product and release scope are required.");
  }

  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const [
    productResult,
    conversationsResult,
    ticketsResult,
    knowledgeResult,
    agentRunsResult,
    agentResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, risk_level, first_ai_use_case")
      .eq("id", productId)
      .single<{
        id: string;
        name: string;
        slug: string;
        risk_level: string;
        first_ai_use_case: string | null;
      }>(),
    supabase
      .from("conversations")
      .select("status, priority, ai_status, subject, last_message_preview, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<
        Array<{
          status: string;
          priority: string;
          ai_status: string;
          subject: string | null;
          last_message_preview: string | null;
          created_at: string;
        }>
      >(),
    supabase
      .from("tickets")
      .select("category, status, priority, summary, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<
        Array<{
          category: string;
          status: string;
          priority: string;
          summary: string;
          created_at: string;
        }>
      >(),
    supabase
      .from("knowledge_sources")
      .select("source_type, source_title, status, metadata_json, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(40)
      .returns<
        Array<{
          source_type: string;
          source_title: string;
          status: string;
          metadata_json: Record<string, unknown>;
          created_at: string;
        }>
      >(),
    supabase
      .from("agent_runs")
      .select("confidence, risk_level, human_required, status, output_json, created_at, agents(name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(25)
      .returns<
        Array<{
          confidence: number | null;
          risk_level: string;
          human_required: boolean;
          status: string;
          output_json: Record<string, unknown>;
          created_at: string;
          agents: { name: string } | null;
        }>
      >(),
    supabase
      .from("agents")
      .select("id")
      .eq("name", "Release Readiness Agent")
      .maybeSingle<{ id: string }>(),
  ]);

  for (const result of [
    productResult,
    conversationsResult,
    ticketsResult,
    knowledgeResult,
    agentRunsResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  if (!productResult.data) {
    throw new Error("Product not found.");
  }

  const knowledge = knowledgeResult.data ?? [];
  const readinessContext = {
    approvedQaChecklists: knowledge.filter(
      (source) => source.source_type === "qa_checklist" && source.status === "approved",
    ),
    draftQaChecklists: knowledge.filter(
      (source) => source.source_type === "qa_checklist" && source.status === "draft",
    ),
    approvedKnowledge: knowledge.filter((source) => source.status === "approved"),
    pendingApprovals: knowledge.filter((source) => source.status === "draft"),
    rejectedOrArchived: knowledge.filter((source) => source.status === "archived"),
    backlogSuggestions: knowledge.filter(
      (source) => source.source_type === "backlog_suggestion",
    ),
  };
  const model = getOpenAIModel();

  const response = await openai.responses.parse({
    model,
    input: [
      {
        role: "system",
        content:
          "You are Shadow Team's Release Readiness Agent. Draft release readiness reports from QA, approvals, support risk, knowledge, backlog, and AI activity. Do not approve releases, deploy software, make go/no-go decisions, or override human owners. If evidence is missing, mark blocked or not ready.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            product: productResult.data,
            releaseScope,
            notes,
            conversations: conversationsResult.data ?? [],
            tickets: ticketsResult.data ?? [],
            knowledgeSources: knowledge,
            readinessContext,
            agentRuns: agentRunsResult.data ?? [],
            outputRules: {
              readinessDecision:
                "Use ready_for_human_review only when evidence is strong and no major blockers are visible.",
              blockers:
                "List blockers clearly. If none, say what was checked and why no blocker is visible.",
              humanApprovalRequired: "Always true.",
            },
          },
          null,
          2,
        ),
      },
    ],
    text: {
      format: zodTextFormat(ReleaseReadinessDraft, "release_readiness_draft"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("Release Readiness Agent did not return a parsed report.");
  }

  const { data: agentRun, error: agentRunError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agentResult.data?.id ?? null,
      product_id: productId,
      input_json: {
        model,
        product_slug: productResult.data.slug,
        release_scope: releaseScope,
        notes,
        conversation_count: conversationsResult.data?.length ?? 0,
        ticket_count: ticketsResult.data?.length ?? 0,
        knowledge_count: knowledge.length,
        agent_run_count: agentRunsResult.data?.length ?? 0,
      },
      output_json: parsed,
      confidence: parsed.confidence,
      risk_level: parsed.riskLevel,
      human_required: true,
      status: "completed",
    })
    .select("id")
    .single<{ id: string }>();

  if (agentRunError) {
    throw new Error(agentRunError.message);
  }

  const { data: source, error: sourceError } = await supabase
    .from("knowledge_sources")
    .insert({
      product_id: productId,
      source_type: "release_readiness",
      source_title: parsed.title,
      source_path: null,
      status: "draft",
      version: "v0.1",
      metadata_json: {
        created_from: "release_readiness_agent",
        agent_run_id: agentRun.id,
        release_scope: releaseScope,
        readiness_decision: parsed.readinessDecision,
        human_approval_required: parsed.humanApprovalRequired,
      },
    })
    .select("id")
    .single<{ id: string }>();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const { error: chunkError } = await supabase.from("knowledge_chunks").insert({
    source_id: source.id,
    chunk_text: formatReleaseReadiness(parsed),
    metadata_json: {
      chunk_type: "release_readiness_agent_draft",
      agent_run_id: agentRun.id,
    },
  });

  if (chunkError) {
    throw new Error(chunkError.message);
  }

  await supabase.from("agent_tool_calls").insert({
    agent_run_id: agentRun.id,
    tool_name: "create_draft_release_readiness_report",
    input_json: {
      product_id: productId,
      release_scope: releaseScope,
    },
    output_json: {
      knowledge_source_id: source.id,
      title: parsed.title,
      readiness_decision: parsed.readinessDecision,
      status: "draft",
    },
    status: "completed",
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "ai",
    event_type: "release_readiness_draft_created",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      risk_level: parsed.riskLevel,
      confidence: parsed.confidence,
      readiness_decision: parsed.readinessDecision,
    },
  });

  await supabase.from("audit_events").insert({
    product_id: productId,
    actor_type: "human",
    actor_id: userId,
    event_type: "release_readiness_requested",
    entity_type: "knowledge_source",
    entity_id: source.id,
    metadata_json: {
      agent_run_id: agentRun.id,
      release_scope: releaseScope,
    },
  });

  revalidatePath("/agents");
  revalidatePath("/knowledge");
  revalidatePath("/approvals");
}
