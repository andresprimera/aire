import { ToolLoopAgent, createAgentUIStreamResponse } from "ai";
import { openai } from "@ai-sdk/openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAgentInstructionsWithComplement } from "@/lib/agent-utils";

const BASE_BUSINESS_INSTRUCTIONS =
  "You are an AI agent specialized in writing business plans. Help users draft, refine, and structure business plans. Start by asking clarifying questions to understand their business idea, target market, and goals. Then, guide them through creating sections like Executive Summary, Company Description, Market Analysis, and Financial Projections.";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { messages } = await request.json();

  // Get agent instructions with user-specific prompt complement
  const instructions = await getAgentInstructionsWithComplement(
    BASE_BUSINESS_INSTRUCTIONS,
    "business",
  );

  // Create agent with user-specific instructions
  const businessAgent = new ToolLoopAgent({
    model: openai("gpt-4.1-nano"),
    instructions,
    tools: {},
  });

  return createAgentUIStreamResponse({
    agent: businessAgent,
    uiMessages: messages,
  });
}
