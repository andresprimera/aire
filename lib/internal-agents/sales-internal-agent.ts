/**
 * Internal agent for sales - generates business-specific print complements
 * for sales strategies and customer engagement
 */

import type {
  InternalAgent,
  InternalAgentInput,
  InternalAgentOutput,
} from "./types";

/**
 * Sales Internal Agent
 * Analyzes business characteristics and generates sales-specific print complements
 */
export class SalesInternalAgent implements InternalAgent {
  /**
   * Generate a business-specific print complement for sales interactions
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

      // Generate sales-specific print complement
      const printComplement = this.generateSalesComplement(
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
      tone: "persuasive",
    };

    // Extract key sales-related points
    const salesKeywords = [
      "pricing",
      "discount",
      "promotion",
      "lead generation",
      "conversion",
      "pipeline",
      "CRM",
      "sales funnel",
      "customer acquisition",
      "upsell",
      "cross-sell",
      "demo",
      "proposal",
      "quotation",
      "closing rate",
    ];

    info.keyPoints = salesKeywords
      .filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))
      .map((keyword) => `Mentions ${keyword}`);

    // Detect sales strategies
    if (
      text.toLowerCase().includes("b2b") ||
      text.toLowerCase().includes("enterprise")
    ) {
      info.keyPoints?.push("B2B/Enterprise sales focus");
    }

    if (
      text.toLowerCase().includes("b2c") ||
      text.toLowerCase().includes("consumer")
    ) {
      info.keyPoints?.push("B2C/Consumer sales focus");
    }

    if (
      text.toLowerCase().includes("subscription") ||
      text.toLowerCase().includes("recurring")
    ) {
      info.keyPoints?.push("Subscription-based model");
    }

    // Detect value propositions
    if (
      text.toLowerCase().includes("value proposition") ||
      text.toLowerCase().includes("unique selling")
    ) {
      info.keyPoints?.push("Value proposition defined");
    }

    // Determine tone based on content
    if (
      text.toLowerCase().includes("aggressive") ||
      text.toLowerCase().includes("competitive")
    ) {
      info.tone = "assertive";
    } else if (
      text.toLowerCase().includes("consultative") ||
      text.toLowerCase().includes("advisory")
    ) {
      info.tone = "consultative";
    }

    return info;
  }

  /**
   * Generate sales-specific print complement
   */
  private generateSalesComplement(
    extractedInfo: InternalAgentOutput["extractedInfo"],
    fullText: string,
  ): string {
    const parts: string[] = [];

    // Add company context
    if (extractedInfo?.companyName) {
      parts.push(`Target Company: ${extractedInfo.companyName}`);
    }

    if (extractedInfo?.industry) {
      parts.push(`Industry: ${extractedInfo.industry}`);
    }

    // Add key sales characteristics
    if (extractedInfo?.keyPoints && extractedInfo.keyPoints.length > 0) {
      parts.push(
        `Sales Characteristics:\n- ${extractedInfo.keyPoints.join("\n- ")}`,
      );
    }

    // Add sales-specific guidelines
    parts.push(`
Sales Strategy Guidelines:
- Use ${extractedInfo?.tone || "persuasive"} communication style
- Focus on value proposition and ROI
- Address customer pain points directly
- Highlight competitive advantages
- Include clear call-to-action
- Use social proof and testimonials when available
- Emphasize urgency and scarcity appropriately
- Build trust through transparency`);

    // Add sales process guidelines
    parts.push(`
Sales Process Best Practices:
- Qualify leads based on budget, authority, need, and timeline (BANT)
- Personalize communication based on customer context
- Use consultative selling approach
- Follow up consistently and strategically
- Track all interactions in CRM
- Provide value at every touchpoint
- Address objections proactively`);

    // Add pricing and proposal guidelines
    parts.push(`
Pricing & Proposal Guidelines:
- Present pricing clearly and confidently
- Offer tiered options when appropriate
- Justify value over price
- Include flexible payment terms
- Provide detailed breakdowns
- Use professional proposal templates`);

    // Add extracted content summary if available
    if (fullText && fullText.length > 0) {
      const summary = fullText.substring(0, 600);
      parts.push(
        `Sales Context:\n${summary}${fullText.length > 600 ? "..." : ""}`,
      );
    }

    return parts.join("\n\n");
  }
}

/**
 * Export singleton instance for internal use
 */
export const salesInternalAgent = new SalesInternalAgent();
