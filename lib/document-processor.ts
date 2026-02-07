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
} from "docx";

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
    throw new Error("Failed to create DOCX file");
  }
}
