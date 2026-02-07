"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = session?.user?.isAdmin || false;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
            aria-label="Back to home"
            title="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-bold text-3xl">Admin</h1>
        </div>

        {!isAdmin ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-8">
            <ShieldAlert className="h-12 w-12 text-destructive" />
            <h2 className="font-semibold text-xl">Access Denied</h2>
            <p className="text-center text-muted-foreground">
              You don't have permission to access this page. Admin privileges
              are required.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-4"
            >
              Return to Home
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold text-xl">Admin Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome, admin! This is your admin panel.
            </p>
            <div className="mt-6 space-y-2">
              <div className="rounded-md border p-3">
                <p className="font-medium text-sm">
                  User: {session?.user?.name || "N/A"}
                </p>
                <p className="text-muted-foreground text-sm">
                  Email: {session?.user?.email || "N/A"}
                </p>
                <p className="text-muted-foreground text-sm">
                  Role: Administrator
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
