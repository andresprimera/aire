import { ToolLoopAgent, createAgentUIStreamResponse } from "ai";
import { openai } from "@ai-sdk/openai";
import { getAgentInstructionsWithComplement } from "@/lib/agent-utils";

const BASE_SALES_INSTRUCTIONS =
  "You are a sales assistant demo. You can answer basic questions about sales strategies, but you do not have access to advanced tools or business plan generation capabilities yet.";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const instructions = await getAgentInstructionsWithComplement(
    BASE_SALES_INSTRUCTIONS,
    "sales",
  );

  const salesAgent = new ToolLoopAgent({
    model: openai("gpt-4.1-nano"),
    instructions,
    tools: {},
  });

  return createAgentUIStreamResponse({
    agent: salesAgent,
    uiMessages: messages,
  });
}
