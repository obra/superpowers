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
class AnalyticsClient {
    constructor(enabled, port) {
        this.eventQueue = [];
        this.enabled = enabled;
        this.port = port;
        if (enabled) {
            // Flush events every 30 seconds
            this.flushInterval = setInterval(() => this.flush(), 30000);
        }
    }
    async trackEvent(type, data = {}) {
        if (!this.enabled)
            return;
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
    async trackSkillInvocation(skillName, metadata = {}) {
        await this.trackEvent('skill_invoked', {
            skillName,
            ...metadata
        });
    }
    async trackCodeAction(action, skillName) {
        await this.trackEvent('code_action', {
            action,
            skillName
        });
    }
    async flush() {
        if (this.eventQueue.length === 0)
            return;
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
        }
        catch (error) {
            // Server not running, re-queue events
            this.eventQueue.unshift(...events);
        }
    }
    dispose() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        // Final flush
        this.flush();
    }
}
exports.AnalyticsClient = AnalyticsClient;
//# sourceMappingURL=client.js.map