import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserAgentParams from "@/lib/models/user-agent-params";

/**
 * Fetches the prompt complement for a specific agent for the authenticated user
 * and appends it to the base instructions
 *
 * @param baseInstructions - The base agent instructions
 * @param agentId - The agent ID (sales, support, business)
 * @returns The instructions with the prompt complement appended, or just the base instructions if no complement exists
 */
export async function getAgentInstructionsWithComplement(
  baseInstructions: string,
  agentId: string,
): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return baseInstructions;
    }

    await connectDB();

    const params = await UserAgentParams.findOne({
      userId: session.user.id,
      agentId,
    });

    if (!params || !params.promptComplement) {
      return baseInstructions;
    }

    // Append the prompt complement to the base instructions
    return `${baseInstructions}

--- BUSINESS-SPECIFIC CONTEXT ---
${params.promptComplement}`;
  } catch (error) {
    console.error("Error fetching prompt complement:", error);
    // Return base instructions if there's an error
    return baseInstructions;
  }
}
