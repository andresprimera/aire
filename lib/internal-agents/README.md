# Internal Agents Module

This module provides internal agents that generate business-specific print complements for use with the main agents. These agents analyze business characteristics and information from files or strings and produce domain-specific context that enhances agent responses.

## Overview

Each internal agent is specialized for a specific domain:

- **Support Agent**: Post-sales support and customer service
- **Business Agent**: Business plans and sales proposals  
- **Sales Agent**: Sales strategies and customer engagement

## Architecture

Internal agents follow a consistent interface:

```typescript
interface InternalAgent {
  generateComplement(input: InternalAgentInput): Promise<InternalAgentOutput>;
}
```

### Input

Agents can accept:
- **Files**: Array of files with content (as Uint8Array or string)
- **Text**: Raw text/string content with business characteristics
- **Business Info**: Optional structured business information (company name, industry, etc.)

### Output

Agents return:
- **Print Complement**: Generated business-specific text to enhance main agent responses
- **Extracted Info**: Key business characteristics identified from the input
- **Success Status**: Boolean indicating if the operation succeeded
- **Error**: Optional error message if something went wrong

## Usage

### Basic Example

```typescript
import { supportInternalAgent } from "@/lib/internal-agents";

const result = await supportInternalAgent.generateComplement({
  text: "Our company offers 24/7 support with 2-hour response time guarantee.",
  businessInfo: {
    companyName: "TechSupport Inc.",
    industry: "Technology Support",
  },
});

console.log(result.printComplement);
// Contains support-specific guidelines and context
```

### With Files

```typescript
import { businessInternalAgent } from "@/lib/internal-agents";

const encoder = new TextEncoder();

const result = await businessInternalAgent.generateComplement({
  files: [
    {
      name: "business-plan.txt",
      content: encoder.encode("Executive summary..."),
      mimeType: "text/plain",
    },
  ],
  businessInfo: {
    companyName: "SaaS Co.",
    industry: "Software",
  },
});
```

### Mixed Input

```typescript
import { salesInternalAgent } from "@/lib/internal-agents";

const result = await salesInternalAgent.generateComplement({
  files: [
    {
      name: "pricing.txt",
      content: encoder.encode("Tiered pricing model..."),
    },
  ],
  text: "Target B2B customers with subscription model",
  businessInfo: {
    companyName: "Sales Inc.",
  },
});
```

## Agent Specifications

### Support Internal Agent

Analyzes support-related content and generates complements focusing on:
- Warranty and return policies
- Support availability (24/7, business hours)
- SLA and response times
- Ticket management and escalation
- Customer satisfaction priorities

### Business Internal Agent

Analyzes business plan content and generates complements focusing on:
- Executive summaries
- Market analysis and opportunities
- Financial projections and ROI
- Competitive advantages
- Business model and value propositions
- SWOT analysis
- Document formatting preferences

### Sales Internal Agent

Analyzes sales strategy content and generates complements focusing on:
- Pricing and discount strategies
- Lead generation and conversion
- Sales funnel and pipeline
- B2B vs B2C approaches
- Value propositions and competitive advantages
- Sales process best practices
- Proposal and quotation guidelines

## API Reference

### Types

```typescript
interface InternalAgentInput {
  files?: {
    name: string;
    content: Uint8Array | string;
    mimeType?: string;
  }[];
  text?: string;
  businessInfo?: {
    industry?: string;
    companyName?: string;
    website?: string;
    description?: string;
    [key: string]: any;
  };
}

interface InternalAgentOutput {
  printComplement: string;
  extractedInfo?: {
    industry?: string;
    companyName?: string;
    keyPoints?: string[];
    tone?: string;
    [key: string]: any;
  };
  success: boolean;
  error?: string;
}
```

### Exports

```typescript
// Singleton instances
export { supportInternalAgent } from "./support-internal-agent";
export { businessInternalAgent } from "./business-internal-agent";
export { salesInternalAgent } from "./sales-internal-agent";

// Classes (for custom instantiation if needed)
export { SupportInternalAgent } from "./support-internal-agent";
export { BusinessInternalAgent } from "./business-internal-agent";
export { SalesInternalAgent } from "./sales-internal-agent";

// Types
export type { InternalAgent, InternalAgentInput, InternalAgentOutput } from "./types";
```

## Implementation Status

✅ **Completed:**
- Type definitions
- Support internal agent implementation
- Business internal agent implementation
- Sales internal agent implementation
- Module exports
- Documentation and examples

⏳ **Not Connected Yet:**
- Integration with main agent routes (as per requirements)
- Database persistence of generated complements
- UI for managing complements

## Future Enhancements

Potential future improvements:
- Caching of generated complements
- Integration with LLM for more sophisticated analysis
- Support for additional file formats (PDF, DOCX)
- A/B testing of different complement strategies
- Analytics on complement effectiveness

## Testing

See `examples.ts` for usage examples. To run examples:

```typescript
import { runExamples } from "@/lib/internal-agents/examples";

await runExamples();
```

## Notes

- These agents are for **internal use only**
- They are **NOT connected** to the main agent routes yet (as per requirements)
- Each agent uses domain-specific heuristics to analyze content
- The print complements are designed to enhance the main agent's responses with business-specific context
