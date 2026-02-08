/**
 * Internal agent for support - generates business-specific print complements
 * for post-sales support interactions
 */

import type {
  InternalAgent,
  InternalAgentInput,
  InternalAgentOutput,
} from "./types";

/**
 * Support Internal Agent
 * Analyzes business characteristics and generates support-specific print complements
 */
export class SupportInternalAgent implements InternalAgent {
  /**
   * Generate a business-specific print complement for support interactions
   */
  async generateComplement(
    input: InternalAgentInput,
  ): Promise<InternalAgentOutput> {
    try {
      // Extract information from files if provided
      let extractedText = "";
      if (input.files && input.files.length > 0) {
        extractedText = input.files
          .map((file) => {
            const content =
              typeof file.content === "string"
                ? file.content
                : new TextDecoder().decode(file.content);
            return `[File: ${file.name}]\n${content}`;
          })
          .join("\n\n");
      }

      // Combine with text input
      const fullText = [extractedText, input.text].filter(Boolean).join("\n\n");

      // Extract business characteristics
      const extractedInfo = this.extractBusinessInfo(
        fullText,
        input.businessInfo,
      );

      // Generate support-specific print complement
      const printComplement = this.generateSupportComplement(
        extractedInfo,
        fullText,
      );

      return {
        success: true,
        printComplement,
        extractedInfo,
      };
    } catch (error) {
      return {
        success: false,
        printComplement: "",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Extract business information from text and provided business info
   */
  private extractBusinessInfo(
    text: string,
    businessInfo?: InternalAgentInput["businessInfo"],
  ): InternalAgentOutput["extractedInfo"] {
    const info: InternalAgentOutput["extractedInfo"] = {
      industry: businessInfo?.industry,
      companyName: businessInfo?.companyName,
      keyPoints: [],
      tone: "professional",
    };

    // Extract key support-related points
    const supportKeywords = [
      "warranty",
      "return policy",
      "support hours",
      "escalation",
      "SLA",
      "response time",
      "ticket priority",
      "customer satisfaction",
    ];

    info.keyPoints = supportKeywords
      .filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))
      .map((keyword) => `Mentions ${keyword}`);

    // Detect industry-specific support patterns
    if (text.toLowerCase().includes("24/7") || text.includes("24-hour")) {
      info.keyPoints?.push("24/7 support availability");
    }

    if (
      text.toLowerCase().includes("technical support") ||
      text.toLowerCase().includes("tech support")
    ) {
      info.keyPoints?.push("Technical support focus");
    }

    return info;
  }

  /**
   * Generate support-specific print complement
   */
  private generateSupportComplement(
    extractedInfo: InternalAgentOutput["extractedInfo"],
    fullText: string,
  ): string {
    const parts: string[] = [];

    // Add company context
    if (extractedInfo?.companyName) {
      parts.push(`Company Context: ${extractedInfo.companyName}`);
    }

    if (extractedInfo?.industry) {
      parts.push(`Industry: ${extractedInfo.industry}`);
    }

    // Add key support characteristics
    if (extractedInfo?.keyPoints && extractedInfo.keyPoints.length > 0) {
      parts.push(
        `Support Characteristics:\n- ${extractedInfo.keyPoints.join("\n- ")}`,
      );
    }

    // Add support-specific guidelines
    parts.push(`
Support Guidelines:
- Prioritize customer satisfaction and issue resolution
- Maintain ${extractedInfo?.tone || "professional"} tone
- Reference warranty and return policies when relevant
- Escalate complex issues appropriately
- Track all interactions for follow-up`);

    // Add extracted content summary if available
    if (fullText && fullText.length > 0) {
      const summary = fullText.substring(0, 500);
      parts.push(
        `Business Context Summary:\n${summary}${fullText.length > 500 ? "..." : ""}`,
      );
    }

    return parts.join("\n\n");
  }
}

/**
 * Export singleton instance for internal use
 */
export const supportInternalAgent = new SupportInternalAgent();
