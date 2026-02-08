"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StepOne } from "@/components/steps/step-one";
import { StepTwo } from "@/components/steps/step-two";
import { StepThree } from "@/components/steps/step-three";
import { Progress } from "@/components/ui/progress";

import { cn } from "@/lib/utils";

interface MultiStepModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

interface FormData {
  email: string;
  files: File[];
  contextText: string;
  agentPrompts: Record<string, string>;
}

export function MultiStepModal({
  open,
  onOpenChange,
  className,
}: MultiStepModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    files: [],
    contextText: "",
    agentPrompts: {},
  });
  const [isStepThreeReady, setIsStepThreeReady] = useState(false);
  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    // Reset step before closing or handle final submission logic here
    console.log("Form submitted:", formData);
    setCurrentStep(1);
    setFormData({ email: "", files: [], contextText: "", agentPrompts: {} });
    setIsStepThreeReady(false);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCurrentStep(1);
      setIsStepThreeReady(false);
    }
    onOpenChange(newOpen);
  };

  const updateFormData = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepOne
            email={formData.email}
            onChange={(value) => updateFormData("email", value)}
          />
        );
      case 2:
        return (
          <StepTwo
            files={formData.files}
            onFilesChange={(value: File[]) => updateFormData("files", value)}
            contextText={formData.contextText}
            onContextTextChange={(value: string) =>
              updateFormData("contextText", value)
            }
          />
        );
      case 3:
        return (
          <StepThree
            prompts={formData.agentPrompts}
            onChange={(value) => updateFormData("agentPrompts", value)}
            onReady={setIsStepThreeReady}
          />
        );
      default:
        return null;
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          currentStep === 3 ? "sm:max-w-4xl" : "sm:max-w-[425px]",
          "flex max-h-[85vh] flex-col",
          className,
        )}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1
              ? "Create User"
              : `Step ${currentStep} of ${totalSteps}`}
          </DialogTitle>
          <DialogDescription>
            Complete the steps below to create a new user.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {renderStep()}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleFinish} disabled={!isStepThreeReady}>
              Finish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
