/**
 * Analytics Client
 * Sends usage events to the analytics dashboard
 */

import * as vscode from 'vscode';

/**
 * Represents an analytics event to be tracked.
 */
interface AnalyticsEvent {
    /** Event type identifier */
    type: string;
    /** ISO timestamp of the event */
    timestamp: string;
    /** Event metadata */
    data: Record<string, unknown>;
}

/**
 * Client for sending analytics events to the dashboard server.
 * Handles batching, retry logic, and graceful disposal.
 */
export class AnalyticsClient {
    private enabled: boolean;
    private port: number;
    private eventQueue: AnalyticsEvent[] = [];
    private flushInterval?: ReturnType<typeof setInterval>;
    private isDisposed = false;

    /**
     * Creates a new AnalyticsClient instance.
     * @param enabled - Whether analytics tracking is enabled
     * @param port - Port number for the analytics server
     */
    constructor(enabled: boolean, port: number) {
        this.enabled = enabled;
        this.port = port;

        if (enabled) {
            // Flush events every 30 seconds
            this.flushInterval = setInterval(() => this.flush(), 30000);
        }
    }

    /**
     * Tracks a generic analytics event.
     * @param type - Event type identifier
     * @param data - Event metadata
     */
    async trackEvent(type: string, data: Record<string, unknown> = {}): Promise<void> {
        if (!this.enabled || this.isDisposed) {
            return;
        }

        const event: AnalyticsEvent = {
            type,
            timestamp: new Date().toISOString(),
            data: {
                ...data,
                platform: process.platform,
                vscodeVersion: vscode.version
            }
        };

        this.eventQueue.push(event);

        // Flush immediately for important events
        if (type.includes('executed') || type.includes('error')) {
            await this.flush();
        }
    }

    /**
     * Tracks a skill invocation event.
     * @param skillName - Name of the invoked skill
     * @param metadata - Optional invocation metadata
     */
    async trackSkillInvocation(skillName: string, metadata: {
        tokens?: number;
        duration?: number;
        success?: boolean;
        source?: string;
    } = {}): Promise<void> {
        await this.trackEvent('skill_invoked', {
            skillName,
            ...metadata
        });
    }

    /**
     * Tracks a code action event.
     * @param action - The action type
     * @param skillName - The related skill name
     */
    async trackCodeAction(action: string, skillName: string): Promise<void> {
        await this.trackEvent('code_action', {
            action,
            skillName
        });
    }

    /**
     * Flushes queued events to the analytics server.
     * Re-queues events on failure for retry.
     */
    private async flush(): Promise<void> {
        if (this.eventQueue.length === 0 || this.isDisposed) {
            return;
        }

        const events = [...this.eventQueue];
        this.eventQueue = [];

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        try {
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`http://localhost:${this.port}/api/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events }),
                signal: controller.signal
            });

            if (!response.ok) {
                // Re-queue events on HTTP error (limit queue size)
                if (this.eventQueue.length < 1000) {
                    this.eventQueue.unshift(...events);
                }
            }
        } catch {
            // Server not running or request failed
            // Re-queue events (limit queue size)
            if (this.eventQueue.length < 1000) {
                this.eventQueue.unshift(...events);
            }
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }

    /**
     * Disposes the client, flushing any remaining events first.
     * Must be awaited to ensure final flush completes.
     */
    async dispose(): Promise<void> {
        // Flush BEFORE setting isDisposed so flush can complete
        await this.flush();

        // Now mark as disposed
        this.isDisposed = true;

        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = undefined;
        }
    }
}
