/**
 * Document processing utilities for extracting text from various file formats
 */
import mammoth from "mammoth";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
} from "docx";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Extract text content from a DOCX file
 * @param buffer - Buffer containing the DOCX file data
 * @returns Extracted text content
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
 * @param file - File object from the browser
 * @returns Buffer containing the file data
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check if a file is a DOCX file based on MIME type
 * @param mimeType - The MIME type of the file
 * @returns True if the file is a DOCX file
 */
export function isDocxFile(mimeType: string): boolean {
  return (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

/**
 * Business Plan Section Interface
 */
export interface BusinessPlanSection {
  title: string;
  content: string;
  level?: number; // Heading level (1, 2, 3)
}

/**
 * Business Plan Template Options Interface
 */
export interface BusinessPlanTemplateOptions {
  title: string;
  sections: BusinessPlanSection[];
  logoPath?: string; // Path to logo image file
  logoData?: string; // Base64 encoded logo data (alternative to logoPath)
  primaryColor?: string; // Primary color in hex format (e.g., "#1E40AF")
  secondaryColor?: string; // Secondary color in hex format
}

/**
 * Create a DOCX document from business plan content
 * @param title - Document title
 * @param sections - Array of sections with titles and content
 * @returns Buffer containing the DOCX file
 */
export async function createBusinessPlanDocx(
  title: string,
  sections: BusinessPlanSection[],
): Promise<Buffer> {
  try {
    // Create document paragraphs
    const paragraphs: Paragraph[] = [];

    // Add title
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    );

    // Add each section
    for (const section of sections) {
      const headingLevel =
        section.level === 2
          ? HeadingLevel.HEADING_2
          : section.level === 3
            ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_1;

      // Add section heading
      paragraphs.push(
        new Paragraph({
          text: section.title,
          heading: headingLevel,
          spacing: { before: 300, after: 200 },
        }),
      );

      // Split content into paragraphs and add them
      const contentParagraphs = section.content
        .split("\n")
        .filter((p) => p.trim().length > 0);

      for (const para of contentParagraphs) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(para)],
            spacing: { after: 120 },
          }),
        );
      }
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    console.error("Error creating DOCX:", error);
    throw new Error(
      `Failed to create DOCX file "${title}". Details: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Create a DOCX document from a template with logo and color customization
 * @param options - Template options including title, sections, logo, and colors
 * @returns Buffer containing the DOCX file
 */
export async function createBusinessPlanFromTemplate(
  options: BusinessPlanTemplateOptions,
): Promise<Buffer> {
  try {
    const {
      title,
      sections,
      logoPath,
      logoData,
      primaryColor,
      secondaryColor,
    } = options;

    // For now, we'll use the existing createBusinessPlanDocx function
    // and enhance it with logo and colors
    const paragraphs: Paragraph[] = [];

    // Add logo if provided (either as path or base64 data)
    let imageBuffer: Buffer | null = null;
    let imageType: "jpg" | "png" | "gif" | "bmp" = "png";

    if (logoData) {
      // Handle base64 encoded logo
      try {
        // Extract image type from data URL prefix if present
        const dataUrlMatch = logoData.match(/^data:image\/(\w+);base64,/);
        if (dataUrlMatch) {
          const format = dataUrlMatch[1].toLowerCase();
          // Map format to supported types
          if (format === "jpeg") {
            imageType = "jpg";
          } else if (format === "png" || format === "gif" || format === "bmp") {
            imageType = format as "png" | "gif" | "bmp";
          }
        }

        // Remove data URL prefix if present
        const base64Data = logoData.replace(/^data:image\/\w+;base64,/, "");
        imageBuffer = Buffer.from(base64Data, "base64");
      } catch (error) {
        console.error("Error decoding base64 logo:", error);
      }
    } else if (logoPath && fs.existsSync(logoPath)) {
      // Handle file path logo
      try {
        imageBuffer = fs.readFileSync(logoPath);
        // Determine image type from file extension
        const ext = path.extname(logoPath).toLowerCase();
        const imageTypeMap: Record<string, "jpg" | "png" | "gif" | "bmp"> = {
          ".jpg": "jpg",
          ".jpeg": "jpg",
          ".png": "png",
          ".gif": "gif",
          ".bmp": "bmp",
        };
        imageType = imageTypeMap[ext] || "png";
      } catch (error) {
        console.error("Error reading logo file:", error);
      }
    }

    // Add logo to document if we have image data
    if (imageBuffer) {
      try {
        paragraphs.push(
          new Paragraph({
            children: [
              new ImageRun({
                type: imageType,
                data: imageBuffer,
                transformation: {
                  width: 200,
                  height: 100,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
        );
      } catch (error) {
        console.error("Error adding logo to document:", error);
        // Continue without logo if there's an error
      }
    }

    // Add title with primary color if specified
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    );

    // Add each section
    for (const section of sections) {
      const headingLevel =
        section.level === 2
          ? HeadingLevel.HEADING_2
          : section.level === 3
            ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_1;

      // Add section heading
      paragraphs.push(
        new Paragraph({
          text: section.title,
          heading: headingLevel,
          spacing: { before: 300, after: 200 },
        }),
      );

      // Split content into paragraphs and add them
      const contentParagraphs = section.content
        .split("\n")
        .filter((p) => p.trim().length > 0);

      for (const para of contentParagraphs) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(para)],
            spacing: { after: 120 },
          }),
        );
      }
    }

    // Create document with styling
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
      styles: {
        default: {
          heading1: {
            run: {
              color: primaryColor?.replace("#", "") || "1E40AF",
              bold: true,
            },
          },
          heading2: {
            run: {
              color: secondaryColor?.replace("#", "") || "3B82F6",
              bold: true,
            },
          },
        },
      },
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    console.error("Error creating DOCX from template:", error);
    throw new Error(
      `Failed to create DOCX file from template. Details: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
