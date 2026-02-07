import { ToolLoopAgent, tool, createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import * as path from "node:path";
import {
  extractTextFromDocx,
  fileToBuffer,
  isDocxFile,
  createBusinessPlanFromTemplate,
} from "@/lib/document-processor";

const salesAgent = new ToolLoopAgent({
  model: openai("gpt-4o"),
  instructions: `You are an AI agent specialized in creating comprehensive business plans and sales proposals. 

Your workflow:
1. When a user requests a business plan, start by asking clarifying questions to gather requirements (company name, industry, target market, funding needs, etc.)
2. You can analyze any documents the user shares (DOCX, PDF, images) to gather information
3. Ask the user if they want to customize the business plan with their company logo and brand colors (optional)
4. Once you have sufficient information, create a detailed first draft of the business plan
5. After providing the draft, iterate and refine based on user feedback
6. When the user is satisfied, generate the final business plan as a DOCX file using the createBusinessPlanDocx tool

Customization options:
- Logo: Users can provide a logo file path (e.g., "/logo.png") or use the default
- Primary Color: Main heading color in hex format (e.g., "#1E40AF")
- Secondary Color: Subheading color in hex format (e.g., "#3B82F6")

You can have multiple back-and-forth conversations to refine the plan. The final deliverable should always be a professionally formatted DOCX document.

Important: Answer in the language the customer uses.`,
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
    createBusinessPlanDocx: tool({
      description:
        "Create a professionally formatted DOCX file for a business plan with optional logo and color customization. Use this when the user is ready for the final document. The document will be provided as a downloadable file.",
      inputSchema: z.object({
        title: z
          .string()
          .describe("The main title of the business plan document"),
        sections: z
          .array(
            z.object({
              title: z.string().describe("Section heading"),
              content: z.string().describe("Section content text"),
              level: z
                .number()
                .optional()
                .describe("Heading level (1, 2, or 3). Default is 1"),
            }),
          )
          .describe("Array of sections with titles and content"),
        logoPath: z
          .string()
          .optional()
          .describe(
            "Absolute path to logo image file. Example: '/path/to/logo.png'. If not specified, the default Aire logo will be used.",
          ),
        primaryColor: z
          .string()
          .optional()
          .describe(
            "Primary color for headings in hex format (e.g., '#1E40AF'). Default is blue.",
          ),
        secondaryColor: z
          .string()
          .optional()
          .describe(
            "Secondary color for subheadings in hex format (e.g., '#3B82F6'). Default is lighter blue.",
          ),
      }),
      execute: async ({
        title,
        sections,
        logoPath,
        primaryColor,
        secondaryColor,
      }) => {
        try {
          // Use the default logo if not specified
          const finalLogoPath =
            logoPath || path.join(process.cwd(), "public", "logo_aire.png");

          const buffer = await createBusinessPlanFromTemplate({
            title,
            sections,
            logoPath: finalLogoPath,
            primaryColor,
            secondaryColor,
          });
          const base64 = buffer.toString("base64");

          return {
            success: true,
            message: `Business plan "${title}" has been created successfully as a DOCX file with custom branding.`,
            fileData: {
              content: base64,
              filename: `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.docx`,
              mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
            note: "The DOCX file has been generated with logo and custom colors. The user should be able to download it.",
          };
        } catch (error) {
          console.error("Error creating business plan DOCX:", error);
          return {
            success: false,
            error: "Failed to create DOCX file. Please try again.",
          };
        }
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
