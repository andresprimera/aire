/**
 * Internal Agents Module
 *
 * This module exports internal agents that generate business-specific print complements
 * for use with the main agents. These agents analyze business characteristics and information
 * from files or strings and produce domain-specific context that enhances agent responses.
 *
 * Each agent is specialized for a specific domain:
 * - Support: Post-sales support and customer service
 * - Business: Business plans and sales proposals
 * - Sales: Sales strategies and customer engagement
 *
 * Note: These agents are for internal use only and are not connected to the main agent routes.
 */

export {
  supportInternalAgent,
  SupportInternalAgent,
} from "./support-internal-agent";
export {
  businessInternalAgent,
  BusinessInternalAgent,
} from "./business-internal-agent";
export { salesInternalAgent, SalesInternalAgent } from "./sales-internal-agent";

export type {
  InternalAgent,
  InternalAgentInput,
  InternalAgentOutput,
} from "./types";
