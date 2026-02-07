# Super User / Admin System

## Overview

This application uses a simple environment variable-based system for managing super users (administrators). This approach provides a secure and straightforward way to designate admin users without complex role management systems.

## How It Works

### 1. Environment Variables

Super users are defined using two environment variables:

- **`SUPER_USER_EMAILS`**: A comma-separated list of email addresses that should have admin privileges
- **`SUPER_USER_DEFAULT_PASSWORD`**: Default password for newly created admin accounts (optional, defaults to "ChangeMe123!")

Example:
```env
SUPER_USER_EMAILS=admin@company.com,manager@company.com
SUPER_USER_DEFAULT_PASSWORD=SecurePassword123!
```

### 2. Seeding Process

The system provides two ways to seed super users:

#### Option A: API Route (Recommended for Development)

Call the seeding API endpoint:

```bash
curl -X POST http://localhost:3000/api/seed-admin
```

This will:
- Check each email in `SUPER_USER_EMAILS`
- If the user exists, grant them admin privileges
- If the user doesn't exist, create a new account with the default password
- Log the results to the console

#### Option B: Manual Seeding

You can also call the seeding function programmatically:

```typescript
import { seedSuperUsers } from "@/lib/seed-admin";

await seedSuperUsers();
```

### 3. User Model

The User model includes an `isAdmin` boolean field:

```typescript
interface IUser {
  email: string;
  password: string;
  name: string;
  isAdmin: boolean; // Defaults to false
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. Session Management

The admin status is included in the NextAuth session:

```typescript
// In your components
const { data: session } = useSession();
const isAdmin = session?.user?.isAdmin || false;
```

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env.local` file (or update your existing one):

```env
SUPER_USER_EMAILS=your-email@example.com
SUPER_USER_DEFAULT_PASSWORD=YourSecurePassword123!
```

### 2. Seed Super Users

After starting your application, seed the super users:

```bash
# Start the development server
npm run dev

# In another terminal, trigger the seeding
curl -X POST http://localhost:3000/api/seed-admin
```

### 3. Login and Verify

1. Navigate to `/login`
2. Login with your super user email
3. Navigate to `/admin` to verify admin access
4. **Important**: Change your password if you used the default one!

## Admin Page

The admin page (`/admin`) automatically checks if the logged-in user is an admin:

- **Admin users**: See the admin dashboard
- **Regular users**: See an "Access Denied" message
- **Not logged in**: Redirected to login page (via middleware)

## Security Considerations

### Production Deployment

For production, consider these security enhancements:

1. **Remove or Secure the Seed API**
   - Delete `/app/api/seed-admin/route.ts` after initial setup
   - Or add authentication/secret token verification

2. **Use Strong Default Passwords**
   - Set a complex `SUPER_USER_DEFAULT_PASSWORD`
   - Require password change on first login

3. **Limit Super User Emails**
   - Only include necessary admin accounts
   - Use company domain emails

4. **Environment Variable Security**
   - Never commit `.env.local` to version control
   - Use secure secret management in production (e.g., AWS Secrets Manager, Vercel Environment Variables)

### Example Production Security

To add authentication to the seed API:

```typescript
// In app/api/seed-admin/route.ts
export async function POST(request: NextRequest) {
  // Add secret token check
  const authHeader = request.headers.get("authorization");
  const seedSecret = process.env.SEED_SECRET;
  
  if (!seedSecret || authHeader !== `Bearer ${seedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // ... rest of the code
}
```

Then use it:

```bash
curl -X POST http://localhost:3000/api/seed-admin \
  -H "Authorization: Bearer your-secret-token"
```

## Extending the System

### Adding More Admin Features

You can extend the admin check to protect other routes:

```typescript
// In middleware.ts
export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Check if accessing admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!token?.isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // ... rest of middleware
}
```

### Creating Admin-Only API Routes

```typescript
// In any API route
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  // Admin-only logic here
}
```

## Troubleshooting

### "No SUPER_USER_EMAILS environment variable found"

Make sure you've set the `SUPER_USER_EMAILS` in your `.env.local` file.

### "User exists but not admin"

Run the seeding API again - it will update existing users to be admins.

### "Can't access admin page"

1. Check that you're logged in
2. Verify your email is in `SUPER_USER_EMAILS`
3. Run the seeding API to update your admin status
4. Log out and log back in to refresh your session

## Benefits of This Approach

✅ **Simple**: No complex role systems or database migrations
✅ **Secure**: Admins defined outside of code via environment variables
✅ **Flexible**: Easy to add/remove admins by changing env vars
✅ **Environment-specific**: Different admins for dev, staging, production
✅ **Auditable**: Clear list of who has admin access
✅ **No UI needed**: No admin panel needed to manage admins (though you could add one)
