# Super User System - Visual Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      ENVIRONMENT VARIABLES                       │
├─────────────────────────────────────────────────────────────────┤
│  SUPER_USER_EMAILS=admin@company.com,manager@company.com       │
│  SUPER_USER_DEFAULT_PASSWORD=SecurePassword123!                │
│  SEED_SECRET=random-token (optional)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ read by
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SEEDING PROCESS                               │
│                  (lib/seed-admin.ts)                            │
├─────────────────────────────────────────────────────────────────┤
│  1. Parse SUPER_USER_EMAILS                                     │
│  2. For each email:                                             │
│     ├─ User exists? → Update isAdmin = true                     │
│     └─ User missing? → Create with default password            │
│  3. Log results                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ triggered by
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SEED API ENDPOINT                           │
│              (app/api/seed-admin/route.ts)                      │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/seed-admin                                           │
│                                                                  │
│  Authentication (any of):                                       │
│  ✓ Admin session (logged-in admin)                             │
│  ✓ SEED_SECRET bearer token                                    │
│  ✓ Development mode (NODE_ENV=development)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ updates
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE (MongoDB)                         │
│                    (lib/models/user.ts)                         │
├─────────────────────────────────────────────────────────────────┤
│  User {                                                         │
│    email: string                                                │
│    password: string (hashed)                                    │
│    name: string                                                 │
│    isAdmin: boolean ◄── NEW FIELD                              │
│    createdAt: Date                                              │
│    updatedAt: Date                                              │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ queried by
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
│                      (lib/auth.ts)                              │
├─────────────────────────────────────────────────────────────────┤
│  User Login                                                     │
│    ↓                                                            │
│  NextAuth.authorize()                                           │
│    ↓                                                            │
│  Query Database → User + isAdmin                                │
│    ↓                                                            │
│  JWT Token {                                                    │
│    id: user._id                                                 │
│    email: user.email                                            │
│    isAdmin: user.isAdmin ◄── INCLUDED                          │
│  }                                                              │
│    ↓                                                            │
│  Session {                                                      │
│    user: {                                                      │
│      id, email, name,                                           │
│      isAdmin: boolean ◄── EXPOSED TO CLIENT                    │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ consumed by
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT COMPONENTS                           │
│                   (app/admin/page.tsx)                          │
├─────────────────────────────────────────────────────────────────┤
│  const { data: session } = useSession();                       │
│  const isAdmin = session?.user?.isAdmin;                       │
│                                                                  │
│  if (!isAdmin) {                                                │
│    return <AccessDenied />;                                     │
│  }                                                              │
│                                                                  │
│  return <AdminDashboard />;                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Setup (One Time)

```
Developer
    │
    │ 1. Set environment variables
    ├─► SUPER_USER_EMAILS=admin@example.com
    └─► SUPER_USER_DEFAULT_PASSWORD=SecurePass123!
    
    │
    │ 2. Trigger seeding
    ▼
POST /api/seed-admin
    │
    │ 3. Seeding process
    ▼
Database Updated
    │
    └─► admin@example.com → isAdmin: true
```

### 2. User Login Flow

```
User enters credentials
    │
    ├─► email: admin@example.com
    └─► password: SecurePass123!
    
    │
    ▼
NextAuth.signIn()
    │
    ▼
lib/auth.ts → authorize()
    │
    ├─► Query MongoDB
    │
    └─► User found {
            email: "admin@example.com",
            isAdmin: true ◄── From database
        }
    
    │
    ▼
JWT Token Created
    │
    └─► { id, email, isAdmin: true }
    
    │
    ▼
Session Created
    │
    └─► session.user.isAdmin = true
    
    │
    ▼
Client Receives Session
    │
    └─► useSession() returns { user: { isAdmin: true } }
```

### 3. Authorization Check

```
User navigates to /admin
    │
    ▼
AdminPage Component
    │
    ├─► useSession()
    │
    └─► session.user.isAdmin ?
            │
            ├─► true  → Show AdminDashboard
            │
            └─► false → Show AccessDenied
```

## Security Layers

```
┌────────────────────────────────────────────────────────┐
│ Layer 1: Environment Variables                         │
│ ─────────────────────────────────────────────────────  │
│ • Admins defined outside code                          │
│ • Platform-managed secrets                             │
│ • Not in git repository                                │
└────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│ Layer 2: Seed API Authentication                       │
│ ─────────────────────────────────────────────────────  │
│ • Admin session OR                                     │
│ • SEED_SECRET token OR                                 │
│ • Development mode only                                │
└────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│ Layer 3: Password Security                             │
│ ─────────────────────────────────────────────────────  │
│ • bcrypt hashing (12 rounds)                           │
│ • No plaintext storage                                 │
│ • No password logging                                  │
└────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│ Layer 4: Session Security                              │
│ ─────────────────────────────────────────────────────  │
│ • NextAuth JWT tokens                                  │
│ • HTTP-only cookies                                    │
│ • Signed and encrypted                                 │
└────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│ Layer 5: Client Authorization                          │
│ ─────────────────────────────────────────────────────  │
│ • Check session.user.isAdmin                           │
│ • Type-safe checks                                     │
│ • Null-safe access                                     │
└────────────────────────────────────────────────────────┘
```

## Comparison: Before vs After

### BEFORE
```
┌──────────────────────┐
│ User                 │
│ ─────────────────── │
│ • email             │
│ • password          │
│ • name              │
│ • createdAt         │
│ • updatedAt         │
└──────────────────────┘

No way to distinguish admins from regular users!
```

### AFTER
```
┌──────────────────────┐      ┌──────────────────────┐
│ Regular User         │      │ Admin User           │
│ ─────────────────── │      │ ─────────────────── │
│ • email             │      │ • email             │
│ • password          │      │ • password          │
│ • name              │      │ • name              │
│ • isAdmin: false ✗  │      │ • isAdmin: true ✓   │
│ • createdAt         │      │ • createdAt         │
│ • updatedAt         │      │ • updatedAt         │
└──────────────────────┘      └──────────────────────┘
        │                              │
        │ Login                        │ Login
        ▼                              ▼
  session.user.isAdmin = false   session.user.isAdmin = true
        │                              │
        ▼                              ▼
  /admin → AccessDenied          /admin → Dashboard
```

## Environment Examples

### Development
```env
SUPER_USER_EMAILS=dev@localhost.com
SUPER_USER_DEFAULT_PASSWORD=DevPassword123
# No SEED_SECRET needed (dev mode open)
```

### Staging
```env
SUPER_USER_EMAILS=qa@company.com,manager@company.com
SUPER_USER_DEFAULT_PASSWORD=StagingSecurePass456!
SEED_SECRET=staging-secret-token-xyz
```

### Production
```env
SUPER_USER_EMAILS=admin@company.com,cto@company.com
SUPER_USER_DEFAULT_PASSWORD=ProductionVerySecurePass789!@#
SEED_SECRET=prod-random-secret-token-abc123
```

## Quick Reference

### ✅ To Add an Admin
1. Add email to `SUPER_USER_EMAILS` (comma-separated)
2. Restart app or re-seed: `POST /api/seed-admin`
3. User logs in → automatically admin

### ✅ To Remove an Admin
1. Remove email from `SUPER_USER_EMAILS`
2. Manually set `isAdmin: false` in database OR
3. Implement a "demote admin" feature

### ✅ To Check if User is Admin (Client)
```typescript
const { data: session } = useSession();
if (session?.user?.isAdmin) {
  // User is admin
}
```

### ✅ To Check if User is Admin (Server)
```typescript
const session = await getServerSession(authOptions);
if (session?.user?.isAdmin) {
  // User is admin
}
```

### ✅ To Protect a Page
```typescript
if (!session?.user?.isAdmin) {
  return <AccessDenied />;
}
```

### ✅ To Protect an API Route
```typescript
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Admin-only logic
}
```

## Troubleshooting

```
Problem: "User not admin after seeding"
Solution: Log out and log back in (session needs refresh)

Problem: "Can't call seed API (401)"
Solution: Check authentication:
  • In dev: Should work without auth
  • In prod: Need SEED_SECRET bearer token or admin session

Problem: "New admin user created but can't login"
Solution: Check SUPER_USER_DEFAULT_PASSWORD is set and try that password

Problem: "No users created during seeding"
Solution: Check MongoDB connection and SUPER_USER_EMAILS format

Problem: "/admin shows access denied for admin"
Solution: Check session has isAdmin: true (log session object)
```

## Success Indicators

✅ User model has `isAdmin` field
✅ `.env.example` documents environment variables
✅ Seed API returns success
✅ Admin user has `isAdmin: true` in database
✅ Session includes `isAdmin` property
✅ Admin page shows dashboard for admin
✅ Admin page shows access denied for non-admin
✅ No security vulnerabilities found
✅ Documentation complete

**Status: COMPLETE AND READY TO USE** 🎉
