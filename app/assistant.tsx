"use client";

import { useState, useMemo } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown, Settings, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const agentTypes = [
  { id: "sales", label: "Proposals & Sales" },
  { id: "support", label: "Post-Sales Support" },
  { id: "business", label: "Business Plans", adminOnly: true },
];

export const Assistant = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const isAdmin = session?.user?.isAdmin ?? false;
  const visibleAgents = agentTypes.filter(
    (agent) => !("adminOnly" in agent) || agent.adminOnly !== true || isAdmin,
  );

  const [selectedAgent, setSelectedAgent] = useState(visibleAgents[0]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: `/api/agents/${selectedAgent.id}`,
      }),
    [selectedAgent.id],
  );

  const runtime = useChatRuntime({ transport });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <ThreadListSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex flex-1 items-center justify-between gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      {selectedAgent.label}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {visibleAgents.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        {agent.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-2">
                  <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="Open menu"
                        title="Open menu"
                      >
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                        <SheetDescription>
                          Additional options and settings will appear here.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4">
                        <p className="text-muted-foreground text-sm">
                          Placeholder content for future features.
                        </p>
                      </div>
                    </SheetContent>
                  </Sheet>
                  {session?.user?.isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin")}
                      aria-label="Open settings"
                      title="Open settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread selectedAgentId={selectedAgent.id} />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
