import { ToolLoopAgent, tool, createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import {
  extractTextFromDocx,
  fileToBuffer,
  isDocxFile,
} from "@/lib/document-processor";

const salesAgent = new ToolLoopAgent({
  model: openai("gpt-4o"),
  instructions:
    "You are an AI agent specialized in proposals and sales. Help users create business proposals, respond to potential customer inquiries, and close sales effectively. You can analyze images and documents (including DOCX files) that users share. Important: Answer in the language the customer uses.",
  tools: {
    calculateDiscount: tool({
      description: "Calculate a discount for a given price and percentage",
      inputSchema: z.object({
        price: z.number().describe("The original price"),
        discountPercent: z
          .number()
          .describe("The discount percentage (e.g., 10 for 10%)"),
      }),
      execute: async ({ price, discountPercent }) => {
        const discount = price * (discountPercent / 100);
        const finalPrice = price - discount;
        return {
          originalPrice: price,
          discountPercent,
          discountAmount: discount,
          finalPrice,
        };
      },
    }),
    generateProposalOutline: tool({
      description: "Generate a proposal outline based on client needs",
      inputSchema: z.object({
        clientName: z.string().describe("The name of the client"),
        projectType: z.string().describe("The type of project or service"),
        budget: z.number().optional().describe("The client budget if known"),
      }),
      execute: async ({ clientName, projectType, budget }) => {
        return {
          clientName,
          projectType,
          budget: budget ?? "To be discussed",
          sections: [
            "Executive Summary",
            "Project Scope",
            "Timeline",
            "Deliverables",
            "Pricing",
            "Terms & Conditions",
          ],
        };
      },
    }),
  },
});

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

  return createAgentUIStreamResponse({
    agent: salesAgent,
    uiMessages: processedMessages,
  });
}
