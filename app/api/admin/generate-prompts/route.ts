import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  supportInternalAgent,
  businessInternalAgent,
  salesInternalAgent,
} from "@/lib/internal-agents";
import type { InternalAgentInput } from "@/lib/internal-agents";

/**
 * POST /api/admin/generate-prompts
 * Generate agent prompts using internal agents based on uploaded files and context
 * Admin-only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const contextText = formData.get("contextText") as string;
    const files: File[] = [];

    // Extract files from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file-") && value instanceof File) {
        files.push(value);
      }
    }

    // Prepare input for internal agents
    const agentInput: InternalAgentInput = {
      text: contextText || undefined,
      files: await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          content: new Uint8Array(await file.arrayBuffer()),
          mimeType: file.type,
        })),
      ),
    };

    // Generate prompts using internal agents in parallel
    const [supportResult, businessResult, salesResult] = await Promise.all([
      supportInternalAgent.generateComplement(agentInput),
      businessInternalAgent.generateComplement(agentInput),
      salesInternalAgent.generateComplement(agentInput),
    ]);

    // Check for errors
    const errors: string[] = [];
    if (!supportResult.success) {
      errors.push(`Support agent: ${supportResult.error}`);
    }
    if (!businessResult.success) {
      errors.push(`Business agent: ${businessResult.error}`);
    }
    if (!salesResult.success) {
      errors.push(`Sales agent: ${salesResult.error}`);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Failed to generate some prompts",
          details: errors,
        },
        { status: 500 },
      );
    }

    // Return generated prompts
    return NextResponse.json({
      success: true,
      prompts: {
        support: supportResult.printComplement,
        business: businessResult.printComplement,
        sales: salesResult.printComplement,
      },
      extractedInfo: {
        support: supportResult.extractedInfo,
        business: businessResult.extractedInfo,
        sales: salesResult.extractedInfo,
      },
    });
  } catch (error) {
    console.error("Error generating prompts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
