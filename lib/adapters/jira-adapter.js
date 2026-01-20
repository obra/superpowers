export class JiraAdapter {
    constructor(config) {
        this.host = config.host;
        this.email = config.email;
        this.apiToken = config.api_token;
        this.projectKey = config.project_key; // Needs to be added to config

        if (!this.host || !this.email || !this.apiToken) {
            throw new Error("Jira Adapter requires host, email, and api_token");
        }
    }

    async request(endpoint, method = 'GET', body = null) {
        const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
        const headers = {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${this.host}/rest/api/3/${endpoint}`, options);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Jira API Error ${response.status}: ${text}`);
        }
        // 204 No Content
        if (response.status === 204) return null;
        return response.json();
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
