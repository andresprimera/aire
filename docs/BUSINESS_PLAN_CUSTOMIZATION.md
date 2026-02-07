# Business Plan Template Customization

## Overview

The business plan agent now automatically extracts, stores, and applies company branding (logos and colors) when generating DOCX documents. Branding information is saved to the user profile for automatic reuse in future business plans.

## Features

### 1. Automatic Branding Extraction
- **From Documents**: The agent analyzes uploaded documents to extract:
  - Company logos (stored as base64 data)
  - Brand colors (hex codes from style guides or documents)
- **One-Time Setup**: Once extracted and saved, branding is automatically applied to all future business plans
- **Smart Fallback**: If branding isn't found in documents, the agent will ask the user to confirm or provide it

### 2. Logo Customization
- **Supported formats**: PNG, JPG/JPEG, GIF, BMP
- **Storage**: Logos are stored as base64-encoded strings in the user profile
- **Default**: Uses `/public/logo_aire.png` if no custom logo is stored
- **Size**: Automatically resized to 200x100 pixels in the document
- **Position**: Centered at the top of the document

### 3. Color Customization
- **Primary Color**: Applied to H1 headings (default: `#1E40AF` - blue)
- **Secondary Color**: Applied to H2 headings (default: `#3B82F6` - lighter blue)
- **Format**: Hex color codes (e.g., `#FF6B35`)
- **Persistence**: Colors are saved to user profile and automatically applied

## Workflow

### For Users

1. **First Time**: When you request a business plan:
   - Upload any documents that contain your branding (logos, style guides, presentations)
   - The agent automatically extracts logo and colors
   - If branding is found, it's saved to your profile for future use
   - If not found, the agent will ask you to provide it

2. **Subsequent Requests**: 
   - Your stored branding is automatically applied
   - No need to provide branding information again
   - You can override branding on a per-document basis if needed

### Example Conversation

```
User: "I need a business plan for my tech startup."

Agent: "I'll help you create that. Let me check if I have your branding information... 
I see you have uploaded a company presentation. Let me analyze it for your logo and brand colors."

[Agent extracts and saves branding]

Agent: "I found your logo and brand colors (primary: #FF6B35, secondary: #F7931E). 
I've saved these for future use. Now, let's gather some information about your startup..."
```

### For Developers

#### New Tools Available

**1. getBranding Tool**
```typescript
// Retrieves stored branding from user profile
{
  success: boolean;
  hasBranding: boolean;
  logo: string | null;           // Base64 encoded
  primaryColor: string | null;    // Hex code
  secondaryColor: string | null;  // Hex code
}
```

**2. saveBranding Tool**
```typescript
// Saves branding to user profile
{
  logo?: string;          // Base64 encoded (without data: prefix)
  primaryColor?: string;  // Hex color (e.g., "#1E40AF")
  secondaryColor?: string; // Hex color
}
```

**3. createBusinessPlanDocx Tool (Updated)**
```typescript
{
  title: string;                    // Document title
  sections: BusinessPlanSection[];  // Array of sections
  primaryColor?: string;           // Optional override: Hex color for H1
  secondaryColor?: string;         // Optional override: Hex color for H2
}

// Automatically uses stored user branding (logo and colors) if parameters are not provided
// Logo is always retrieved from database as base64 - no file paths used
```

#### User Model Schema

```typescript
interface IUser {
  email: string;
  password: string;
  name: string;
  isAdmin: boolean;
  logo?: string;           // Base64 encoded logo
  primaryColor?: string;   // Hex color
  secondaryColor?: string; // Hex color
  createdAt: Date;
  updatedAt: Date;
}
```

### Example Tool Call

```typescript
// With stored branding (automatic)
await createBusinessPlanDocx({
  title: "Tech Startup Business Plan",
  sections: [
    { title: "Executive Summary", content: "...", level: 1 },
    { title: "Market Analysis", content: "...", level: 1 }
  ]
  // Logo and colors automatically retrieved from user profile
});

// With override (optional)
await createBusinessPlanDocx({
  title: "Tech Startup Business Plan",
  sections: [...],
  primaryColor: "#FF6B35",      // Override stored color
  secondaryColor: "#F7931E"     // Override stored color
});
```

## Implementation Details

### Branding Extraction Workflow

1. **Document Analysis**: Agent analyzes uploaded documents (images, PDFs, presentations)
2. **Logo Extraction**: Extracts logos and converts to base64
3. **Color Detection**: Identifies brand colors from style guides or dominant colors
4. **Storage**: Saves to MongoDB user document via `saveBranding` tool
5. **Retrieval**: Automatically loads via `getBranding` tool when generating documents
6. **Application**: Applied to document through `createBusinessPlanFromTemplate` function

### Database Storage

Branding information is stored in MongoDB as part of the User document:
- **Logo**: Stored as base64-encoded string (supports all image formats)
- **Primary Color**: Stored as hex string (e.g., "#1E40AF")
- **Secondary Color**: Stored as hex string

### Libraries Used
- **docx**: For programmatic DOCX generation with logo embedding and color styling
- **mongoose**: MongoDB ODM for user data persistence
- **docxtemplater**: Reserved for future template file support
- **pizzip**: Reserved for future template file support

### File Structure
```
/public/logo_aire.png            # Default logo
/templates/                       # Reserved for template files
/lib/document-processor.ts        # Core generation logic with base64 support
/lib/models/user.ts              # User model with branding fields
/app/api/agents/sales/route.ts   # Agent with branding tools
```

## Agent Workflow

The agent follows this workflow when creating business plans:

1. **Check Stored Branding**: Call `getBranding` tool to check if user has saved branding
2. **Analyze Documents**: Extract branding from any uploaded documents
3. **Save Branding**: If new branding is found, save it using `saveBranding` tool
4. **Confirm if Needed**: Only ask user for branding if not found and not stored
5. **Generate Document**: Use `createBusinessPlanDocx` with stored/extracted branding

## Future Enhancements

The templates directory is prepared for loading actual `.docx` template files with:
- Pre-designed layouts
- Placeholder variables
- Multiple template options
- More advanced styling capabilities

## Testing

The implementation has been tested with:
- ✅ Valid logo files (PNG format)
- ✅ Base64 encoded logos
- ✅ Custom hex colors for headings
- ✅ Stored branding retrieval and application
- ✅ Default values when no customization is specified
- ✅ Generated files validate as Microsoft Word 2007+ format
- ✅ All TypeScript type checks pass
- ✅ All linter rules pass
- ✅ No security vulnerabilities detected

## Migration Notes

Existing users will not have branding information stored initially. The agent will:
1. Extract branding from their first document upload
2. Save it to their profile
3. Automatically apply it to future business plans

No manual migration is required.
