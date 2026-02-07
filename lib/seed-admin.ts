import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import User from "./models/user";

/**
 * Seeds super users from environment variables
 * Super user emails should be comma-separated in SUPER_USER_EMAILS env var
 * e.g., SUPER_USER_EMAILS=admin@example.com,superadmin@example.com
 */
export async function seedSuperUsers() {
  const superUserEmails = process.env.SUPER_USER_EMAILS;

  if (!superUserEmails) {
    console.log(
      "No SUPER_USER_EMAILS environment variable found. Skipping admin seeding.",
    );
    return;
  }

  const emails = superUserEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);

  if (emails.length === 0) {
    console.log(
      "No valid emails found in SUPER_USER_EMAILS. Skipping admin seeding.",
    );
    return;
  }

  try {
    await connectDB();
    console.log(`Seeding ${emails.length} super user(s)...`);

    for (const email of emails) {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        // Update existing user to be admin
        if (!existingUser.isAdmin) {
          existingUser.isAdmin = true;
          await existingUser.save();
          console.log(`✓ Updated existing user ${email} to admin`);
        } else {
          console.log(`✓ User ${email} is already an admin`);
        }
      } else {
        // Create new admin user with a default password
        const defaultPassword = process.env.SUPER_USER_DEFAULT_PASSWORD;

        if (!defaultPassword) {
          console.error(
            `✗ Cannot create admin user ${email}: SUPER_USER_DEFAULT_PASSWORD not set`,
          );
          continue;
        }

        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        await User.create({
          email,
          name: "Admin User",
          password: hashedPassword,
          isAdmin: true,
        });

        console.log(`✓ Created new admin user ${email}`);
        if (process.env.NODE_ENV === "development") {
          console.log(
            `  ⚠️  Default password set (see SUPER_USER_DEFAULT_PASSWORD)`,
          );
        }
        console.log("  ⚠️  Please change the password immediately!");
      }
    }

    console.log("Super user seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding super users:", error);
    throw error;
  }
}
