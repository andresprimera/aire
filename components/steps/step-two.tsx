import {
  Dropzone,
  DropZoneArea,
  DropzoneTrigger,
  DropzoneDescription,
  useDropzone,
} from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface StepTwoProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export function StepTwo({ files, onChange }: StepTwoProps) {
  const dropzone = useDropzone({
    onDropFile: async (file) => {
      onChange([...files, file]);
      return { status: "success", result: file };
    },
    validation: {
      maxSize: 5 * 1024 * 1024,
    },
    shiftOnMaxFiles: true,
  });

  const removeFile = (indexToRemove: number) => {
    onChange(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <h3 className="font-medium text-lg">Upload Files</h3>
        <p className="text-muted-foreground text-sm">
          Upload any relevant documents.
        </p>
      </div>

      <div className="grid gap-4">
        <Dropzone {...dropzone}>
          <DropZoneArea className="h-40">
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
    </div>
  );
}
