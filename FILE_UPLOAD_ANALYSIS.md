# File Upload Analysis for AIRE Project

## Current Status

### ✅ What's Already Implemented

1. **Frontend UI Components** (in `components/assistant-ui/attachment.tsx`):
   - `ComposerAddAttachment` - Button to add attachments
   - `ComposerAttachments` - Display attached files before sending
   - `UserMessageAttachments` - Display attachments in sent messages
   - `AttachmentUI` - Preview and remove attachments
   - File type detection (image, document, file)
   - Image preview dialog
   - Drag & drop support via `ComposerPrimitive.AttachmentDropzone`

2. **Frontend Integration** (in `components/assistant-ui/thread.tsx`):
   - Attachment components integrated in Composer
   - Attachment display in user messages
   - Full UI workflow for adding/removing files

3. **Runtime Setup** (in `app/assistant.tsx`):
   - Uses `useChatRuntime` from `@assistant-ui/react-ai-sdk`
   - Configured with `AssistantChatTransport`
   - Connected to agent APIs

4. **AI SDK Support**:
   - Version: 6.0.77
   - Includes `FileUIPart` type
   - Has `convertFileListToFileUIParts` utility
   - `createAgentUIStreamResponse` accepts UIMessages with attachments
   - `convertToModelMessages` should handle file conversion

### ❌ What's Missing

1. **Backend Model Support**:
   - Current models: `gpt-4.1-nano` (agents), `gpt-5-nano` (chat)
   - These models may not support multimodal (vision) inputs
   - Need to verify model capabilities or switch to vision-enabled models

2. **Testing & Verification**:
   - No tests for file upload functionality
   - No documentation on supported file types
   - No error handling for unsupported file types
   - No file size limits

3. **File Processing**:
   - No explicit file conversion to base64/data URLs in backend
   - Relying on AI SDK automatic conversion
   - May need custom handling for non-image files

## Technical Analysis

### How File Uploads Should Work

1. **User adds file** → `ComposerPrimitive.AddAttachment` opens file picker
2. **File selected** → Added to composer state
3. **User sends message** → UIMessage with FileUIPart created
4. **Message sent to API** → `/api/agents/{agent}` endpoint receives message
5. **AI SDK processes** → `createAgentUIStreamResponse` converts UIMessage
6. **Model receives** → Converted to model-specific format (if supported)
7. **Response streams back** → Agent responds based on file content

### Current Implementation Flow

```
User selects file
    ↓
ComposerAddAttachment (UI component)
    ↓
File stored in composer state
    ↓
User sends message with file
    ↓
useChatRuntime creates UIMessage with FileUIPart
    ↓
Message sent to /api/agents/{sales|support}
    ↓
createAgentUIStreamResponse({ uiMessages })
    ↓
AI SDK converts UIMessage → Model format
    ↓
ToolLoopAgent with OpenAI model processes
    ↓
Response streamed back to client
```

### Potential Issues

1. **Model Compatibility**: 
   - `gpt-4.1-nano` may not support vision/multimodal inputs
   - Need to use models like `gpt-4o`, `gpt-4-turbo`, or `gpt-4-vision-preview`

2. **File Type Support**:
   - OpenAI vision models primarily support images
   - Document files (PDF, DOCX) may need special handling
   - Plain text files should work with text extraction

3. **File Size**:
   - No current size limits in code
   - OpenAI has API limits (e.g., 20MB for images)
   - Need to implement client-side validation

## Recommendations

### Option 1: Enable for Images Only (Minimal Change)

**Changes needed:**
1. Update models to vision-capable versions:
   - Change `gpt-4.1-nano` → `gpt-4o` or `gpt-4-turbo`
   - Change `gpt-5-nano` → `gpt-4o`

2. Add file type validation:
   - Restrict to images only
   - Show error for unsupported types

3. Test with sample images

**Pros:**
- Minimal code changes
- Uses existing AI SDK handling
- Leverages OpenAI vision capabilities

**Cons:**
- Limited to images only
- No document support

### Option 2: Full File Upload Support (Comprehensive)

**Changes needed:**
1. Update models (same as Option 1)
2. Add document processing:
   - PDF text extraction
   - DOCX text extraction
   - Plain text file handling
3. Add file type detection and routing
4. Add custom file processing tools
5. Implement file size limits
6. Add error handling

**Pros:**
- Supports multiple file types
- Better user experience
- More versatile

**Cons:**
- More code changes
- Additional dependencies
- More complex error handling

## Verification Plan

1. **Check Model Names**: Verify if `gpt-4.1-nano` and `gpt-5-nano` are valid
2. **Test with Images**: Try uploading an image (if models support it)
3. **Test with Documents**: Try uploading a PDF/DOCX
4. **Check Error Handling**: See what happens with unsupported files
5. **Review Logs**: Check backend logs for errors

## Next Steps

1. Verify current model names and their capabilities
2. Create a simple test to upload an image
3. Update models if needed
4. Add documentation for supported file types
5. Test end-to-end functionality
