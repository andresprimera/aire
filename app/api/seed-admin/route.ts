import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { seedSuperUsers } from "@/lib/seed-admin";

/**
 * API route to seed super users from environment variables
 *
 * SECURITY: This endpoint requires either:
 * 1. An authenticated admin user session, OR
 * 2. A valid SEED_SECRET token in the Authorization header
 *
 * For production, consider:
 * - Removing this route after initial setup
 * - Only allowing it in development/staging environments
 * - Using a secure secret management system
 */
export async function POST(request: NextRequest) {
  try {
    // Check 1: Admin session (for logged-in admins)
    const session = await getServerSession(authOptions);
    const isAdminSession = session?.user?.isAdmin === true;

    // Check 2: Secret token (for automated/initial seeding)
    const authHeader = request.headers.get("authorization");
    const seedSecret = process.env.SEED_SECRET;
    const hasValidToken = seedSecret && authHeader === `Bearer ${seedSecret}`;

    // Check 3: Allow in development without auth (for convenience)
    const isDevelopment = process.env.NODE_ENV === "development";

    if (!isAdminSession && !hasValidToken && !isDevelopment) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin session or valid SEED_SECRET required",
        },
        { status: 401 },
      );
    }

    await seedSuperUsers();

    return NextResponse.json({
      success: true,
      message: "Super users seeded successfully",
    });
  } catch (error) {
    console.error("Seed admin API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed super users",
      },
      { status: 500 },
    );
  }
}
