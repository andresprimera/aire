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
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    email?: string;
    password?: string;
    error?: string;
  } | null>(null);
  const totalSteps = 2;

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

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);

      // Prepare form data with files and context
      const submitFormData = new FormData();
      submitFormData.append("email", formData.email);
      if (formData.contextText) {
        submitFormData.append("contextText", formData.contextText);
      }
      formData.files.forEach((file, index) => {
        submitFormData.append(`file-${index}`, file);
      });

      // Call API to create user (internally generates prompts and saves them)
      const response = await fetch("/api/admin/users", {
        method: "POST",
        body: submitFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      // Show success result
      setSubmitResult({
        success: true,
        email: data.credentials.email,
        password: data.credentials.password,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      setSubmitResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during submission
    if (!newOpen && isSubmitting) {
      return;
    }

    if (!newOpen) {
      setCurrentStep(1);
      setSubmitResult(null);
      setFormData({ email: "", files: [], contextText: "" });
    }
    onOpenChange(newOpen);
  };

  const handleCloseSuccess = () => {
    setCurrentStep(1);
    setSubmitResult(null);
    setFormData({ email: "", files: [], contextText: "" });
    onOpenChange(false);
  };

  const updateFormData = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    // Show success/error result after submission
    if (submitResult) {
      if (submitResult.success) {
        return (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4 rounded-lg border border-green-500/50 bg-green-500/10 p-6">
              <h3 className="font-semibold text-green-600 text-lg">
                User Created Successfully!
              </h3>
              <div className="w-full space-y-2 text-sm">
                <p className="text-muted-foreground">
                  The user has been created with the following credentials:
                </p>
                <div className="rounded-md border bg-card p-4">
                  <p className="font-medium">
                    <strong>Email:</strong> {submitResult.email}
                  </p>
                  <p className="font-medium">
                    <strong>Password:</strong> {submitResult.password}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  Please save these credentials. The password will not be shown
                  again.
                </p>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-4 py-8">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <h3 className="font-semibold text-destructive text-lg">
              Error Creating User
            </h3>
            <p className="text-center text-sm">{submitResult.error}</p>
          </div>
        </div>
      );
    }

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
          {submitResult ? (
            <Button onClick={handleCloseSuccess}>Close</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
              >
                Back
              </Button>

              {currentStep < totalSteps ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Finish"
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
