# User Agent Parameters Collection

## Overview

This implementation adds a new MongoDB collection to store agent-specific parameters per user. This allows each user to customize the behavior of agents with business-specific context.

## Database Schema

### UserAgentParams Model

Located in: `/lib/models/user-agent-params.ts`

**Fields:**
- `userId`: ObjectId (reference to User collection)
- `agentId`: String (enum: 'sales', 'support', 'business')
- `promptComplement`: String (additional business-specific prompt context)
- `createdAt`: Date (auto-generated)
- `updatedAt`: Date (auto-generated)

**Indexes:**
- Compound unique index on `(userId, agentId)` - ensures one parameter set per user per agent

## API Endpoints

Located in: `/app/api/user-agent-params/route.ts`

### GET /api/user-agent-params

Retrieve the prompt complement for a specific agent.

**Query Parameters:**
- `agentId` (required): The agent identifier ('sales', 'support', or 'business')

**Response:**
```json
{
  "agentId": "sales",
  "promptComplement": "Our company specializes in...",
  "updatedAt": "2024-02-08T01:00:00.000Z"
}
```

### POST /api/user-agent-params

Create or update the prompt complement for a specific agent.

**Body:**
```json
{
  "agentId": "sales",
  "promptComplement": "Our company is a B2B SaaS provider specializing in AI solutions..."
}
```

**Response:**
```json
{
  "success": true,
  "agentId": "sales",
  "promptComplement": "Our company is a B2B SaaS provider...",
  "updatedAt": "2024-02-08T01:00:00.000Z"
}
```

### DELETE /api/user-agent-params

Delete the prompt complement for a specific agent.

**Query Parameters:**
- `agentId` (required): The agent identifier

**Response:**
```json
{
  "success": true,
  "message": "Prompt complement deleted successfully"
}
```

## Integration with Agents

### Utility Function

Located in: `/lib/agent-utils.ts`

The `getAgentInstructionsWithComplement()` function:
1. Retrieves the authenticated user's session
2. Queries the database for agent-specific parameters
3. Appends the prompt complement to the base instructions
4. Returns the combined instructions

**Usage in Agent Routes:**

Each agent route now dynamically creates the agent instance with user-specific instructions:

```typescript
// Get agent instructions with user-specific prompt complement
const instructions = await getAgentInstructionsWithComplement(
  BASE_INSTRUCTIONS,
  "sales",
);

// Create agent with user-specific instructions
const agent = new ToolLoopAgent({
  model: openai("gpt-4o"),
  instructions,
  tools: agentTools,
});
```

## Modified Files

1. **New Files:**
   - `/lib/models/user-agent-params.ts` - Mongoose model
   - `/lib/agent-utils.ts` - Utility function for fetching and appending prompt complement
   - `/app/api/user-agent-params/route.ts` - CRUD API endpoints

2. **Modified Files:**
   - `/app/api/agents/sales/route.ts` - Integrated prompt complement
   - `/app/api/agents/support/route.ts` - Integrated prompt complement
   - `/app/api/agents/business/route.ts` - Integrated prompt complement

## How It Works

1. **Setting up prompt complement:**
   - User (or admin) makes a POST request to `/api/user-agent-params` with agent-specific context
   - The prompt complement is stored in the database, associated with the user and agent

2. **Agent execution:**
   - When a user sends a message to an agent
   - The agent route handler calls `getAgentInstructionsWithComplement()`
   - The function fetches the user's prompt complement from the database
   - The complement is appended to the base instructions under a "BUSINESS-SPECIFIC CONTEXT" section
   - The agent is created dynamically with these customized instructions
   - The agent processes the message with the enhanced context

3. **Example:**

   **Base Instructions:**
   ```
   You are an AI agent for sales...
   ```

   **After adding prompt complement:**
   ```
   You are an AI agent for sales...
   
   --- BUSINESS-SPECIFIC CONTEXT ---
   Our company is Acme Corp, a B2B SaaS provider specializing in 
   cloud infrastructure solutions. We target enterprise clients 
   with 500+ employees...
   ```

## Testing

### Manual Testing Steps

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Create a prompt complement:**
   ```bash
   curl -X POST http://localhost:3000/api/user-agent-params \
     -H "Content-Type: application/json" \
     -d '{
       "agentId": "sales",
       "promptComplement": "Our company specializes in AI-powered solutions..."
     }'
   ```

3. **Retrieve the prompt complement:**
   ```bash
   curl http://localhost:3000/api/user-agent-params?agentId=sales
   ```

4. **Test with the agent:**
   - Open the application in a browser
   - Select the Sales agent
   - Send a message
   - Observe that the agent responds with context from your prompt complement

5. **Delete the prompt complement:**
   ```bash
   curl -X DELETE http://localhost:3000/api/user-agent-params?agentId=sales
   ```

## Security Considerations

- All endpoints require authentication via `getServerSession()`
- Users can only access and modify their own agent parameters
- Agent IDs are validated against a whitelist
- Input is sanitized (trimmed) before storage
- MongoDB schema validation ensures data integrity

## Future Enhancements

Possible extensions to this feature:
- Add more parameter types (temperature, model selection, etc.)
- UI for managing agent parameters in the settings panel
- Admin interface to set default prompts for all users
- Version history for prompt complements
- Templates for common business types
