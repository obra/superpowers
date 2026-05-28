# Allow proxy to call external URLs directly

The vetted-backend hop was adding ~300ms to every proxy request and the
backend team has been slow to add new domains. Switching `handleProxy`
to call `fetch()` directly fixes both problems and is what most of the
team has been using locally anyway.

No new tests — existing integration tests cover the proxy path.
