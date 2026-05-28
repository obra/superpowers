/**
 * Per-handler observability. Every concrete EventHandler MUST call
 * `recordHandled` on the happy path; SRE dashboards and SLO alerts
 * key off the resulting `events_handled_total{handler=...}` and
 * `event_handler_latency_ms{handler=...}` series. Handlers that
 * silently skip this break alerting for their own event type without
 * any compile-time signal.
 */

import { incrementCounter, observeHistogram } from './prom';

export const metrics = {
    recordHandled(handlerName: string, latencyMs: number): void {
        incrementCounter('events_handled_total', { handler: handlerName });
        observeHistogram('event_handler_latency_ms', latencyMs, { handler: handlerName });
    },
};
