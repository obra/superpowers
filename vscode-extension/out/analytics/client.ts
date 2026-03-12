import * as vscode from 'vscode';

interface AnalyticsEvent {
    type: string;
    timestamp: string;
    data: Record<string, unknown>;
}

export class AnalyticsClient {
    private enabled: boolean;
    private port: number;
    private eventQueue: AnalyticsEvent[] = [];
    private flushInterval?: ReturnType<typeof setInterval>;
    private isDisposed = false;

    constructor(enabled: boolean, port: number) {
        this.enabled = enabled;
        this.port = port;
        
        if (enabled) {
            this.flushInterval = setInterval(() => this.flush(), 30000);
        }
    }

    async trackEvent(type: string, data: Record<string, unknown> = {}): Promise<void> {
        if (!this.enabled || this.isDisposed) return;

        const event: AnalyticsEvent = {
            type,
            timestamp: new Date().toISOString(),
            data: { ...data, platform: process.platform }
        };

        this.eventQueue.push(event);
    }

    private async flush(): Promise<void> {
        if (this.eventQueue.length === 0 || this.isDisposed) return;

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
        } catch {
            // Server not running, re-queue
            if (this.eventQueue.length < 1000) {
                this.eventQueue.unshift(...events);
            }
        }
    }

    dispose(): void {
        this.isDisposed = true;
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = undefined;
        }
        this.flush().catch(() => {});
    }
}