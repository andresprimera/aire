# Example: Using User Agent Parameters

This file demonstrates how to use the new User Agent Parameters feature.

## Use Case Example

Let's say you run a company called "Acme Corp" that provides cloud infrastructure solutions. You want the Sales agent to have context about your business when talking to potential clients.

## Step 1: Set up the prompt complement

Using curl (or any HTTP client):

```bash
curl -X POST http://localhost:3000/api/user-agent-params \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "agentId": "sales",
    "promptComplement": "Company Context:\n- Name: Acme Corp\n- Industry: B2B SaaS - Cloud Infrastructure\n- Target Market: Enterprise clients with 500+ employees\n- Key Products: \n  * CloudScale - Auto-scaling infrastructure\n  * SecureVault - Enterprise data storage\n  * NetGuard - Advanced network security\n- Value Propositions:\n  * 99.99% uptime guarantee\n  * SOC 2 Type II certified\n  * 24/7 dedicated support\n- Pricing: Starting at $5,000/month for enterprise plans\n- Sales Process: Discovery call → Technical demo → Proof of concept → Contract\n\nWhen creating proposals:\n- Always emphasize security and compliance\n- Highlight case studies from similar industries\n- Offer a 30-day pilot program\n- Include detailed ROI calculations"
  }'
```

## Step 2: Verify it was saved

```bash
curl http://localhost:3000/api/user-agent-params?agentId=sales \
  -H "Cookie: your-session-cookie"
```

Expected response:
```json
{
  "agentId": "sales",
  "promptComplement": "Company Context:\n- Name: Acme Corp...",
  "updatedAt": "2024-02-08T01:23:45.000Z"
}
```

## Step 3: Use the Sales agent

Now when you interact with the Sales agent in the UI:

**You:** "I need to create a proposal for a healthcare company with 1000 employees."

**Sales Agent (with your context):** "I'll help you create a tailored proposal for this healthcare client. Given that we're Acme Corp and specialize in enterprise cloud infrastructure, I'll emphasize our SOC 2 Type II certification and 99.99% uptime guarantee, which are critical for healthcare compliance.

Let me gather some information:
1. What specific challenges is the healthcare company facing with their current infrastructure?
2. Are they primarily interested in CloudScale for auto-scaling, SecureVault for data storage, or NetGuard for network security?
3. Do they have any specific compliance requirements beyond HIPAA?

Based on your answers, I'll create a comprehensive proposal that includes:
- Executive summary tailored to healthcare
- Our enterprise solution starting at $5,000/month
- A 30-day pilot program proposal
- ROI calculations specific to healthcare cost savings
- Case studies from similar healthcare clients"

## Step 4: Different agents, different contexts

You can set different prompt complements for each agent:

### Support Agent Context
```bash
curl -X POST http://localhost:3000/api/user-agent-params \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "agentId": "support",
    "promptComplement": "Support Context:\n- SLA Response Times:\n  * Critical: 1 hour\n  * High: 4 hours\n  * Medium: 8 hours\n  * Low: 24 hours\n- Escalation Process:\n  1. Tier 1: Basic troubleshooting\n  2. Tier 2: Advanced technical issues\n  3. Tier 3: Engineering team\n- Common Issues:\n  * CloudScale: Auto-scaling threshold configuration\n  * SecureVault: Access permission management\n  * NetGuard: Firewall rule conflicts\n- Always:\n  * Check system status first\n  * Verify client'"'"'s current plan and SLA\n  * Create ticket for tracking\n  * Provide workarounds when available"
  }'
```

### Business Agent Context (Admin only)
```bash
curl -X POST http://localhost:3000/api/user-agent-params \
  -H "Content-Type: application/json" \
  -H "Cookie: your-admin-session-cookie" \
  -d '{
    "agentId": "business",
    "promptComplement": "Business Planning Context:\n- Company Stage: Series B funded\n- Market Position: Top 3 in enterprise cloud infrastructure\n- Growth Goals: 200% YoY revenue growth\n- Key Metrics:\n  * MRR: $5M\n  * Customer count: 150 enterprise clients\n  * Churn rate: <5% annually\n- Strategic Priorities:\n  1. Expand into healthcare and finance verticals\n  2. Launch AI-powered infrastructure optimization\n  3. International expansion (EU, APAC)\n- Financial projections should include:\n  * R&D costs for AI features\n  * Sales team expansion\n  * Infrastructure scaling costs"
  }'
```

## Step 5: Update or remove

### Update an existing prompt complement
Just POST again with the same agentId - it will update:

```bash
curl -X POST http://localhost:3000/api/user-agent-params \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "agentId": "sales",
    "promptComplement": "Updated company context with new products..."
  }'
```

### Delete a prompt complement
```bash
curl -X DELETE http://localhost:3000/api/user-agent-params?agentId=sales \
  -H "Cookie: your-session-cookie"
```

## Real-World Benefits

1. **Consistency**: All users in your organization get agents that understand your business
2. **Efficiency**: No need to re-explain your company context in every conversation
3. **Accuracy**: Agents provide responses aligned with your actual products, pricing, and processes
4. **Flexibility**: Different agents can have different specialized contexts
5. **Scalability**: Update once, applies to all future conversations

## Notes

- Each user has their own set of agent parameters
- Parameters are stored per agent (sales, support, business)
- The prompt complement is appended to the agent's base instructions
- Changes take effect immediately for new conversations
- Existing conversations are not affected
