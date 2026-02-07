export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import to prevent bundling issues on edge runtime or client
    const { seedIfNoAdmins, seedTestUser } = await import("./lib/seed-admin");
    await seedIfNoAdmins();
    if (process.env.NODE_ENV === "development") {
      await seedTestUser();
    }
  }
}
