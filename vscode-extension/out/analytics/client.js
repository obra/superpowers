"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsClient = void 0;
class AnalyticsClient {
    constructor(enabled, port) {
        this.eventQueue = [];
        this.isDisposed = false;
        this.enabled = enabled;
        this.port = port;
        if (enabled) {
            this.flushInterval = setInterval(() => this.flush(), 30000);
        }
    }
    async trackEvent(type, data = {}) {
        if (!this.enabled || this.isDisposed)
            return;
        const event = {
            type,
            timestamp: new Date().toISOString(),
            data: { ...data, platform: process.platform }
        };
        this.eventQueue.push(event);
    }
    async flush() {
        if (this.eventQueue.length === 0 || this.isDisposed)
            return;
        const events = [...this.eventQueue];
        this.eventQueue = [];
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            await fetch(`http://localhost:${this.port}/api/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        }
        catch {
            // Server not running, re-queue
            if (this.eventQueue.length < 1000) {
                this.eventQueue.unshift(...events);
            }
        }
    }
    dispose() {
        this.isDisposed = true;
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = undefined;
        }
        this.flush().catch(() => { });
    }
}
exports.AnalyticsClient = AnalyticsClient;
//# sourceMappingURL=client.js.map