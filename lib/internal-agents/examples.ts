/**
 * Example usage of internal agents
 *
 * This file demonstrates how to use the internal agents to generate
 * business-specific print complements for different agent types.
 *
 * Note: This is for documentation purposes only and is NOT connected to the main agents yet.
 */

import {
  supportInternalAgent,
  businessInternalAgent,
  salesInternalAgent,
} from "./index";

/**
 * Example 1: Support Internal Agent
 * Generate a print complement from business information
 */
async function exampleSupportAgent() {
  const result = await supportInternalAgent.generateComplement({
    text: "Our company offers 24/7 technical support with guaranteed response time under 2 hours. We provide comprehensive warranty coverage for all products.",
    businessInfo: {
      companyName: "TechSupport Inc.",
      industry: "Technology Support Services",
    },
  });

  console.log("Support Agent Output:");
  console.log(result);
  return result;
}

/**
 * Example 2: Business Internal Agent
 * Generate a print complement from a business plan document
 */
async function exampleBusinessAgent() {
  const businessPlanText = `
    Executive Summary:
    Our company is targeting the B2B market with innovative SaaS solutions.
    Market analysis shows significant growth opportunity in the enterprise segment.
    Financial projections indicate 40% YoY growth with strong ROI.
  `;

  const result = await businessInternalAgent.generateComplement({
    text: businessPlanText,
    businessInfo: {
      companyName: "SaaS Solutions Co.",
      industry: "Software as a Service",
      website: "https://example.com",
    },
  });

  console.log("Business Agent Output:");
  console.log(result);
  return result;
}

/**
 * Example 3: Sales Internal Agent
 * Generate a print complement from files and text
 */
async function exampleSalesAgent() {
  const encoder = new TextEncoder();

  const result = await salesInternalAgent.generateComplement({
    files: [
      {
        name: "pricing-strategy.txt",
        content: encoder.encode(
          "Tiered pricing model with enterprise discounts. Focus on value-based selling and consultative approach.",
        ),
        mimeType: "text/plain",
      },
    ],
    text: "Target B2B customers with subscription-based model. Emphasize ROI and competitive pricing.",
    businessInfo: {
      companyName: "Sales Pro Inc.",
      industry: "B2B Software Sales",
    },
  });

  console.log("Sales Agent Output:");
  console.log(result);
  return result;
}

/**
 * Example 4: Using only files
 */
async function exampleFileOnlyInput() {
  const encoder = new TextEncoder();

  const result = await supportInternalAgent.generateComplement({
    files: [
      {
        name: "support-policies.txt",
        content: encoder.encode(
          "Standard warranty: 2 years. Priority support available. SLA guarantees 99.9% uptime.",
        ),
        mimeType: "text/plain",
      },
    ],
  });

  console.log("File Only Input Output:");
  console.log(result);
  return result;
}

/**
 * Run all examples
 */
async function _runExamples() {
  console.log("=== Internal Agents Usage Examples ===\n");

  await exampleSupportAgent();
  console.log(`\n${"=".repeat(50)}\n`);

  await exampleBusinessAgent();
  console.log(`\n${"=".repeat(50)}\n`);

  await exampleSalesAgent();
  console.log(`\n${"=".repeat(50)}\n`);

  await exampleFileOnlyInput();
}

// Uncomment to run examples
// runExamples().catch(console.error);

export {
  exampleSupportAgent,
  exampleBusinessAgent,
  exampleSalesAgent,
  exampleFileOnlyInput,
};
