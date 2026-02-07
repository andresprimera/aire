import { ToolLoopAgent, tool, createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import * as path from "node:path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User, { IUser } from "@/lib/models/user";
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
        logoPath: z
          .string()
          .optional()
          .describe(
            "Optional override: Absolute path to logo image file. If not specified, will use stored user logo or default Aire logo.",
          ),
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
      execute: async ({
        title,
        sections,
        logoPath,
        primaryColor,
        secondaryColor,
      }) => {
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

          // Handle logo: prefer provided path, then stored base64, then default path
          let finalLogoPath = logoPath;
          let finalLogoData = null;

          if (!finalLogoPath && storedLogo) {
            // Use stored base64 logo
            finalLogoData = storedLogo;
          } else if (!finalLogoPath) {
            // Use default logo
            finalLogoPath = path.join(process.cwd(), "public", "logo_aire.png");
          }

          const buffer = await createBusinessPlanFromTemplate({
            title,
            sections,
            logoPath: finalLogoPath,
            logoData: finalLogoData || undefined,
            primaryColor: finalPrimaryColor || undefined,
            secondaryColor: finalSecondaryColor || undefined,
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
