"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function LogoutButton() {
  return (
    <SidebarMenuButton size="lg" onClick={() => signOut()}>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <LogOut className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="font-semibold">Log Out</span>
        <span>Sign out of account</span>
      </div>
    </SidebarMenuButton>
  );
}
