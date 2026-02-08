import { ToolLoopAgent, tool, createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import * as path from "node:path";
import * as fs from "node:fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User, { IUser } from "@/lib/models/user";
import GeneratedFile from "@/lib/models/generated-file";
import {
  extractTextFromDocx,
  fileToBuffer,
  isDocxFile,
  createBusinessPlanFromTemplate,
} from "@/lib/document-processor";
import { getAgentInstructionsWithComplement } from "@/lib/agent-utils";

const BASE_BUSINESS_INSTRUCTIONS = `You are an AI agent specialized in creating comprehensive business plans and sales proposals.

Your workflow:
1. When a user requests a business plan, start by asking clarifying questions to gather requirements (company name, industry, target market, funding needs, etc.)
2. Analyze any documents the user shares (DOCX, PDF, images) to gather information
3. **IMPORTANT - Branding Extraction**: Actively look for and extract branding information from any provided documents:
   - Company logo (extract as base64 if present in images)
   - Brand colors (look for color specifications, hex codes in style guides, or dominant colors)
   - If you find branding information, use the saveBranding tool to store it for future use
4. **Check for Stored Branding**: Use the getBranding tool at the start to check if the user already has stored branding information
5. Once you have sufficient information, create a detailed first draft of the business plan
6. After providing the draft, iterate and refine based on user feedback
7. When the user is satisfied, generate the final business plan as a DOCX file using the createBusinessPlanDocx tool
   - The tool will automatically use stored branding if available
   - If branding info is missing when generating the first draft, ask the user to confirm or provide it

**Branding Storage**: Once branding information (logo, colors) is saved, it will be automatically used for all future business plans. Only ask the user for confirmation if no stored branding exists.

You can have multiple back-and-forth conversations to refine the plan. The final deliverable should always be a professionally formatted DOCX document.

Important: Answer in the language the customer uses.`;

// Define tools separately so they can be reused
const businessTools = {
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
  getBranding: tool({
    description:
      "Get the user's stored branding information (logo and colors). Call this at the start of business plan creation to check if branding info is already saved.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return {
            success: false,
            message: "No user session found",
          };
        }

        await connectDB();
        const user = await User.findById(session.user.id);

        if (!user) {
          return {
            success: false,
            message: "User not found",
          };
        }

        return {
          success: true,
          hasBranding: !!(
            user.logo ||
            user.primaryColor ||
            user.secondaryColor
          ),
          logo: user.logo || null,
          primaryColor: user.primaryColor || null,
          secondaryColor: user.secondaryColor || null,
        };
      } catch (error) {
        console.error("Error retrieving branding:", error);
        return {
          success: false,
          message: "Failed to retrieve branding information",
        };
      }
    },
  }),
  saveBranding: tool({
    description:
      "Save the user's branding information (logo as base64 string and colors) for future use. This should be called when you extract branding from documents or when the user provides it.",
    inputSchema: z.object({
      logo: z
        .string()
        .optional()
        .describe("Base64 encoded logo image (without data:image prefix)"),
      primaryColor: z
        .string()
        .optional()
        .describe("Primary brand color in hex format (e.g., '#1E40AF')"),
      secondaryColor: z
        .string()
        .optional()
        .describe("Secondary brand color in hex format (e.g., '#3B82F6')"),
    }),
    execute: async ({ logo, primaryColor, secondaryColor }) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return {
            success: false,
            message: "No user session found",
          };
        }

        await connectDB();
        const updateData: Partial<
          Pick<IUser, "logo" | "primaryColor" | "secondaryColor">
        > = {};
        if (logo) updateData.logo = logo;
        if (primaryColor) updateData.primaryColor = primaryColor;
        if (secondaryColor) updateData.secondaryColor = secondaryColor;

        const user = await User.findByIdAndUpdate(
          session.user.id,
          { $set: updateData },
          { new: true },
        );

        if (!user) {
          return {
            success: false,
            message: "User not found",
          };
        }

        return {
          success: true,
          message: "Branding information saved successfully",
          saved: {
            logo: !!logo,
            primaryColor: !!primaryColor,
            secondaryColor: !!secondaryColor,
          },
        };
      } catch (error) {
        console.error("Error saving branding:", error);
        return {
          success: false,
          message: "Failed to save branding information",
        };
      }
    },
  }),
  createBusinessPlanDocx: tool({
    description:
      "Create a professionally formatted DOCX file for a business plan. Automatically uses stored user branding (logo and colors) if available. Use this when the user is ready for the final document. The document will be provided as a downloadable file.",
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
      primaryColor: z
        .string()
        .optional()
        .describe(
          "Optional override: Primary color for headings in hex format (e.g., '#1E40AF'). If not specified, will use stored user color or default blue.",
        ),
      secondaryColor: z
        .string()
        .optional()
        .describe(
          "Optional override: Secondary color for subheadings in hex format (e.g., '#3B82F6'). If not specified, will use stored user color or default lighter blue.",
        ),
    }),
    execute: async ({ title, sections, primaryColor, secondaryColor }) => {
      try {
        // Get stored branding if available
        const session = await getServerSession(authOptions);
        let storedLogo = null;
        let storedPrimaryColor = null;
        let storedSecondaryColor = null;

        if (session?.user?.id) {
          await connectDB();
          const user = await User.findById(session.user.id);
          if (user) {
            storedLogo = user.logo;
            storedPrimaryColor = user.primaryColor;
            storedSecondaryColor = user.secondaryColor;
          }
        }

        // Use stored branding as fallback, then defaults
        const finalPrimaryColor = primaryColor || storedPrimaryColor;
        const finalSecondaryColor = secondaryColor || storedSecondaryColor;

        // Handle logo: use stored base64, or load default logo as base64
        let finalLogoData = storedLogo;

        if (!finalLogoData) {
          // Load default logo and convert to base64
          try {
            const defaultLogoPath = path.join(
              process.cwd(),
              "public",
              "logo_aire.png",
            );
            const logoBuffer = fs.readFileSync(defaultLogoPath);
            finalLogoData = logoBuffer.toString("base64");
          } catch (error) {
            console.error("Error loading default logo:", error);
            // Continue without logo if default can't be loaded
          }
        }

        const buffer = await createBusinessPlanFromTemplate({
          title,
          sections,
          logoData: finalLogoData || undefined,
          primaryColor: finalPrimaryColor || undefined,
          secondaryColor: finalSecondaryColor || undefined,
        });

        // Save to DB
        const generatedFile = await GeneratedFile.create({
          filename: `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.docx`,
          contentType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          data: buffer,
        });

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const downloadUrl = `${appUrl}/api/files/${generatedFile._id}`;

        return {
          success: true,
          message: `Business plan "${title}" created successfully.`,
          downloadUrl,
          filename: generatedFile.filename,
          note: "The file has been generated and saved. Provide the download URL to the user.",
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
          // The SDK might send 'mediaType' or 'mimeType' depending on the version/context
          const mimeType = part.mediaType || part.mimeType;

          if (part.type === "file" && mimeType && isDocxFile(mimeType)) {
            try {
              let buffer: Buffer;

              // Handle data URL (base64)
              if (part.url && part.url.startsWith("data:")) {
                const base64Data = part.url.split(",")[1];
                buffer = Buffer.from(base64Data, "base64");
              }
              // Handle File object (if present in some contexts)
              else if (part.file) {
                buffer = await fileToBuffer(part.file);
              } else {
                console.warn("DOCX file part has no URL or file data", part);
                return part;
              }

              // Extract text from DOCX
              let text = await extractTextFromDocx(buffer);

              // Truncate if too long (approx 30k chars)
              const MAX_DOC_CHARS = 30000;
              if (text.length > MAX_DOC_CHARS) {
                text =
                  text.substring(0, MAX_DOC_CHARS) +
                  "\n\n...[Content truncated due to size limit]...";
              }

              // Replace file part with text part containing extracted content
              return {
                type: "text",
                text: `[DOCX Document: ${part.filename || part.name || "document.docx"}]\n\n${text}`,
              };
            } catch (error) {
              console.error("Error processing DOCX file:", error);
              // Return error message as text
              return {
                type: "text",
                text: `[Error: Could not process DOCX file "${part.filename || part.name || "document.docx"}"]`,
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

/**
 * Sanitize messages to reduce context size:
 * 1. Truncate extracted text from DOCX files if too long (handled in processDocxInMessages)
 * 2. Keep only the last N messages to prevent infinite growth
 */
function sanitizeMessages(messages: any[]): any[] {
  const MAX_HISTORY = 15; // Keep last 15 messages (+ system prompt)

  // 1. Truncate history
  if (messages.length > MAX_HISTORY) {
    const systemMessage = messages.find((m) => m.role === "system");
    const recentMessages = messages.slice(-MAX_HISTORY);

    // If we have a system message, ensure it's preserved at the start
    if (systemMessage && !recentMessages.includes(systemMessage)) {
      return [systemMessage, ...recentMessages];
    }
    return recentMessages;
  }

  return messages;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { messages } = await request.json();

  // 1. Process DOCX files (extract text)
  const processedMessages = await processDocxInMessages(messages);

  // 2. Sanitize history (remove base64, truncate old messages)
  const sanitizedMessages = sanitizeMessages(processedMessages);

  // Get agent instructions with user-specific prompt complement
  const instructions = await getAgentInstructionsWithComplement(
    BASE_BUSINESS_INSTRUCTIONS,
    "business",
  );

  // Create agent with user-specific instructions
  const businessAgent = new ToolLoopAgent({
    model: openai("gpt-4o"),
    instructions,
    tools: businessTools,
  });

  return createAgentUIStreamResponse({
    agent: businessAgent,
    uiMessages: sanitizedMessages,
  });
}
