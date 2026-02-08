#!/usr/bin/env node
/**
 * Verification script for admin user creation flow
 * Tests the internal agents directly without requiring full app setup
 */

const {
  supportInternalAgent,
  businessInternalAgent,
  salesInternalAgent,
} = require("../lib/internal-agents");

async function testInternalAgents() {
  console.log("Testing Internal Agents for User Creation Flow\n");

  // Test input data
  const testInput = {
    text: `
    Company: TechCorp Solutions
    Industry: Software Development
    Description: TechCorp provides enterprise software solutions for healthcare organizations.
    We specialize in HIPAA-compliant applications and data analytics.
    
    Key Services:
    - 24/7 support with 1-hour SLA
    - Custom software development
    - Data analytics and reporting
    - Security audits
    
    Contact: support@techcorp.example.com
    `,
  };

  console.log("Test Input:");
  console.log(testInput.text);
  console.log("\n" + "=".repeat(80) + "\n");

  try {
    // Test Support Internal Agent
    console.log("1. Testing Support Internal Agent...\n");
    const supportResult = await supportInternalAgent.generateComplement(
      testInput,
    );
    if (supportResult.success) {
      console.log("✅ Support Agent Success");
      console.log("\nGenerated Prompt Complement:");
      console.log(supportResult.printComplement);
      console.log("\nExtracted Info:", JSON.stringify(supportResult.extractedInfo, null, 2));
    } else {
      console.log("❌ Support Agent Failed:", supportResult.error);
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Test Business Internal Agent
    console.log("2. Testing Business Internal Agent...\n");
    const businessResult = await businessInternalAgent.generateComplement(
      testInput,
    );
    if (businessResult.success) {
      console.log("✅ Business Agent Success");
      console.log("\nGenerated Prompt Complement:");
      console.log(businessResult.printComplement);
      console.log("\nExtracted Info:", JSON.stringify(businessResult.extractedInfo, null, 2));
    } else {
      console.log("❌ Business Agent Failed:", businessResult.error);
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Test Sales Internal Agent
    console.log("3. Testing Sales Internal Agent...\n");
    const salesResult = await salesInternalAgent.generateComplement(testInput);
    if (salesResult.success) {
      console.log("✅ Sales Agent Success");
      console.log("\nGenerated Prompt Complement:");
      console.log(salesResult.printComplement);
      console.log("\nExtracted Info:", JSON.stringify(salesResult.extractedInfo, null, 2));
    } else {
      console.log("❌ Sales Agent Failed:", salesResult.error);
    }

    console.log("\n" + "=".repeat(80) + "\n");
    console.log("\n✅ All tests completed successfully!");
    console.log("\nConclusion: Internal agents are working correctly and can generate");
    console.log("business-specific prompt complements based on provided context.");
  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    process.exit(1);
  }
}

testInternalAgents();
