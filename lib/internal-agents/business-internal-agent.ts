/**
 * Internal agent for business - generates business-specific print complements
 * for business plan creation and sales proposals
 */

import type {
  InternalAgent,
  InternalAgentInput,
  InternalAgentOutput,
} from "./types";

/**
 * Business Internal Agent
 * Analyzes business characteristics and generates business-specific print complements
 */
export class BusinessInternalAgent implements InternalAgent {
  /**
   * Generate a business-specific print complement for business planning
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

      // Generate business-specific print complement
      const printComplement = this.generateBusinessComplement(
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

    // Extract key business-related points
    const businessKeywords = [
      "revenue",
      "market analysis",
      "target audience",
      "competitive advantage",
      "business model",
      "financial projections",
      "growth strategy",
      "value proposition",
      "market opportunity",
      "executive summary",
      "SWOT analysis",
      "ROI",
      "KPI",
    ];

    info.keyPoints = businessKeywords
      .filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))
      .map((keyword) => `Includes ${keyword}`);

    // Detect business plan sections
    if (text.toLowerCase().includes("executive summary")) {
      info.keyPoints?.push("Contains executive summary");
    }

    if (
      text.toLowerCase().includes("financial") ||
      text.toLowerCase().includes("budget")
    ) {
      info.keyPoints?.push("Financial information present");
    }

    if (
      text.toLowerCase().includes("market") &&
      text.toLowerCase().includes("analysis")
    ) {
      info.keyPoints?.push("Market analysis included");
    }

    // Determine tone based on content
    if (text.toLowerCase().includes("innovative") || text.includes("disrupt")) {
      info.tone = "innovative";
    } else if (
      text.toLowerCase().includes("traditional") ||
      text.toLowerCase().includes("established")
    ) {
      info.tone = "conservative";
    }

    return info;
  }

  /**
   * Generate business-specific print complement
   */
  private generateBusinessComplement(
    extractedInfo: InternalAgentOutput["extractedInfo"],
    fullText: string,
  ): string {
    const parts: string[] = [];

    // Add company context
    if (extractedInfo?.companyName) {
      parts.push(`Client: ${extractedInfo.companyName}`);
    }

    if (extractedInfo?.industry) {
      parts.push(`Industry Focus: ${extractedInfo.industry}`);
    }

    // Add key business characteristics
    if (extractedInfo?.keyPoints && extractedInfo.keyPoints.length > 0) {
      parts.push(
        `Business Plan Elements:\n- ${extractedInfo.keyPoints.join("\n- ")}`,
      );
    }

    // Add business-specific guidelines
    parts.push(`
Business Plan Guidelines:
- Maintain ${extractedInfo?.tone || "professional"} tone throughout
- Focus on data-driven insights and measurable outcomes
- Structure content with clear executive summaries
- Include financial projections and ROI analysis
- Emphasize competitive advantages and market opportunities
- Use client branding and specific industry terminology
- Ensure comprehensive SWOT analysis coverage
- Highlight scalability and growth potential`);

    // Add formatting preferences
    parts.push(`
Document Formatting Preferences:
- Use professional business plan structure
- Include table of contents for long documents
- Present financial data in tables and charts
- Use bullet points for key highlights
- Maintain consistent heading hierarchy
- Include appendices for detailed data`);

    // Add extracted content summary if available
    if (fullText && fullText.length > 0) {
      const summary = fullText.substring(0, 600);
      parts.push(
        `Business Context:\n${summary}${fullText.length > 600 ? "..." : ""}`,
      );
    }

    return parts.join("\n\n");
  }
}

/**
 * Export singleton instance for internal use
 */
export const businessInternalAgent = new BusinessInternalAgent();
