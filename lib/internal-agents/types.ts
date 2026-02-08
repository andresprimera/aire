/**
 * Types for internal agents that generate business-specific print complements
 */

/**
 * Input for internal agents - can accept files or string content
 */
export interface InternalAgentInput {
  /**
   * File data - optional Uint8Array or string content
   */
  files?: {
    name: string;
    content: Uint8Array | string;
    mimeType?: string;
  }[];

  /**
   * Raw text/string content with business characteristics
   */
  text?: string;

  /**
   * Additional business information
   */
  businessInfo?: {
    industry?: string;
    companyName?: string;
    website?: string;
    description?: string;
    [key: string]: any;
  };
}

/**
 * Output from internal agents - business-specific print complement
 */
export interface InternalAgentOutput {
  /**
   * Generated business-specific print complement
   * This will be used by the main agent to enhance its responses
   */
  printComplement: string;

  /**
   * Extracted business characteristics from input
   */
  extractedInfo?: {
    industry?: string;
    companyName?: string;
    keyPoints?: string[];
    tone?: string;
    [key: string]: any;
  };

  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message if any
   */
  error?: string;
}

/**
 * Internal agent interface
 */
export interface InternalAgent {
  /**
   * Generate a business-specific print complement
   */
  generateComplement(input: InternalAgentInput): Promise<InternalAgentOutput>;
}
