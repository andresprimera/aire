import { ToolLoopAgent, createAgentUIStreamResponse } from "ai";
import { openai } from "@ai-sdk/openai";

const businessAgent = new ToolLoopAgent({
  model: openai("gpt-4.1-nano"),
  instructions:
    "You are an AI agent specialized in writing business plans. Help users draft, refine, and structure business plans. Start by asking clarifying questions to understand their business idea, target market, and goals. Then, guide them through creating sections like Executive Summary, Company Description, Market Analysis, and Financial Projections.",
  tools: {},
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  return createAgentUIStreamResponse({
    agent: businessAgent,
    uiMessages: messages,
  });
}
