# File Upload Implementation Guide

## Overview

This guide documents how file uploads are implemented in the AIRE project and how to maintain or extend the functionality.

## Architecture

### Frontend Components

#### 1. Attachment UI (`components/assistant-ui/attachment.tsx`)

**Key Components:**
- `ComposerAddAttachment`: Button that triggers file picker
- `ComposerAttachments`: Displays attached files before sending
- `UserMessageAttachments`: Shows attachments in sent messages
- `AttachmentUI`: Main component for rendering attachment previews
- `AttachmentThumb`: Thumbnail view with file type icons
- `AttachmentPreviewDialog`: Full-size preview modal for images

**Features:**
- File type detection (image/document/file)
- Image preview with zoom
- Drag and drop support
- File removal before sending
- Object URL management for local files

#### 2. Thread UI (`components/assistant-ui/thread.tsx`)

**Integration Points:**
```tsx
// In Composer component
<ComposerPrimitive.AttachmentDropzone>
  <ComposerAttachments />
  <ComposerPrimitive.Input ... />
  <ComposerAction />
</ComposerPrimitive.AttachmentDropzone>

// In ComposerAction
<ComposerAddAttachment />

// In UserMessage component
<UserMessageAttachments />
```

#### 3. Runtime Setup (`app/assistant.tsx`)

```tsx
const transport = useMemo(
  () =>
    new AssistantChatTransport({
      api: `/api/agents/${selectedAgent.id}`,
    }),
  [selectedAgent.id],
);

const runtime = useChatRuntime({ transport });
```

The `AssistantChatTransport` automatically handles file serialization when sending messages.

### Backend API

#### 0. Document Processing Utility (`lib/document-processor.ts`)

**Purpose:** Extract text from DOCX files for processing by the AI model.

```typescript
import mammoth from "mammoth";

/**
 * Extract text content from a DOCX file
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to extract text from DOCX file");
  }
}

/**
 * Convert a File object to Buffer
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check if a file is a DOCX file based on MIME type
 */
export function isDocxFile(mimeType: string): boolean {
  return (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/docx"
  );
}
```

**Dependencies:**
- `mammoth`: Library for extracting text from DOCX files
- Install: `npm install mammoth`

#### 1. Agent Routes

**Sales Agent** (`app/api/agents/sales/route.ts`):
```typescript
import { ToolLoopAgent, tool, createAgentUIStreamResponse } from "ai";
import { openai } from "@ai-sdk/openai";
import { extractTextFromDocx, fileToBuffer, isDocxFile } from "@/lib/document-processor";

const salesAgent = new ToolLoopAgent({
  model: openai("gpt-4o"), // Vision-capable model
  instructions: "... You can analyze images and documents (including DOCX files) that users share.",
  tools: { /* ... */ },
});

async function processDocxInMessages(messages: any[]): Promise<any[]> {
  return Promise.all(
    messages.map(async (msg) => {
      if (!msg.parts) return msg;
      
      const processedParts = await Promise.all(
        msg.parts.map(async (part: any) => {
          if (part.type === "file" && part.mimeType && isDocxFile(part.mimeType)) {
            try {
              const buffer = await fileToBuffer(part.file);
              const text = await extractTextFromDocx(buffer);
              return {
                type: "text",
                text: `[DOCX Document: ${part.name || "document.docx"}]\n\n${text}`,
              };
            } catch (error) {
              console.error("Error processing DOCX file:", error);
              return {
                type: "text",
                text: `[Error: Could not process DOCX file "${part.name || "document.docx"}"]`,
              };
            }
          }
          return part;
        }),
      );
      
      return { ...msg, parts: processedParts };
    }),
  );
}

export async function POST(request: Request) {
  const { messages } = await request.json();
  
  // Process DOCX files before sending to agent
  const processedMessages = await processDocxInMessages(messages);
  
  return createAgentUIStreamResponse({
    agent: salesAgent,
    uiMessages: processedMessages, // Includes file attachments
  });
}
```

**Support Agent** (`app/api/agents/support/route.ts`):
- Same structure as Sales Agent
- Includes DOCX processing
- Different instructions and tools
- Both use GPT-4o for vision support

**Chat Route** (`app/api/chat/route.ts`):
```typescript
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

## Data Flow

### 1. File Selection
```
User clicks "+" or drags file
    ↓
Browser File API opens file picker
    ↓
File(s) selected → File objects created
    ↓
ComposerPrimitive.AddAttachment handles File objects
    ↓
Files stored in composer state (zustand store)
    ↓
AttachmentUI components render previews
```

### 2. Message Sending
```
User clicks send
    ↓
useChatRuntime creates UIMessage
    ↓
UIMessage includes FileUIPart for each file:
{
  role: "user",
  parts: [
    { type: "text", text: "..." },
    { type: "file", file: File, name: "...", mimeType: "..." }
  ]
}
    ↓
AssistantChatTransport serializes message
    ↓
File converted to base64 data URL or uploaded
    ↓
POST to /api/agents/{agent}
```

### 3. Backend Processing
```
API route receives UIMessage[]
    ↓
createAgentUIStreamResponse processes messages
    ↓
Internal: UIMessage → ModelMessage conversion
    ↓
Files converted to model-specific format:
- Images: data URLs or image URLs
- Text: extracted content
    ↓
ToolLoopAgent with GPT-4o processes
    ↓
Model generates response based on file content
    ↓
Response streamed back to client
```

## File Format Handling

### UIMessage with Files

```typescript
interface UIMessage {
  role: "user" | "assistant";
  parts: UIMessagePart[];
}

type UIMessagePart = TextUIPart | FileUIPart | ...;

interface FileUIPart {
  type: "file";
  file?: File;  // Browser File object
  name?: string;
  mimeType?: string;
  content?: ContentPart[]; // After conversion
}
```

### Model Message Conversion

The AI SDK's `convertToModelMessages` automatically handles:

1. **Images** → Vision model format:
```typescript
{
  role: "user",
  content: [
    { type: "text", text: "..." },
    { type: "image", image: "data:image/png;base64,..." }
  ]
}
```

2. **Text files** → Extracted text:
```typescript
{
  role: "user",
  content: [
    { type: "text", text: "User message + file content" }
  ]
}
```

## Model Configuration

### Current Setup

**Model**: `gpt-4o` (OpenAI)

**Capabilities:**
- ✅ Vision (image understanding)
- ✅ Text generation
- ✅ Tool calling
- ✅ JSON mode
- ⚠️ Limited native document parsing (relies on text extraction)

**Why GPT-4o:**
- Multimodal (text + vision)
- Good balance of cost and performance
- Supports streaming
- Wide availability

### Alternative Models

If you need to change models:

1. **GPT-4 Turbo with Vision**:
```typescript
model: openai("gpt-4-turbo")
```
- More expensive
- Potentially better quality
- Larger context window

2. **GPT-4 Vision Preview**:
```typescript
model: openai("gpt-4-vision-preview")
```
- Older but stable
- Good for testing

3. **Other Providers** (requires code changes):
```typescript
import { anthropic } from "@ai-sdk/anthropic";
model: anthropic("claude-3-opus")
```

## Extending the Feature

### Adding File Type Validation

In `components/assistant-ui/thread.tsx` or a new component:

```typescript
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Add to ComposerAddAttachment or create wrapper
<ComposerPrimitive.AddAttachment 
  accept={ALLOWED_TYPES.join(",")}
  onFileSelect={(files) => {
    const validFiles = files.filter(file => 
      file.size <= MAX_FILE_SIZE && 
      ALLOWED_TYPES.includes(file.type)
    );
    // Handle validation errors
  }}
  asChild
>
  {/* ... */}
</ComposerPrimitive.AddAttachment>
```

### Adding File Processing Tools

Add custom tools to agents for specific file operations:

```typescript
const salesAgent = new ToolLoopAgent({
  model: openai("gpt-4o"),
  instructions: "...",
  tools: {
    // Existing tools...
    
    extractTextFromImage: tool({
      description: "Extract text from an image using OCR",
      inputSchema: z.object({
        imageDescription: z.string().describe("Description of the image"),
      }),
      execute: async ({ imageDescription }) => {
        // The model already has the image in context
        // This tool just signals to focus on text extraction
        return { 
          instruction: "Please extract all visible text from the image" 
        };
      },
    }),
    
    analyzeDocument: tool({
      description: "Analyze a document structure and content",
      inputSchema: z.object({
        documentType: z.enum(["contract", "invoice", "proposal"]),
      }),
      execute: async ({ documentType }) => {
        return {
          instruction: `Analyze this ${documentType} and extract key information`,
        };
      },
    }),
  },
});
```

### Adding Document Parsing

For advanced document parsing (PDF, DOCX), you'd need to add server-side processing:

```typescript
// app/api/agents/sales/route.ts
import pdf from "pdf-parse"; // npm install pdf-parse

export async function POST(request: Request) {
  const { messages } = await request.json();
  
  // Pre-process messages to extract text from PDFs
  const processedMessages = await Promise.all(
    messages.map(async (msg) => {
      if (msg.parts) {
        const processedParts = await Promise.all(
          msg.parts.map(async (part) => {
            if (part.type === "file" && part.mimeType === "application/pdf") {
              // Extract text from PDF
              const buffer = await fileToBuffer(part.file);
              const data = await pdf(buffer);
              return {
                type: "text",
                text: `[PDF Content]\n${data.text}`,
              };
            }
            return part;
          })
        );
        return { ...msg, parts: processedParts };
      }
      return msg;
    })
  );
  
  return createAgentUIStreamResponse({
    agent: salesAgent,
    uiMessages: processedMessages,
  });
}
```

## Testing

### Manual Testing

1. **Image Upload**:
   - Upload a clear product image
   - Ask "What's in this image?"
   - Verify AI describes the image correctly

2. **Multiple Files**:
   - Upload 2-3 images
   - Ask to compare them
   - Verify AI references multiple images

3. **Text Files**:
   - Upload a .txt file
   - Ask to summarize
   - Verify AI reads the content

4. **Error Cases**:
   - Try very large file (>20MB)
   - Try unsupported format
   - Verify error handling

### Automated Testing

```typescript
// Example test (Jest + Testing Library)
import { render, screen, fireEvent } from "@testing-library/react";
import { Thread } from "@/components/assistant-ui/thread";

describe("File Upload", () => {
  it("should allow adding attachments", () => {
    render(<Thread />);
    
    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByLabelText("Add Attachment");
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText("test.png")).toBeInTheDocument();
  });
  
  it("should display image preview", async () => {
    // Test preview modal
  });
  
  it("should remove attachment", () => {
    // Test remove functionality
  });
});
```

## Troubleshooting

### Common Issues

1. **Files not appearing in message**:
   - Check browser console for errors
   - Verify file is within size limits
   - Check Content Security Policy settings

2. **AI not responding to images**:
   - Verify model is `gpt-4o` or vision-capable
   - Check OpenAI API key has vision access
   - Test with a simple clear image first

3. **Slow upload/processing**:
   - Large files take longer
   - Check network speed
   - Consider compressing images
   - Verify OpenAI API response times

4. **File format errors**:
   - Check MIME type detection
   - Verify file isn't corrupted
   - Try converting to standard format

## Performance Optimization

### Image Optimization

```typescript
// Add image compression before upload
async function compressImage(file: File): Promise<File> {
  // Use canvas to compress
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  // Set max dimensions
  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1080;
  
  let width = img.width;
  let height = img.height;
  
  if (width > height) {
    if (width > MAX_WIDTH) {
      height *= MAX_WIDTH / width;
      width = MAX_WIDTH;
    }
  } else {
    if (height > MAX_HEIGHT) {
      width *= MAX_HEIGHT / height;
      height = MAX_HEIGHT;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx?.drawImage(img, 0, 0, width, height);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], file.name, { type: "image/jpeg" }));
    }, "image/jpeg", 0.8);
  });
}
```

## Security Considerations

1. **File Type Validation**: Always validate on both client and server
2. **Size Limits**: Enforce strict size limits to prevent abuse
3. **Malware Scanning**: Consider adding virus scanning for uploaded files
4. **Content Filtering**: Be aware of potentially sensitive/inappropriate content
5. **Rate Limiting**: Implement rate limits to prevent abuse
6. **Data Privacy**: Ensure compliance with data protection regulations

## Dependencies

- `@assistant-ui/react`: ^0.12.1 (UI components)
- `@assistant-ui/react-ai-sdk`: ^1.3.1 (Runtime integration)
- `ai`: ^6.0.50+ (AI SDK with file support)
- `@ai-sdk/openai`: ^3.0.19+ (OpenAI provider)

## References

- [Assistant UI Documentation](https://www.assistant-ui.com/docs)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
