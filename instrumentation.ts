export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import to prevent bundling issues on edge runtime or client
    const { seedIfNoAdmins } = await import("./lib/seed-admin");
    await seedIfNoAdmins();
  }
}
