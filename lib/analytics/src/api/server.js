/**
 * Superpowers Analytics API
 * 
 * This module provides analytics endpoints for tracking skill usage,
 * token consumption, and workflow efficiency metrics.
 * 
 * Integration: Copy this file to superpowers/lib/analytics/api.js
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Analytics storage (in production, use a proper database)
class AnalyticsStore {
    constructor(dataDir = './analytics-data') {
        this.dataDir = dataDir;
        this.sessions = new Map();
        this.skillMetrics = new Map();
        this.ensureDataDir();
    }

    ensureDataDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        this.loadPersistedData();
    }

    loadPersistedData() {
        const metricsFile = path.join(this.dataDir, 'metrics.json');
        if (fs.existsSync(metricsFile)) {
            const data = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
            this.skillMetrics = new Map(Object.entries(data.skillMetrics || {}));
        }
    }

    persistData() {
        const metricsFile = path.join(this.dataDir, 'metrics.json');
        const data = {
            skillMetrics: Object.fromEntries(this.skillMetrics),
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(metricsFile, JSON.stringify(data, null, 2));
    }

    recordSkillInvocation(skillName, metadata = {}) {
        const key = skillName;
        const current = this.skillMetrics.get(key) || {
            invocations: 0,
            totalTokens: 0,
            avgDuration: 0,
            successRate: 0,
            successes: 0,
            failures: 0,
            totalDuration: 0,
            lastInvoked: null,
            platforms: {}
        };

        current.invocations++;
        current.lastInvoked = new Date().toISOString();
        
        if (metadata.tokens) {
            current.totalTokens += metadata.tokens;
        }
        
        if (metadata.duration) {
            current.totalDuration += metadata.duration;
            current.avgDuration = Math.round(current.totalDuration / current.invocations);
        }
        
        if (metadata.success) {
            current.successes++;
        } else if (metadata.success === false) {
            current.failures++;
        }
        current.successRate = Math.round((current.successes / current.invocations) * 100);

        if (metadata.platform) {
            current.platforms[metadata.platform] = (current.platforms[metadata.platform] || 0) + 1;
        }

        this.skillMetrics.set(key, current);
        this.persistData();
        return current;
    }

    getSkillMetrics(skillName) {
        return this.skillMetrics.get(skillName);
    }

    getAllMetrics() {
        return Object.fromEntries(this.skillMetrics);
    }

    getAggregatedStats() {
        const metrics = Array.from(this.skillMetrics.values());
        return {
            totalInvocations: metrics.reduce((sum, m) => sum + m.invocations, 0),
            totalTokens: metrics.reduce((sum, m) => sum + m.totalTokens, 0),
            avgSuccessRate: metrics.length > 0 
                ? Math.round(metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length)
                : 0,
            topSkills: this.getTopSkills(5),
            skillsCount: this.skillMetrics.size
        };
    }

    getTopSkills(limit = 5) {
        return Array.from(this.skillMetrics.entries())
            .sort((a, b) => b[1].invocations - a[1].invocations)
            .slice(0, limit)
            .map(([name, metrics]) => ({ name, ...metrics }));
    }

    getSkillTrend(skillName, days = 7) {
        // In production, this would query time-series data
        // For now, return mock trend data
        const trend = [];
        const baseInvocations = Math.floor(Math.random() * 10) + 1;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            trend.push({
                date: date.toISOString().split('T')[0],
                invocations: baseInvocations + Math.floor(Math.random() * 5),
                avgTokens: 500 + Math.floor(Math.random() * 500),
                successRate: 85 + Math.floor(Math.random() * 15)
            });
        }
        return trend;
    }
}

// JSONL Session Parser
class SessionParser {
    constructor() {
        this.patterns = {
            skillInvocation: /"name"\s*:\s*"Skill"[^}]*"skill"\s*:\s*"([^"]+)"/g,
            tokenUsage: /"input_tokens"\s*:\s*(\d+)[^}]*"output_tokens"\s*:\s*(\d+)/g,
            subagentDispatch: /"name"\s*:\s*"Task"/g,
            toolUse: /"name"\s*:\s*"(\w+)"/g
        };
    }

    parseSessionFile(filepath) {
        const content = fs.readFileSync(filepath, 'utf8');
        const lines = content.trim().split('\n');
        const session = {
            id: path.basename(filepath, '.jsonl'),
            skills: [],
            totalInputTokens: 0,
            totalOutputTokens: 0,
            subagentCount: 0,
            tools: [],
            duration: 0,
            startTime: null,
            endTime: null
        };

        lines.forEach((line, index) => {
            try {
                const entry = JSON.parse(line);
                
                // Extract timestamp
                if (entry.timestamp && !session.startTime) {
                    session.startTime = entry.timestamp;
                }
                if (entry.timestamp) {
                    session.endTime = entry.timestamp;
                }

                // Extract skill invocations
                const lineStr = JSON.stringify(entry);
                
                // Match skill invocations
                let match;
                while ((match = this.patterns.skillInvocation.exec(lineStr)) !== null) {
                    if (!session.skills.includes(match[1])) {
                        session.skills.push(match[1]);
                    }
                }

                // Match token usage
                while ((match = this.patterns.tokenUsage.exec(lineStr)) !== null) {
                    session.totalInputTokens += parseInt(match[1]) || 0;
                    session.totalOutputTokens += parseInt(match[2]) || 0;
                }

                // Count subagent dispatches
                if (lineStr.includes('"name":"Task"')) {
                    session.subagentCount++;
                }

                // Extract tool uses
                if (entry.message?.content) {
                    const content = entry.message.content;
                    if (Array.isArray(content)) {
                        content.forEach(item => {
                            if (item.type === 'tool_use' && item.name) {
                                session.tools.push(item.name);
                            }
                        });
                    }
                }

            } catch (e) {
                // Skip malformed lines
            }
        });

        if (session.startTime && session.endTime) {
            session.duration = new Date(session.endTime) - new Date(session.startTime);
        }

        return session;
    }

    parseAllSessions(sessionsDir) {
        const sessions = [];
        if (!fs.existsSync(sessionsDir)) {
            return sessions;
        }

        const files = fs.readdirSync(sessionsDir)
            .filter(f => f.endsWith('.jsonl'));

        files.forEach(file => {
            try {
                const session = this.parseSessionFile(path.join(sessionsDir, file));
                sessions.push(session);
            } catch (e) {
                console.error(`Failed to parse ${file}:`, e.message);
            }
        });

        return sessions;
    }
}

// Create Express app
function createAnalyticsApp(options = {}) {
    const app = express();
    const store = new AnalyticsStore(options.dataDir);
    const parser = new SessionParser();
    const events = new EventEmitter();

    app.use(cors());
    app.use(express.json());

    // Serve static dashboard files
    app.use(express.static(path.join(__dirname, 'public')));

    // API Routes

    /**
     * GET /api/metrics
     * Returns all skill metrics
     */
    app.get('/api/metrics', (req, res) => {
        res.json({
            skills: store.getAllMetrics(),
            aggregated: store.getAggregatedStats()
        });
    });

    /**
     * GET /api/metrics/:skillName
     * Returns metrics for a specific skill
     */
    app.get('/api/metrics/:skillName', (req, res) => {
        const metrics = store.getSkillMetrics(req.params.skillName);
        if (!metrics) {
            return res.status(404).json({ error: 'Skill not found' });
        }
        res.json(metrics);
    });

    /**
     * GET /api/metrics/:skillName/trend
     * Returns trend data for a specific skill
     */
    app.get('/api/metrics/:skillName/trend', (req, res) => {
        const days = parseInt(req.query.days) || 7;
        const trend = store.getSkillTrend(req.params.skillName, days);
        res.json(trend);
    });

    /**
     * POST /api/events
     * Records a skill invocation event
     */
    app.post('/api/events', (req, res) => {
        const { skillName, tokens, duration, success, platform } = req.body;
        
        if (!skillName) {
            return res.status(400).json({ error: 'skillName is required' });
        }

        const metrics = store.recordSkillInvocation(skillName, {
            tokens: tokens || 0,
            duration: duration || 0,
            success: success !== false,
            platform: platform || 'unknown'
        });

        events.emit('skill-invoked', { skillName, metrics });
        
        res.json({ success: true, metrics });
    });

    /**
     * POST /api/sessions/import
     * Import and parse session files
     */
    app.post('/api/sessions/import', (req, res) => {
        const { sessionsDir } = req.body;
        
        if (!sessionsDir) {
            return res.status(400).json({ error: 'sessionsDir is required' });
        }

        const sessions = parser.parseAllSessions(sessionsDir);
        
        // Record metrics from parsed sessions
        sessions.forEach(session => {
            session.skills.forEach(skillName => {
                store.recordSkillInvocation(skillName, {
                    tokens: session.totalInputTokens + session.totalOutputTokens,
                    duration: session.duration,
                    success: true,
                    platform: 'claude-code'
                });
            });
        });

        res.json({ 
            imported: sessions.length,
            sessions: sessions.map(s => ({
                id: s.id,
                skills: s.skills,
                totalTokens: s.totalInputTokens + s.totalOutputTokens,
                subagentCount: s.subagentCount
            }))
        });
    });

    /**
     * GET /api/sessions/analyze
     * Analyze sessions from Claude Code projects directory
     */
    app.get('/api/sessions/analyze', (req, res) => {
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        const claudeDir = path.join(homeDir, '.claude', 'projects');
        
        const sessions = parser.parseAllSessions(claudeDir);
        res.json({
            sessionsDir: claudeDir,
            totalSessions: sessions.length,
            sessions: sessions.slice(0, 20) // Return first 20 for preview
        });
    });

    /**
     * GET /api/recommendations
     * Get AI-powered recommendations based on usage patterns
     */
    app.get('/api/recommendations', (req, res) => {
        const stats = store.getAggregatedStats();
        const recommendations = [];

        // Generate recommendations based on metrics
        if (stats.totalInvocations > 0) {
            const topSkill = stats.topSkills[0];
            
            if (topSkill && topSkill.successRate < 90) {
                recommendations.push({
                    type: 'optimization',
                    priority: 'high',
                    message: `Your most-used skill "${topSkill.name}" has a ${topSkill.successRate}% success rate. Consider reviewing error patterns.`,
                    skill: topSkill.name
                });
            }

            if (stats.avgSuccessRate < 85) {
                recommendations.push({
                    type: 'training',
                    priority: 'medium',
                    message: 'Overall success rate is below 85%. Consider using the systematic-debugging skill earlier in your workflow.',
                    skill: 'systematic-debugging'
                });
            }

            // Token optimization recommendations
            if (stats.totalTokens > 100000) {
                recommendations.push({
                    type: 'cost',
                    priority: 'medium',
                    message: `You've used ${(stats.totalTokens / 1000).toFixed(0)}K tokens. Consider using cheaper models for simple tasks.`,
                    actionable: true
                });
            }

            // Skill usage recommendations
            const skills = store.getAllMetrics();
            const hasDebugging = Object.keys(skills).some(s => s.includes('debugging'));
            const hasTDD = Object.keys(skills).some(s => s.includes('test-driven'));

            if (!hasDebugging && stats.totalInvocations > 10) {
                recommendations.push({
                    type: 'discovery',
                    priority: 'low',
                    message: 'You haven\'t used the systematic-debugging skill. It can help reduce debugging time significantly.',
                    skill: 'systematic-debugging'
                });
            }

            if (!hasTDD && stats.totalInvocations > 10) {
                recommendations.push({
                    type: 'discovery',
                    priority: 'low',
                    message: 'Consider using test-driven-development skill for better code quality.',
                    skill: 'test-driven-development'
                });
            }
        }

        res.json({ recommendations });
    });

    /**
     * GET /api/health
     * Health check endpoint
     */
    app.get('/api/health', (req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    return { app, store, parser, events };
}

// CLI entry point
if (require.main === module) {
    const port = process.env.ANALYTICS_PORT || 3334;
    const { app } = createAnalyticsApp();
    
    app.listen(port, () => {
        console.log(JSON.stringify({
            type: 'analytics-server-started',
            port: port,
            url: `http://localhost:${port}`,
            message: 'Superpowers Analytics Dashboard running'
        }));
    });
}

module.exports = { createAnalyticsApp, AnalyticsStore, SessionParser };
