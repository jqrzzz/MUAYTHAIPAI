/**
 * Centralized AI model choices.
 *
 * Single source of truth for which model handles each kind of work.
 * Swap a model here once instead of hunting through 16 files.
 *
 * All models route through the Vercel AI SDK gateway (configured via
 * AI_GATEWAY_API_KEY). The strings are gateway-routed identifiers like
 * "openai/gpt-4o-mini" or "anthropic/claude-3-5-sonnet-latest".
 */

/**
 * FAST: extraction, classification, simple structured output.
 * Used for: discovery extract, owner inbox classify, faq suggest.
 * Optimize for cost + speed; voice doesn't matter much.
 */
export const MODEL_FAST = "openai/gpt-4o-mini"

/**
 * VOICE: content where tone + creativity matters.
 * Used for: social compose / batch, website AI editor, marketing copy,
 * personalized outreach.
 * Trade more cost for better human voice. Easy to upgrade to
 * "openai/gpt-4o" or "anthropic/claude-3-5-sonnet-latest" without
 * touching every consumer.
 */
export const MODEL_VOICE = "openai/gpt-4o-mini"

/**
 * REASONING: multi-step planning, complex tool use, agentic loops.
 * Used for: platform-admin command bar, OckOck owner agent.
 */
export const MODEL_REASONING = "openai/gpt-4o-mini"

/**
 * CHAT: customer-facing concierge — answering visitor questions in the
 * gym's voice. Wants to feel warm + on-brand.
 */
export const MODEL_CHAT = "openai/gpt-4o-mini"
