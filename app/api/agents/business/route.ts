import { ToolLoopAgent, tool, createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import * as path from "node:path";
import * as fs from "node:fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Client, { IClient } from "@/lib/models/client";
import GeneratedFile from "@/lib/models/generated-file";
import {
  extractTextFromDocx,
  fileToBuffer,
  isDocxFile,
  createBusinessPlanFromTemplate,
} from "@/lib/document-processor";
import { getAgentInstructionsWithComplement } from "@/lib/agent-utils";

const BASE_BUSINESS_INSTRUCTIONS = `You are an AI agent specialized in creating comprehensive business plans and sales proposals for specific clients.

**CRITICAL: IDENTIFICATION FIRST WORKFLOW**
Your first priority is always to identify WHICH client you are working for. You cannot proceed without a client context.

**Workflow Stages:**

1.  **Analyze & Search (The "Entry")**:
    -   Scan the user's message and any uploaded documents for a **Company Name**.
    -   **If found**: IMMEDIATELY call \`searchClients(name)\` to see if they exist.
    -   **If NOT found**: Ask the user: "Which client is this for?"

2.  **Resolution (The "Decision")**:
    -   **Match Found**:
        -   Ask: "I found an existing client [Name]. Is this the one you want to work on?"
        -   **If Yes**: Call \`getClientDetails\` to load their history (including past plans).
        -   **If Update Needed**: If the new docs have new info (e.g., new website/address), use \`updateClient\`.
    -   **No Match**:
        -   If you have a clear company name from a document, call \`createClient\` automatically.
        -   Then use \`saveClientDocument\` to store the uploaded file for context.

3.  **Drafting & Iteration**:
    -   Once the client is active, use their specific context (branding, past docs) to draft the plan.
    -   If the user asks about an old plan, check the client's document history (provided by \`getClientDetails\`).

4.  **Final Generation (The "Output")**:
    -   Use \`createBusinessPlanDocx\`.
    -   The system will automatically handle versioning (e.g., "Plan (v2).docx").

**Rules**:
-   **Always** search before creating.
-   **Always** save uploaded documents to the client profile.
-   **Always** use the client's stored branding.
-   Answer in the language the customer uses.`;

const businessTools = {
  // --- Client Management Tools ---
  searchClients: tool({
    description:
      "Search for existing clients by name (fuzzy match). Use this FIRST when you identify a company name.",
    inputSchema: z.object({
      query: z.string().describe("Company name to search for"),
    }),
    execute: async ({ query }) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { error: "Unauthorized" };
        await connectDB();

        // Case-insensitive regex search
        const regex = new RegExp(query, "i");
        const clients = await Client.find({
          userId: session.user.id,
          name: { $regex: regex },
        })
          .select("name industry website updatedAt")
          .limit(5);

        return {
          success: true,
          matches: clients,
          count: clients.length,
          message:
            clients.length > 0
              ? "Found existing clients."
              : "No clients found.",
        };
      } catch (error) {
        return { success: false, error: "Search failed" };
      }
    },
  }),

  createClient: tool({
    description:
      "Create a new client profile. Only do this if `searchClients` returns no matches.",
    inputSchema: z.object({
      name: z.string().describe("Company Name"),
      industry: z.string().optional(),
      description: z.string().optional(),
      website: z.string().optional(),
    }),
    execute: async ({ name, industry, description, website }) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { error: "Unauthorized" };
        await connectDB();

        const existing = await Client.findOne({
          userId: session.user.id,
          name,
        });
        if (existing) {
          return {
            success: false,
            error: "Client already exists",
            clientId: existing._id,
          };
        }

        const client = await Client.create({
          userId: session.user.id,
          name,
          industry,
          description,
          website,
          branding: {},
          documents: [],
        });
        return {
          success: true,
          client,
          message: "Client created successfully",
        };
      } catch (error) {
        return { success: false, error: "Failed to create client" };
      }
    },
  }),

  updateClient: tool({
    description:
      "Update client details (e.g. if new info is found in a document).",
    inputSchema: z.object({
      clientId: z.string(),
      industry: z.string().optional(),
      description: z.string().optional(),
      website: z.string().optional(),
    }),
    execute: async ({ clientId, industry, description, website }) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { error: "Unauthorized" };
        await connectDB();

        const update: any = {};
        if (industry) update.industry = industry;
        if (description) update.description = description;
        if (website) update.website = website;

        const client = await Client.findOneAndUpdate(
          { _id: clientId, userId: session.user.id },
          { $set: update },
          { new: true },
        );
        return { success: !!client, client };
      } catch (error) {
        return { success: false, error: "Update failed" };
      }
    },
  }),

  getClientDetails: tool({
    description:
      "Get full client context: branding, notes, and DOCUMENT HISTORY. Call this when a client is selected.",
    inputSchema: z.object({
      clientId: z.string().describe("The ID of the client"),
    }),
    execute: async ({ clientId }) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { error: "Unauthorized" };
        await connectDB();

        const client = await Client.findOne({
          _id: clientId,
          userId: session.user.id,
        });
        if (!client) return { success: false, error: "Client not found" };

        // Summarize documents for context window efficiency
        const documentSummary = client.documents.map((d) => ({
          name: d.name,
          type: d.type,
          uploadedAt: d.uploadedAt,
          version: d.version, // Include version in summary
          snippet: d.content
            ? d.content.substring(0, 200) + "..."
            : "No content",
        }));

        return {
          success: true,
          client: {
            ...client.toObject(),
            documents: documentSummary,
          },
        };
      } catch (error) {
        return { success: false, error: "Failed to get client" };
      }
    },
  }),

  saveClientBranding: tool({
    description: "Save branding (logo/colors) for a client.",
    inputSchema: z.object({
      clientId: z.string(),
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      font: z.string().optional(),
    }),
    execute: async ({ clientId, logo, primaryColor, secondaryColor, font }) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { error: "Unauthorized" };
        await connectDB();

        const update: any = {};
        if (logo) update["branding.logo"] = logo;
        if (primaryColor) update["branding.primaryColor"] = primaryColor;
        if (secondaryColor) update["branding.secondaryColor"] = secondaryColor;
        if (font) update["branding.font"] = font;

        const client = await Client.findOneAndUpdate(
          { _id: clientId, userId: session.user.id },
          { $set: update },
          { new: true },
        );
        return { success: !!client, branding: client?.branding };
      } catch (error) {
        return { success: false, error: "Failed to save branding" };
      }
    },
  }),

  saveClientDocument: tool({
    description:
      "Save extracted text/content to the client's document list for future context.",
    inputSchema: z.object({
      clientId: z.string(),
      name: z.string(),
      content: z.string(),
      type: z.string().optional(),
    }),
    execute: async ({ clientId, name, content, type }) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { error: "Unauthorized" };
        await connectDB();

        const client = await Client.findOneAndUpdate(
          { _id: clientId, userId: session.user.id },
          {
            $push: {
              documents: {
                name,
                content,
                type: type || "text",
                uploadedAt: new Date(),
              },
            },
          },
          { new: true },
        );
        return { success: !!client, message: "Document saved." };
      } catch (error) {
        return { success: false, error: "Failed to save document" };
      }
    },
  }),

  // --- Utility Tools ---
  calculateDiscount: tool({
    description: "Calculate a discount",
    inputSchema: z.object({
      price: z.number(),
      discountPercent: z.number(),
    }),
    execute: async ({ price, discountPercent }) => {
      return {
        finalPrice: price - price * (discountPercent / 100),
        saved: price * (discountPercent / 100),
      };
    },
  }),

  generateProposalOutline: tool({
    description: "Generate a proposal outline",
    inputSchema: z.object({
      clientName: z.string(),
      projectType: z.string(),
    }),
    execute: async ({ clientName, projectType }) => {
      return {
        clientName,
        projectType,
        sections: ["Executive Summary", "Scope", "Timeline", "Cost", "Terms"],
      };
    },
  }),

  createBusinessPlanDocx: tool({
    description:
      "Create a DOCX business plan with VERSIONING. Uses the CLIENT'S branding automatically.",
    inputSchema: z.object({
      clientId: z.string().describe("The ID of the client"),
      title: z.string(),
      sections: z.array(
        z.object({
          title: z.string(),
          content: z.string(),
          level: z.number().optional(),
        }),
      ),
    }),
    execute: async ({ clientId, title, sections }) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { error: "Unauthorized" };
        await connectDB();

        // 1. Get Client & Branding
        const client = await Client.findOne({
          _id: clientId,
          userId: session.user.id,
        });
        if (!client) return { error: "Client not found" };

        // 2. Determine Version
        // Regex to find existing files with same base title
        // We look at the 'documents' array to find max version
        const sameTitleDocs = client.documents.filter((d) =>
          d.name.startsWith(title),
        );
        let nextVersion = 1;
        if (sameTitleDocs.length > 0) {
          const maxVer = Math.max(...sameTitleDocs.map((d) => d.version || 1));
          nextVersion = maxVer + 1;
        }

        const versionedTitle = `${title} (v${nextVersion})`;
        const finalFilename = `${versionedTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.docx`;

        // 3. Branding Setup
        let finalLogoData = client.branding?.logo || null;
        if (!finalLogoData) {
          try {
            const defaultLogoPath = path.join(
              process.cwd(),
              "public",
              "logo_aire.png",
            );
            finalLogoData = fs.readFileSync(defaultLogoPath).toString("base64");
          } catch (e) {
            console.error("Default logo error", e);
          }
        }

        // 4. Generate Buffer
        const buffer = await createBusinessPlanFromTemplate({
          title: versionedTitle, // Use versioned title in doc
          sections,
          logoData: finalLogoData || undefined,
          primaryColor: client.branding?.primaryColor,
          secondaryColor: client.branding?.secondaryColor,
        });

        // 5. Save to GeneratedFile (The physical file)
        const generatedFile = await GeneratedFile.create({
          filename: finalFilename,
          contentType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          data: buffer,
        });

        // 6. Link to Client History (The reference)
        await Client.updateOne(
          { _id: clientId },
          {
            $push: {
              documents: {
                name: versionedTitle,
                type: "docx",
                fileId: generatedFile._id,
                uploadedAt: new Date(),
                version: nextVersion,
                content: "Generated Business Plan", // Minimal content for index
              },
            },
          },
        );

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return {
          success: true,
          downloadUrl: `${appUrl}/api/files/${generatedFile._id}`,
          filename: finalFilename,
          version: nextVersion,
          message: `Business plan created: ${versionedTitle}`,
        };
      } catch (error) {
        console.error("Error creating docx:", error);
        return { success: false, error: "Failed to create DOCX" };
      }
    },
  }),
};

// ... Utility Functions ...
async function processDocxInMessages(messages: any[]): Promise<any[]> {
  return Promise.all(
    messages.map(async (msg) => {
      if (!msg.parts) return msg;

      const processedParts = await Promise.all(
        msg.parts.map(async (part: any) => {
          const mimeType = part.mediaType || part.mimeType;
          if (part.type === "file" && mimeType && isDocxFile(mimeType)) {
            try {
              let buffer: Buffer;
              if (part.url && part.url.startsWith("data:")) {
                const base64Data = part.url.split(",")[1];
                buffer = Buffer.from(base64Data, "base64");
              } else if (part.file) {
                buffer = await fileToBuffer(part.file);
              } else {
                return part;
              }

              let text = await extractTextFromDocx(buffer);
              const MAX_DOC_CHARS = 30000;
              if (text.length > MAX_DOC_CHARS) {
                text =
                  text.substring(0, MAX_DOC_CHARS) +
                  "\n\n...[Content truncated]...";
              }

              return {
                type: "text",
                text: `[DOCX Document: ${part.filename || "document.docx"}]\n\n${text}`,
              };
            } catch (error) {
              return {
                type: "text",
                text: `[Error processing DOCX: ${part.filename}]`,
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

function sanitizeMessages(messages: any[]): any[] {
  const MAX_HISTORY = 15;
  if (messages.length > MAX_HISTORY) {
    const systemMessage = messages.find((m) => m.role === "system");
    const recentMessages = messages.slice(-MAX_HISTORY);
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
  const processedMessages = await processDocxInMessages(messages);
  const sanitizedMessages = sanitizeMessages(processedMessages);

  const instructions = await getAgentInstructionsWithComplement(
    BASE_BUSINESS_INSTRUCTIONS,
    "business",
  );

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
