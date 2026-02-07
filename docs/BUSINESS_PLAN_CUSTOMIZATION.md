# Business Plan Template Customization

## Overview

The business plan agent now supports customization with company logos and brand colors when generating DOCX documents.

## Features

### 1. Logo Customization
- **Supported formats**: PNG, JPG/JPEG, GIF, BMP
- **Default**: Uses `/public/logo_aire.png` if no custom logo is specified
- **Size**: Automatically resized to 200x100 pixels in the document
- **Position**: Centered at the top of the document

### 2. Color Customization
- **Primary Color**: Applied to H1 headings (default: `#1E40AF` - blue)
- **Secondary Color**: Applied to H2 headings (default: `#3B82F6` - lighter blue)
- **Format**: Hex color codes (e.g., `#FF6B35`)

## Usage

### For Users

When using the business plan agent, you can request custom branding:

```
"I need a business plan for my startup. Please use our brand colors:
- Primary color: #FF6B35 (orange)
- Secondary color: #F7931E (gold)"
```

The agent will ask clarifying questions and generate the document with your specified customization.

### For Developers

The `createBusinessPlanDocx` tool in the sales agent accepts the following optional parameters:

```typescript
{
  title: string;                    // Document title
  sections: BusinessPlanSection[];  // Array of sections
  logoPath?: string;               // Absolute path to logo file
  primaryColor?: string;           // Hex color for H1 (e.g., "#1E40AF")
  secondaryColor?: string;         // Hex color for H2 (e.g., "#3B82F6")
}
```

### Example Tool Call

```typescript
await createBusinessPlanDocx({
  title: "Tech Startup Business Plan",
  sections: [
    { title: "Executive Summary", content: "...", level: 1 },
    { title: "Market Analysis", content: "...", level: 1 }
  ],
  logoPath: "/path/to/custom/logo.png",
  primaryColor: "#FF6B35",
  secondaryColor: "#F7931E"
});
```

## Implementation Details

### Libraries Used
- **docx**: For programmatic DOCX generation
- **docxtemplater**: Reserved for future template file support
- **pizzip**: Reserved for future template file support

### File Structure
```
/public/logo_aire.png       # Default logo
/templates/                  # Reserved for template files
/lib/document-processor.ts   # Core generation logic
/app/api/agents/sales/route.ts  # Agent with tool implementation
```

## Future Enhancements

The templates directory is prepared for loading actual `.docx` template files with:
- Pre-designed layouts
- Placeholder variables
- Multiple template options
- More advanced styling capabilities

## Testing

The implementation has been tested with:
- ✅ Valid logo files (PNG format)
- ✅ Custom hex colors for headings
- ✅ Default values when no customization is specified
- ✅ Generated files validate as Microsoft Word 2007+ format
- ✅ All TypeScript type checks pass
- ✅ All linter rules pass
- ✅ No security vulnerabilities detected
