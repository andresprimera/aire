import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Dynamic imports will be used inside the function
async function checkUsers() {
  try {
    const { connectDB } = await import("../lib/db");
    const { default: User } = await import("../lib/models/user");

    console.log("Connecting to DB...");
    await connectDB();
    console.log("Connected.");

    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach((u) => {
      console.log(
        `- ${u.email}: isAdmin=${u.isAdmin} (type: ${typeof u.isAdmin})`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkUsers();
