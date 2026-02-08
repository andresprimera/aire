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
}

export function StepThree({ prompts, onChange, onReady }: StepThreeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [refinementTexts, setRefinementTexts] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      onReady(true);

      // Pre-fill prompts if empty
      if (Object.keys(prompts).length === 0) {
        onChange({
          "Business Agent":
            "Analyze the uploaded documents and extract key business metrics, risks, and opportunities.",
          "Sales Agent":
            "Identify potential leads and sales strategies based on the provided company profile.",
        });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onReady, prompts, onChange]);

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
