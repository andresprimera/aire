"use client";

import { useState, useMemo, useEffect } from "react";
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
  DropdownMenuLabel,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, Settings, Menu, Plus, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const agentTypes = [
  { id: "sales", label: "Proposals & Sales" },
  { id: "support", label: "Post-Sales Support" },
  { id: "business", label: "Business Plans", adminOnly: true },
];

const modelOptions = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
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
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  // Fetch custom prompt when agent changes
  useEffect(() => {
    const fetchCustomPrompt = async () => {
      if (!selectedAgent) return;

      setIsLoadingPrompt(true);
      try {
        const response = await fetch(
          `/api/user-agent-params?agentId=${selectedAgent.id}`,
        );
        if (response.ok) {
          const data = await response.json();
          setCustomPrompt(data.promptComplement || null);
        }
      } catch (error) {
        console.error("Error fetching custom prompt:", error);
      } finally {
        setIsLoadingPrompt(false);
      }
    };

    fetchCustomPrompt();
  }, [selectedAgent]);

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
                        <SheetTitle>User Options</SheetTitle>
                        <SheetDescription>
                          Manage your consumption, agents, and account settings.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4">
                        <Tabs defaultValue="consumption" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="consumption">
                              Consumption
                            </TabsTrigger>
                            <TabsTrigger value="agents">Agents</TabsTrigger>
                            <TabsTrigger value="account">Account</TabsTrigger>
                          </TabsList>
                          <TabsContent
                            value="consumption"
                            className="space-y-4"
                          >
                            <div className="text-sm">
                              <h3 className="mb-2 font-semibold">
                                Consumption
                              </h3>
                              <p className="text-muted-foreground">
                                View your usage statistics and consumption
                                details.
                              </p>
                            </div>
                          </TabsContent>
                          <TabsContent value="agents" className="space-y-4">
                            <div className="space-y-4">
                              <div>
                                <h3 className="mb-2 font-semibold text-sm">
                                  Model Configuration
                                </h3>
                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <label className="text-muted-foreground text-xs">
                                      Select Model
                                    </label>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="w-full justify-between"
                                        >
                                          {selectedModel.label}
                                          <ChevronDown className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-full">
                                        <DropdownMenuLabel>
                                          Available Models
                                        </DropdownMenuLabel>
                                        {modelOptions.map((model) => (
                                          <DropdownMenuItem
                                            key={model.id}
                                            onClick={() =>
                                              setSelectedModel(model)
                                            }
                                          >
                                            {model.label}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-muted-foreground text-xs">
                                      Custom Prompt
                                    </label>
                                    {isLoadingPrompt ? (
                                      <div className="rounded-md border bg-muted p-3 text-muted-foreground text-sm">
                                        Loading...
                                      </div>
                                    ) : customPrompt ? (
                                      <div className="rounded-md border bg-muted p-3 text-sm">
                                        <p className="line-clamp-3">
                                          {customPrompt}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="rounded-md border border-dashed bg-muted/50 p-3 text-muted-foreground text-sm">
                                        No custom prompt configured
                                      </div>
                                    )}
                                    <Dialog
                                      open={isPromptModalOpen}
                                      onOpenChange={setIsPromptModalOpen}
                                    >
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full"
                                        >
                                          {customPrompt ? (
                                            <>
                                              <Edit className="mr-2 h-4 w-4" />
                                              Edit Custom Prompt
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="mr-2 h-4 w-4" />
                                              Create Custom Prompt
                                            </>
                                          )}
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>
                                            {customPrompt
                                              ? "Edit Custom Prompt"
                                              : "Create Custom Prompt"}
                                          </DialogTitle>
                                          <DialogDescription>
                                            This modal will be implemented soon.
                                          </DialogDescription>
                                        </DialogHeader>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="account" className="space-y-4">
                            <div className="text-sm">
                              <h3 className="mb-2 font-semibold">Account</h3>
                              <p className="text-muted-foreground">
                                Update your account settings and preferences.
                              </p>
                            </div>
                          </TabsContent>
                        </Tabs>
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
