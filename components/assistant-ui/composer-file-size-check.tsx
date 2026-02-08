"use client";

import { useAssistantState } from "@assistant-ui/react";
import { AlertCircle } from "lucide-react";
import { FC } from "react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const ComposerFileSizeCheck: FC = () => {
  const totalSize = useAssistantState((state) => {
    const attachments = state.composer.attachments;
    return attachments.reduce((acc, attachment) => {
      if (attachment.file) {
        return acc + attachment.file.size;
      }
      return acc;
    }, 0);
  });

  if (totalSize <= MAX_FILE_SIZE) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4" />
      <span>
        Total attachment size exceeds 50MB limit. Please remove some files.
      </span>
    </div>
  );
};

export const useIsFileSizeExceeded = () => {
  const totalSize = useAssistantState((state) => {
    const attachments = state.composer.attachments;
    return attachments.reduce((acc, attachment) => {
      if (attachment.file) {
        return acc + attachment.file.size;
      }
      return acc;
    }, 0);
  });

  return totalSize > MAX_FILE_SIZE;
};
