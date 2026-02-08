import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/user";
import UserAgentParams from "@/lib/models/user-agent-params";

/**
 * Generate a cryptographically secure random password
 */
function generatePassword(): string {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const randomBytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(randomBytes[i] % charset.length);
  }
  return password;
}

/**
 * POST /api/admin/users
 * Create a new user with agent prompts (admin only)
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

    const body = await request.json();
    const { email, agentPrompts, name } = body;

    // Validate input
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!agentPrompts || typeof agentPrompts !== "object") {
      return NextResponse.json(
        { error: "Agent prompts are required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }

    // Generate password and create user
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    const user = await User.create({
      name: name || email.split("@")[0], // Use provided name or email prefix as fallback
      email: email.toLowerCase(),
      password: hashedPassword,
      isAdmin: false,
    });

    // Save agent prompts
    const promptSavePromises = [];

    if (agentPrompts.support) {
      promptSavePromises.push(
        UserAgentParams.create({
          userId: user._id,
          agentId: "support",
          promptComplement: agentPrompts.support,
        }),
      );
    }

    if (agentPrompts.business) {
      promptSavePromises.push(
        UserAgentParams.create({
          userId: user._id,
          agentId: "business",
          promptComplement: agentPrompts.business,
        }),
      );
    }

    if (agentPrompts.sales) {
      promptSavePromises.push(
        UserAgentParams.create({
          userId: user._id,
          agentId: "sales",
          promptComplement: agentPrompts.sales,
        }),
      );
    }

    // Wait for all prompts to be saved
    await Promise.all(promptSavePromises);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
        credentials: {
          email: user.email,
          password: generatedPassword,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
