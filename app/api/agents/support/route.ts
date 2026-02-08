import { ToolLoopAgent, tool, createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import {
  extractTextFromDocx,
  fileToBuffer,
  isDocxFile,
} from "@/lib/document-processor";
import { getAgentInstructionsWithComplement } from "@/lib/agent-utils";

const BASE_SUPPORT_INSTRUCTIONS =
  "You are an AI agent for post-sales support. Help customers with inquiries about purchased products, problem resolution, order tracking, and any assistance needed after a purchase. You can analyze images and documents (including DOCX files) that users share. Important: Answer in the language the customer uses.";

const supportTools = {
  lookupOrder: tool({
    description: "Look up an order by order ID",
    inputSchema: z.object({
      orderId: z.string().describe("The order ID to look up"),
    }),
    execute: async ({ orderId }) => {
      // Simulated order lookup
      return {
        orderId,
        status: "Shipped",
        estimatedDelivery: "2025-02-05",
        trackingNumber: "1Z999AA10123456784",
        items: ["Product A", "Product B"],
      };
    },
  }),
  createTicket: tool({
    description: "Create a support ticket for an issue",
    inputSchema: z.object({
      subject: z.string().describe("The subject of the ticket"),
      description: z.string().describe("Detailed description of the issue"),
      priority: z
        .enum(["low", "medium", "high"])
        .describe("Priority level of the ticket"),
    }),
    execute: async ({ subject, description, priority }) => {
      const ticketId = `TKT-${Date.now()}`;
      return {
        ticketId,
        subject,
        description,
        priority,
        status: "Open",
        createdAt: new Date().toISOString(),
      };
    },
  }),
  checkWarranty: tool({
    description: "Check warranty status for a product",
    inputSchema: z.object({
      productId: z.string().describe("The product ID or serial number"),
    }),
    execute: async ({ productId }) => {
      // Simulated warranty check
      return {
        productId,
        warrantyStatus: "Active",
        expirationDate: "2026-01-31",
        coverageType: "Full Coverage",
      };
    },
  }),
};

/**
 * Process DOCX files in messages by extracting text content
 */
async function processDocxInMessages(messages: any[]): Promise<any[]> {
  return Promise.all(
    messages.map(async (msg) => {
      if (!msg.parts) return msg;

      const processedParts = await Promise.all(
        msg.parts.map(async (part: any) => {
          // Check if this is a DOCX file
          if (
            part.type === "file" &&
            part.mimeType &&
            isDocxFile(part.mimeType)
          ) {
            try {
              // Extract text from DOCX
              const buffer = await fileToBuffer(part.file);
              const text = await extractTextFromDocx(buffer);

              // Replace file part with text part containing extracted content
              return {
                type: "text",
                text: `[DOCX Document: ${part.name || "document.docx"}]\n\n${text}`,
              };
            } catch (error) {
              console.error("Error processing DOCX file:", error);
              // Return error message as text
              return {
                type: "text",
                text: `[Error: Could not process DOCX file "${part.name || "document.docx"}"]`,
              };
            }
          }
          return part;
        }),
      );

      return { ...msg, parts: processedParts };
    }),
  );
}

export async function POST(request: Request) {
  const { messages } = await request.json();

  // Process DOCX files before sending to agent
  const processedMessages = await processDocxInMessages(messages);

  // Get agent instructions with user-specific prompt complement
  const instructions = await getAgentInstructionsWithComplement(
    BASE_SUPPORT_INSTRUCTIONS,
    "support",
  );

  // Create agent with user-specific instructions
  const supportAgent = new ToolLoopAgent({
    model: openai("gpt-4o"),
    instructions,
    tools: supportTools,
  });

  return createAgentUIStreamResponse({
    agent: supportAgent,
    uiMessages: processedMessages,
  });
}
