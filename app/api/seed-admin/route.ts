import { NextResponse } from "next/server";
import { seedSuperUsers } from "@/lib/seed-admin";

/**
 * API route to seed super users from environment variables
 * This can be called during app initialization or manually via API
 *
 * For security, you may want to:
 * 1. Remove this route in production
 * 2. Add authentication check
 * 3. Add a secret token check
 */
export async function POST() {
  try {
    // Optional: Add a security check here
    // const authHeader = request.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.SEED_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

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
