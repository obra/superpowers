# AI / LLM Integration Security

## API Keys Are Server-Side Only

AI API keys (OpenAI, Anthropic, Google, etc.) must never appear in client-side code. They allow unlimited API usage at your expense. A leaked key can drain thousands of dollars in minutes.

- No `NEXT_PUBLIC_OPENAI_API_KEY`
- No API keys in React Native / Expo bundles
- No API keys in client-side JavaScript

All AI API calls go through your backend. The client sends the user's message to your server; your server calls the AI API.

## Spending Caps

Set hard spending caps on every AI API provider:
- OpenAI: Usage limits in dashboard
- Anthropic: Spending limits in console
- Google: Budget alerts in Cloud Console

Also implement **per-user usage limits** in your application:
- Track token usage per user in your database
- Set daily/monthly caps per user or per tier
- Return a clear error when limits are exceeded
- Don't rely on the AI provider's caps alone — they may have lag

## Prompt Injection

User input must be sanitized before inclusion in prompts. Never concatenate raw user input into system prompts:

```typescript
// BAD: user can override system instructions
const prompt = `You are a helpful assistant. User says: ${userInput}`;

// BETTER: separate system and user messages
const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: userInput },
];
```

Even with separate messages, be aware that sophisticated prompt injection can still occur. For high-stakes applications, consider:
- Input validation and filtering
- Output validation before acting on LLM responses
- Limiting the LLM's capabilities (no tool access for user-facing chat)

## LLM Output Is Untrusted

LLM responses should be treated as untrusted user input:

- **Sanitize before rendering as HTML** — LLM output can contain script tags or event handlers
- **Never execute LLM output as code** without sandboxing
- **Validate tool/function call parameters** — if using function calling, validate all returned parameters against an allowlist and schema before executing

## Tool / Function Calling

If your application gives an LLM access to tools (database queries, API calls, file operations):
- Restrict operations to a safe allowlist
- Validate all parameters from the LLM against a schema
- Use least-privilege access (read-only where possible)
- Log all tool invocations for audit
- Never let the LLM construct raw SQL or shell commands from user input
