import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserAgentParams from "@/lib/models/user-agent-params";

/**
 * GET /api/user-agent-params?agentId=sales
 * Retrieve the prompt complement for a specific agent for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 },
      );
    }

    if (!["sales", "support", "business"].includes(agentId)) {
      return NextResponse.json({ error: "Invalid agentId" }, { status: 400 });
    }

    await connectDB();

    const params = await UserAgentParams.findOne({
      userId: session.user.id,
      agentId,
    });

    if (!params) {
      return NextResponse.json({
        agentId,
        promptComplement: null,
      });
    }

    return NextResponse.json({
      agentId: params.agentId,
      promptComplement: params.promptComplement,
      updatedAt: params.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user agent params:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/user-agent-params
 * Create or update the prompt complement for a specific agent for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, promptComplement } = body;

    if (!agentId || !promptComplement) {
      return NextResponse.json(
        { error: "agentId and promptComplement are required" },
        { status: 400 },
      );
    }

    if (!["sales", "support", "business"].includes(agentId)) {
      return NextResponse.json({ error: "Invalid agentId" }, { status: 400 });
    }

    if (typeof promptComplement !== "string" || !promptComplement.trim()) {
      return NextResponse.json(
        { error: "promptComplement must be a non-empty string" },
        { status: 400 },
      );
    }

    await connectDB();

    // Use findOneAndUpdate with upsert to create or update
    const params = await UserAgentParams.findOneAndUpdate(
      {
        userId: session.user.id,
        agentId,
      },
      {
        $set: {
          promptComplement: promptComplement.trim(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    return NextResponse.json(
      {
        success: true,
        agentId: params.agentId,
        promptComplement: params.promptComplement,
        updatedAt: params.updatedAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error saving user agent params:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/user-agent-params?agentId=sales
 * Delete the prompt complement for a specific agent for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 },
      );
    }

    if (!["sales", "support", "business"].includes(agentId)) {
      return NextResponse.json({ error: "Invalid agentId" }, { status: 400 });
    }

    await connectDB();

    const result = await UserAgentParams.deleteOne({
      userId: session.user.id,
      agentId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No params found for this agent" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Prompt complement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user agent params:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
