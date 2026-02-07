/**
 * Document processing utilities for extracting text from various file formats
 */
import mammoth from "mammoth";

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
