import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface StepThreeProps {
  prompts: Record<string, string>;
  onChange: (prompts: Record<string, string>) => void;
  onReady: (isReady: boolean) => void;
  files: File[];
  contextText: string;
}

export function StepThree({
  prompts,
  onChange,
  onReady,
  files,
  contextText,
}: StepThreeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refinementTexts, setRefinementTexts] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    // Generate prompts using internal agents via API
    const generatePrompts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare form data
        const formData = new FormData();
        if (contextText) {
          formData.append("contextText", contextText);
        }
        files.forEach((file, index) => {
          formData.append(`file-${index}`, file);
        });

        // Call API to generate prompts
        const response = await fetch("/api/admin/generate-prompts", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate prompts");
        }

        const data = await response.json();

        // Update prompts with generated values
        onChange({
          support: data.prompts.support,
          business: data.prompts.business,
          sales: data.prompts.sales,
        });

        onReady(true);
      } catch (err) {
        console.error("Error generating prompts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to generate prompts",
        );
        // Set default prompts on error
        onChange({
          support:
            "Provide professional post-sales support and customer service assistance.",
          business:
            "Analyze business information and provide strategic insights for business plans.",
          sales:
            "Develop sales strategies and provide customer engagement recommendations.",
        });
        onReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    generatePrompts();
  }, [files, contextText, onChange, onReady]);

  const handleRefine = (agentName: string) => {
    const text = refinementTexts[agentName];
    if (!text) return;
    console.log(`Refining ${agentName} prompt with: ${text}`);
    // Logic to call agent for refinement would go here
    setRefinementTexts((prev) => ({ ...prev, [agentName]: "" }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Generating agent prompts...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <p className="text-destructive text-sm">Error: {error}</p>
        <p className="text-muted-foreground text-sm">
          Using default prompts. You can edit them below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h3 className="font-medium text-lg">Review Agent Prompts</h3>
        <p className="text-muted-foreground text-sm">
          Review and edit the generated prompts for each agent.
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(prompts).map(([agentName, prompt]) => (
          <div key={agentName} className="space-y-2">
            <Label htmlFor={`prompt-${agentName}`}>{agentName}</Label>
            <Textarea
              id={`prompt-${agentName}`}
              value={prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onChange({ ...prompts, [agentName]: e.target.value })
              }
              className="h-96 resize-none"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`Ask AI to refine ${agentName} prompt...`}
                  value={refinementTexts[agentName] || ""}
                  onChange={(e) =>
                    setRefinementTexts((prev) => ({
                      ...prev,
                      [agentName]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRefine(agentName);
                  }}
                />
              </div>
              <Button
                size="icon"
                onClick={() => handleRefine(agentName)}
                disabled={!refinementTexts[agentName]}
              >
                <Sparkles className="h-4 w-4" />
                <span className="sr-only">Refine</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
