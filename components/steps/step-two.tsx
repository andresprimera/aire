import {
  Dropzone,
  DropZoneArea,
  DropzoneTrigger,
  DropzoneDescription,
  useDropzone,
} from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface StepTwoProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  contextText: string;
  onContextTextChange: (text: string) => void;
}

export function StepTwo({
  files,
  onFilesChange,
  contextText,
  onContextTextChange,
}: StepTwoProps) {
  const dropzone = useDropzone({
    onDropFile: async (file) => {
      onFilesChange([...files, file]);
      return { status: "success", result: file };
    },
    validation: {
      maxSize: 5 * 1024 * 1024,
    },
    shiftOnMaxFiles: true,
  });

  const removeFile = (indexToRemove: number) => {
    onFilesChange(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h3 className="font-medium text-lg">Provide Context</h3>
        <p className="text-muted-foreground text-sm">
          Upload documents or paste text to help generate the best prompts.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label>Upload Files</Label>
          <Dropzone {...dropzone}>
            <DropZoneArea className="h-32">
              <div className="flex flex-col items-center justify-center gap-2">
                <DropzoneTrigger>Click or drag to upload</DropzoneTrigger>
                <DropzoneDescription>Max file size: 5MB</DropzoneDescription>
              </div>
            </DropZoneArea>
          </Dropzone>

          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Selected Files</h4>
              <div className="grid gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="context-text">Additional Context</Label>
          <Textarea
            id="context-text"
            placeholder="Paste any additional context, requirements, or notes here..."
            value={contextText}
            onChange={(e) => onContextTextChange(e.target.value)}
            className="h-32 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
