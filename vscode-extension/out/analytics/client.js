"use strict";
/**
 * Analytics Client
 * Sends usage events to the analytics dashboard
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsClient = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Client for sending analytics events to the dashboard server.
 * Handles batching, retry logic, and graceful disposal.
 */
class AnalyticsClient {
    /**
     * Creates a new AnalyticsClient instance.
     * @param enabled - Whether analytics tracking is enabled
     * @param port - Port number for the analytics server
     */
    constructor(enabled, port) {
        this.eventQueue = [];
        this.isDisposed = false;
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
    async trackEvent(type, data = {}) {
        if (!this.enabled || this.isDisposed) {
            return;
        }
        const event = {
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
    async trackSkillInvocation(skillName, metadata = {}) {
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
    async trackCodeAction(action, skillName) {
        await this.trackEvent('code_action', {
            action,
            skillName
        });
    }
    /**
     * Flushes queued events to the analytics server.
     * Re-queues events on failure for retry.
     */
    async flush() {
        if (this.eventQueue.length === 0 || this.isDisposed) {
            return;
        }
        const events = [...this.eventQueue];
        this.eventQueue = [];
        let timeoutId;
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
        }
        catch {
            // Server not running or request failed
            // Re-queue events (limit queue size)
            if (this.eventQueue.length < 1000) {
                this.eventQueue.unshift(...events);
            }
        }
        finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }
    /**
     * Disposes the client, flushing any remaining events first.
     * Must be awaited to ensure final flush completes.
     */
    async dispose() {
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
exports.AnalyticsClient = AnalyticsClient;
//# sourceMappingURL=client.js.map