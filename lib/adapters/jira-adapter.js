export class JiraAdapter {
    constructor(config) {
        this.host = config.host;
        this.email = config.email;
        this.apiToken = config.api_token;
        this.projectKey = config.project_key;

        if (!this.host || !this.email || !this.apiToken || !this.projectKey) {
            throw new Error("Jira Adapter requires host, email, api_token, and project_key");
        }
    }

    async request(endpoint, method = 'GET', body = null) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
        const headers = {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        const options = { method, headers, signal: controller.signal };
        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(`${this.host}/rest/api/3/${endpoint}`, options);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Jira API Error ${response.status}: ${text}`);
            }
            // 204 No Content
            if (response.status === 204) return null;
            return response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async createTask(title, description = '', type = 'Task') {
        const body = {
            fields: {
                project: { key: this.projectKey },
                summary: title,
                description: this.adfDescription(description),
                issuetype: { name: type }
            }
        };

        const response = await this.request('issue', 'POST', body);
        if (!response?.id || !response?.key) {
            throw new Error('Unexpected Jira API response: missing id or key');
        }
        console.log(`Created Jira issue: ${response.key}`);
        return { id: response.id, key: response.key, url: `${this.host}/browse/${response.key}` };
    }

    // Convert plain text to Atlassian Document Format (simple version)
    adfDescription(text) {
        return {
            type: "doc",
            version: 1,
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: text || " "
                        }
                    ]
                }
            ]
        };
    }

    async logWork(id, timeSpent, comment = '') {
        // timeSpent format: "1h 30m"
        // endpoint: /issue/{issueIdOrKey}/worklog
        const body = {
            timeSpent: timeSpent,
            comment: this.adfDescription(comment)
        };
        await this.request(`issue/${id}/worklog`, 'POST', body);
        console.log(`Logged work for ${id}`);
    }

    async createSubtask(parentId, title) {
        const body = {
            fields: {
                project: { key: this.projectKey },
                parent: { key: parentId },
                summary: title,
                issuetype: { name: 'Sub-task' }
            }
        };
        const response = await this.request('issue', 'POST', body);
        return { id: response.id, key: response.key, url: `${this.host}/browse/${response.key}` };
    }
}
