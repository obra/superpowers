# Rate Limiting & Abuse Prevention

## Where Rate Limiting Is Required

Every one of these endpoints needs rate limiting. AI assistants almost never add it:

- **Auth endpoints** — login, register, password reset, OTP verification, magic link. Without limits, attackers can brute-force passwords or enumerate accounts.
- **AI API calls** — Any endpoint that calls OpenAI, Anthropic, or similar. A single user can drain your entire monthly budget in minutes.
- **Email / SMS sending** — Attackers can use your app as a spam relay.
- **File processing** — Upload, resize, convert. CPU-intensive operations without limits enable denial-of-service.
- **Webhook-like endpoints** — Anything accepting external input at scale.

## Don't Store Rate Limits in Public Tables

If rate limit counters live in a Supabase public table, users can reset their own counters via the REST API. Use:

- **Upstash Redis** — Serverless Redis with built-in rate limiting primitives
- **Private schema table** — Not exposed via PostgREST
- **Middleware-level limiting** — At the edge or API gateway
- **In-memory stores** — For single-server deployments (Redis for multi-server)

## Combine Per-IP and Per-User Limiting

- IP-only limits are defeated by rotating IPs (trivial with VPNs or botnets)
- User-only limits are defeated by creating new accounts
- Use both together for effective protection

## Billing Protection

- Set billing alerts on every cloud provider (AWS, GCP, Vercel, etc.)
- Set **hard spending caps** on AI API providers (OpenAI, Anthropic)
- Use per-user usage quotas with hard limits, not just soft warnings
- Monitor for anomalous usage patterns (sudden spikes, requests at odd hours)

## Implementation Pattern

```typescript
// Example: rate limiting with Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }
  // ... handle request
}
```
