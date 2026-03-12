/**
 * Analytics Client
 * Sends usage events to the analytics dashboard
 */

import * as vscode from 'vscode';

interface AnalyticsEvent {
    type: string;
    timestamp: string;
    data: Record<string, any>;
}

export class AnalyticsClient {
    private enabled: boolean;
    private port: number;
    private eventQueue: AnalyticsEvent[] = [];
    private flushInterval?: NodeJS.Timeout;

    constructor(enabled: boolean, port: number) {
        this.enabled = enabled;
        this.port = port;
        
        if (enabled) {
            // Flush events every 30 seconds
            this.flushInterval = setInterval(() => this.flush(), 30000);
        }
    }

    async trackEvent(type: string, data: Record<string, any> = {}): Promise<void> {
        if (!this.enabled) return;

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

    async trackCodeAction(action: string, skillName: string): Promise<void> {
        await this.trackEvent('code_action', {
            action,
            skillName
        });
    }

    private async flush(): Promise<void> {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        try {
            const response = await fetch(`http://localhost:${this.port}/api/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events })
            });

            if (!response.ok) {
                // Re-queue events on failure
                this.eventQueue.unshift(...events);
            }
        } catch (error) {
            // Server not running, re-queue events
            this.eventQueue.unshift(...events);
        }
    }

    dispose(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        // Final flush
        this.flush();
    }
}
